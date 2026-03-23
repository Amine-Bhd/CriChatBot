"""
embed_and_upload.py — CRI-RSK RAG Pipeline
============================================
Reads supabase_chunks.json → embeds with Gemini → uploads to Supabase pgvector

Install dependencies:
    pip install supabase google-generativeai python-dotenv

Create a .env file in the same directory with:
    GEMINI_API_KEY=your_gemini_api_key_here
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your_service_role_key_here   ← use service role, NOT anon key

Usage:
    python embed_and_upload.py
    python embed_and_upload.py --dry-run        # test without uploading
    python embed_and_upload.py --reset          # clears the table first
    python embed_and_upload.py --file path/to/other_chunks.json
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from supabase import create_client, Client

# ─── CONFIG ──────────────────────────────────────────────────────────────────

load_dotenv()

GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY")
SUPABASE_URL        = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Gemini embedding model — must match what your n8n Embeddings node uses
# "models/embedding-001" → 768 dimensions (default Gemini embeddings)
GEMINI_EMBEDDING_MODEL = "models/embedding-001"
EMBEDDING_TASK_TYPE    = "retrieval_document"   # correct type for RAG indexing

# Supabase table — must match your n8n Supabase Vector Store node config
SUPABASE_TABLE   = "documents"
SUPABASE_CONTENT_COL   = "content"     # text column
SUPABASE_METADATA_COL  = "metadata"    # jsonb column
SUPABASE_EMBEDDING_COL = "embedding"   # vector column

# Batching — Gemini free tier: 60 req/min → safe at 1 req/sec
BATCH_SIZE        = 10    # chunks per Supabase insert batch
EMBED_DELAY_SEC   = 1.1   # delay between Gemini API calls (rate limit safety)

DEFAULT_CHUNKS_FILE = Path("scraped_data2/supabase_chunks.json")

# ─── VALIDATION ──────────────────────────────────────────────────────────────

def validate_env():
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_KEY:
        missing.append("SUPABASE_SERVICE_KEY")
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("   Create a .env file with these values. See script header for details.")
        sys.exit(1)

# ─── EMBEDDING ───────────────────────────────────────────────────────────────

def get_embedding(text: str, retries: int = 3) -> list[float] | None:
    """
    Embed a single text using Gemini embedding-001.
    Returns a list of 768 floats, or None on failure.
    """
    for attempt in range(retries):
        try:
            result = genai.embed_content(
                model=GEMINI_EMBEDDING_MODEL,
                content=text,
                task_type=EMBEDDING_TASK_TYPE,
            )
            return result["embedding"]
        except Exception as e:
            wait = (attempt + 1) * 3
            print(f"    ⚠  Gemini error (attempt {attempt+1}/{retries}): {e}")
            if attempt < retries - 1:
                print(f"    ⏳ Retrying in {wait}s...")
                time.sleep(wait)
    return None

# ─── SUPABASE ────────────────────────────────────────────────────────────────

def reset_table(sb: Client):
    """Delete all rows from the documents table."""
    print(f"🗑  Clearing table '{SUPABASE_TABLE}'...")
    sb.table(SUPABASE_TABLE).delete().neq("id", 0).execute()
    print("   ✓ Table cleared.")


def insert_batch(sb: Client, batch: list[dict], dry_run: bool = False):
    """Insert a batch of records into Supabase."""
    if dry_run:
        print(f"   [DRY RUN] Would insert {len(batch)} records")
        return

    try:
        sb.table(SUPABASE_TABLE).insert(batch).execute()
    except Exception as e:
        print(f"   ❌ Supabase insert error: {e}")
        raise

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Embed chunks with Gemini and upload to Supabase")
    parser.add_argument("--file",    default=str(DEFAULT_CHUNKS_FILE), help="Path to supabase_chunks.json")
    parser.add_argument("--dry-run", action="store_true", help="Embed but don't upload")
    parser.add_argument("--reset",   action="store_true", help="Clear the Supabase table before uploading")
    args = parser.parse_args()

    # ── Validate ─────────────────────────────────────────────────────────────
    validate_env()

    chunks_path = Path(args.file)
    if not chunks_path.exists():
        print(f"❌ File not found: {chunks_path}")
        sys.exit(1)

    # ── Init clients ─────────────────────────────────────────────────────────
    genai.configure(api_key=GEMINI_API_KEY)
    sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # ── Load chunks ───────────────────────────────────────────────────────────
    with open(chunks_path, encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"\n📂 Loaded {len(chunks)} chunks from {chunks_path}")

    # ── Language breakdown ────────────────────────────────────────────────────
    lang_counts = {}
    for c in chunks:
        lang = c.get("metadata", {}).get("langue", "unknown")
        lang_counts[lang] = lang_counts.get(lang, 0) + 1
    print(f"🌐 Language breakdown: {lang_counts}")

    if args.dry_run:
        print("\n⚠  DRY RUN mode — no data will be written to Supabase\n")

    # ── Optional reset ────────────────────────────────────────────────────────
    if args.reset and not args.dry_run:
        reset_table(sb)

    # ── Embed + upload ────────────────────────────────────────────────────────
    print(f"\n🚀 Embedding {len(chunks)} chunks with Gemini ({GEMINI_EMBEDDING_MODEL})...\n")

    batch        = []
    success_count = 0
    fail_count    = 0

    for i, chunk in enumerate(chunks):
        page_content = chunk.get("pageContent", "")
        metadata     = chunk.get("metadata", {})

        if not page_content.strip():
            print(f"  [{i+1}/{len(chunks)}] ⚠  Empty content, skipping.")
            fail_count += 1
            continue

        # Embed
        embedding = get_embedding(page_content)
        if embedding is None:
            print(f"  [{i+1}/{len(chunks)}] ❌ Embedding failed, skipping.")
            fail_count += 1
            continue

        # Build Supabase record
        # Column names match both the Supabase schema and n8n's Vector Store node
        record = {
            SUPABASE_CONTENT_COL:   page_content,
            SUPABASE_METADATA_COL:  metadata,
            SUPABASE_EMBEDDING_COL: embedding,
        }
        batch.append(record)

        lang  = metadata.get("langue", "?")
        title = metadata.get("title", "")[:40]
        print(f"  [{i+1}/{len(chunks)}] ✓ Embedded [{lang}] — {title}")

        # Insert batch when full
        if len(batch) >= BATCH_SIZE:
            insert_batch(sb, batch, dry_run=args.dry_run)
            success_count += len(batch)
            batch = []
            print(f"  💾 Inserted batch — {success_count}/{len(chunks)} done")

        # Rate limit safety
        time.sleep(EMBED_DELAY_SEC)

    # Insert remaining
    if batch:
        insert_batch(sb, batch, dry_run=args.dry_run)
        success_count += len(batch)

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"""
{'='*60}
✅ Upload complete
   Chunks embedded : {success_count}
   Chunks skipped  : {fail_count}
   Table           : {SUPABASE_URL}/{SUPABASE_TABLE}
   Dry run         : {args.dry_run}
{'='*60}

Next steps in n8n:
  1. Your Supabase Vector Store node (retrieve-as-tool) is already
     pointed at the 'documents' table — no changes needed there.
  2. Make sure the Embeddings Google Gemini node in your retrieval
     branch also uses 'models/embedding-001' (must match indexing).
  3. Test by sending a question through your Webhook → AI Agent flow.
  4. The AI Agent will use the vector store as a tool and cite
     metadata.source_url + metadata.title in its responses.
""")


if __name__ == "__main__":
    main()
