"""
Playwright Scraper for cri-invest.ma  (v4 — PFE-aligned + Supabase-ready)
=========================================================================
Aligned with: FQIA – PFF N°1 (Agent conversationnel IA multilingue CRI-RSK)
  Section 7.1 — ETL metadata: URL, titre, DATE, LANGUE  ← now included
  Section 3   — Multilinguisme FR/AR/EN                 ← language detection
  Section 7.1 — Supabase Vector Store compatible output ← supabase_chunks.json

Output files:
  scraped_data/pages.json           → full page records
  scraped_data/chunks.json          → standard chunks (debug/inspection)
  scraped_data/supabase_chunks.json → ⭐ Supabase/n8n-ready format
  scraped_data/raw_text/            → one .txt per page/pdf

Install dependencies:
    pip install playwright beautifulsoup4 pymupdf aiohttp langdetect
    playwright install chromium
"""

import asyncio
import json
import re
import ssl
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs, urlencode

import aiohttp
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

try:
    from langdetect import detect, LangDetectException
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("⚠  langdetect not installed. Language detection will use heuristics.")

# ─── CONFIG ──────────────────────────────────────────────────────────────────

BASE_URL      = "https://www.cri-invest.ma"
OUTPUT_DIR    = Path("scraped_data2")
MAX_PAGES     = 150
CHUNK_SIZE    = 500         # words per RAG chunk
CHUNK_OVERLAP = 50          # overlapping words between chunks
WAIT_MS       = 3500        # ms to wait for JS render (more needed with domcontentloaded)
HEADLESS      = True
MIN_WORDS     = 80          # skip near-empty pages

# Auth/UI pages — no useful RAG content
SKIP_URL_PREFIXES = [
    "/login", "/sign-up", "/forgotten-password",
    "/dashboard", "/framing-form",
]

# These are PDF download URLs
PDF_URL_PREFIX = "/backend/api/uploaded-file/"

# Tracking params to strip before URL deduplication
STRIP_QUERY_PARAMS = {"csrt"}

# Noise elements to remove before text extraction
NOISE_SELECTORS = [
    "nav", "footer", "header", ".cookie-banner",
    ".navbar", ".sidebar", "[aria-hidden='true']",
    "script", "style", "noscript", "iframe",
]

# ─── LANGUAGE DETECTION ──────────────────────────────────────────────────────

def has_arabic(text: str) -> bool:
    """Check if text contains Arabic characters."""
    return any(unicodedata.name(c, "").startswith("ARABIC") for c in text if c.strip())


def detect_language(text: str) -> str:
    """
    Detect language code: 'fr', 'ar', 'en', or 'fr+ar' for mixed.
    Required by spec section 7.1 (métadonnées: URL, titre, date, langue).
    """
    sample = text[:2000]  # use first 2000 chars for speed

    arabic_chars = sum(1 for c in sample if unicodedata.name(c, "").startswith("ARABIC"))
    total_alpha  = sum(1 for c in sample if c.isalpha())

    if total_alpha == 0:
        return "unknown"

    arabic_ratio = arabic_chars / total_alpha

    if arabic_ratio > 0.6:
        return "ar"
    elif arabic_ratio > 0.15:
        return "fr+ar"   # bilingual — most PDFs on this site
    else:
        # Use langdetect for Latin-script disambiguation (fr vs en)
        if LANGDETECT_AVAILABLE:
            try:
                return detect(sample)
            except LangDetectException:
                pass
        return "fr"  # safe default for this site


def extract_french_portion(text: str) -> str:
    """
    For bilingual FR/AR documents: keep only French sentences.
    Splits on sentence boundaries and drops Arabic-heavy sentences.
    This ensures clean embeddings for French queries.
    """
    sentences = re.split(r"(?<=[.!?])\s+", text)
    french_sentences = []
    for s in sentences:
        ar = sum(1 for c in s if unicodedata.name(c, "").startswith("ARABIC"))
        total = sum(1 for c in s if c.isalpha())
        if total == 0 or (ar / total) < 0.3:
            french_sentences.append(s)
    return " ".join(french_sentences).strip()


# ─── TEXT HELPERS ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    words = text.split()
    chunks, start = [], 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start += chunk_size - overlap
    return chunks


# ─── URL HELPERS ─────────────────────────────────────────────────────────────

def is_internal(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc == "" or parsed.netloc.endswith("cri-invest.ma")


def is_pdf_url(url: str) -> bool:
    path = urlparse(url).path
    return path.startswith(PDF_URL_PREFIX) or path.lower().endswith(".pdf")


def should_skip(url: str) -> bool:
    path = urlparse(url).path
    return any(path.startswith(p) for p in SKIP_URL_PREFIXES)


def normalize_url(url: str, base: str = BASE_URL) -> str:
    full = urljoin(base, url)
    parsed = urlparse(full)
    qs = {k: v for k, v in parse_qs(parsed.query, keep_blank_values=True).items()
          if k not in STRIP_QUERY_PARAMS}
    return parsed._replace(fragment="", query=urlencode(qs, doseq=True)).geturl().rstrip("/")


# ─── PDF HELPERS ─────────────────────────────────────────────────────────────

def extract_pdf_text(pdf_bytes: bytes) -> str:
    parts = []
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for i in range(doc.page_count):
            parts.append(doc.load_page(i).get_text("text"))
        doc.close()
    except Exception as e:
        print(f"    ⚠  PyMuPDF: {e}")
    return clean_text(" ".join(parts))


async def download_pdf(session: aiohttp.ClientSession, url: str) -> bytes | None:
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as r:
            if r.status == 200:
                return await r.read()
            print(f"    ✗ HTTP {r.status}")
    except Exception as e:
        print(f"    ✗ Download failed: {e}")
    return None


# ─── SCRAPER ─────────────────────────────────────────────────────────────────

class CRIScraper:
    def __init__(self):
        self.visited:   set[str]  = set()
        self.queue:     list[str] = [BASE_URL]
        self.pages:     list[dict] = []
        self.pdf_queue: set[str]  = set()
        self.crawl_date = datetime.now(timezone.utc).isoformat()

        OUTPUT_DIR.mkdir(exist_ok=True)
        (OUTPUT_DIR / "raw_text").mkdir(exist_ok=True)
        (OUTPUT_DIR / "pdfs").mkdir(exist_ok=True)

    async def extract_page(self, page, url: str) -> dict | None:
        # Strategy: try domcontentloaded first (fast), fall back to load, then commit
        # networkidle is avoided — SPAs with background polling never reach it
        for wait_strategy in ("domcontentloaded", "load", "commit"):
            try:
                print(f"  ↳ Fetching: {url}")
                await page.goto(url, wait_until=wait_strategy, timeout=45_000)
                # Manual wait for JS framework to render content
                await page.wait_for_timeout(WAIT_MS)
                break  # success — exit retry loop
            except Exception as e:
                if wait_strategy == "commit":
                    print(f"    ✗ All strategies failed: {e}")
                    return None
                print(f"    ⚠  '{wait_strategy}' timed out, retrying with next strategy...")
                continue

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        for sel in NOISE_SELECTORS:
            for tag in soup.select(sel):
                tag.decompose()

        title     = soup.title.get_text(strip=True) if soup.title else ""
        meta_tag  = soup.find("meta", attrs={"name": "description"})
        meta_desc = meta_tag.get("content", "") if meta_tag else ""
        text      = clean_text((soup.find("body") or soup).get_text(separator=" "))
        langue    = detect_language(text)                    # ← SPEC §7.1

        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith(("mailto:", "tel:", "javascript:")):
                continue
            norm = normalize_url(href, url)
            if not is_internal(norm):
                continue
            if is_pdf_url(norm):
                if norm not in self.pdf_queue:
                    self.pdf_queue.add(norm)
                    print(f"    📎 PDF queued: {norm}")
            elif not should_skip(norm) and norm not in self.visited:
                links.append(norm)

        return {
            "url":              url,
            "title":            title,
            "meta_description": meta_desc,
            "text":             text,
            "langue":           langue,           # ← SPEC §7.1
            "date_crawl":       self.crawl_date,  # ← SPEC §7.1
            "source_type":      "page",
            "links":            links,
        }

    async def process_pdfs(self):
        if not self.pdf_queue:
            print("\n  ℹ  No PDFs found.")
            return

        print(f"\n📥 Processing {len(self.pdf_queue)} PDFs...\n")
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=ssl_ctx)
        ) as session:
            for pdf_url in sorted(self.pdf_queue):
                print(f"  ↳ PDF: {pdf_url}")
                pdf_bytes = await download_pdf(session, pdf_url)
                if not pdf_bytes:
                    continue

                # Save raw PDF
                pdf_id   = re.sub(r"[^\w]", "_", pdf_url.replace(BASE_URL, ""))[:80]
                pdf_path = OUTPUT_DIR / "pdfs" / f"{pdf_id}.pdf"
                pdf_path.write_bytes(pdf_bytes)

                # Extract full text
                full_text = extract_pdf_text(pdf_bytes)
                langue    = detect_language(full_text)

                # For bilingual PDFs: extract clean French portion for embeddings
                # but keep original full text in raw_text for reference
                if langue == "fr+ar":
                    embed_text = extract_french_portion(full_text)
                    print(f"    🌐 Bilingual FR+AR — using French portion for embeddings")
                else:
                    embed_text = full_text

                word_count = len(embed_text.split())
                if word_count < 10:
                    print(f"    ⚠  Too little text ({word_count} words), skipping.")
                    continue

                path_parts = urlparse(pdf_url).path.strip("/").split("/")
                title = " ".join(p for p in path_parts if not p.isdigit()).replace("-", " ").title()

                record = {
                    "url":              pdf_url,
                    "title":            title or "Document PDF",
                    "meta_description": "",
                    "text":             embed_text,   # clean text for embeddings
                    "full_text":        full_text,    # preserved full bilingual text
                    "langue":           langue,
                    "date_crawl":       self.crawl_date,
                    "source_type":      "pdf",
                }
                self.pages.append(record)

                (OUTPUT_DIR / "raw_text" / f"{pdf_id}.txt").write_text(
                    f"URL: {pdf_url}\nTITLE: {title}\nLANGUE: {langue}\nSOURCE: pdf\n\n{full_text}",
                    encoding="utf-8",
                )
                print(f"    ✓ {word_count} words [{langue}]")

    async def run(self):
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=HEADLESS,
                args=["--ignore-certificate-errors"],
            )
            ctx = await browser.new_context(
                ignore_https_errors=True,
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = await ctx.new_page()
            print(f"\n🚀 Starting crawl — {BASE_URL}\n")

            while self.queue and len(self.visited) < MAX_PAGES:
                url = self.queue.pop(0)
                if url in self.visited or should_skip(url):
                    continue
                self.visited.add(url)

                result = await self.extract_page(page, url)
                if not result:
                    continue

                wc = len(result["text"].split())
                if wc < MIN_WORDS:
                    print(f"    ⚠  Too few words ({wc}), skipping.")
                    continue

                self.pages.append(result)
                print(f"    ✓ {wc} words [{result['langue']}] — \"{result['title']}\"")

                for link in result["links"]:
                    if link not in self.visited and link not in self.queue:
                        self.queue.append(link)

                safe = re.sub(r"[^\w]", "_", url.replace(BASE_URL, ""))[:80] or "index"
                (OUTPUT_DIR / "raw_text" / f"{safe}.txt").write_text(
                    f"URL: {url}\nTITLE: {result['title']}\n"
                    f"LANGUE: {result['langue']}\nDATE: {result['date_crawl']}\n"
                    f"SOURCE: page\n\n{result['text']}",
                    encoding="utf-8",
                )

            await browser.close()

        await self.process_pdfs()
        print(f"\n✅ Done — {len(self.pages)} sources scraped")
        self._save_outputs()

    # ─── OUTPUT ──────────────────────────────────────────────────────────────

    def _save_outputs(self):
        pages_n = sum(1 for p in self.pages if p["source_type"] == "page")
        pdfs_n  = sum(1 for p in self.pages if p["source_type"] == "pdf")

        # ── 1. pages.json (full records) ────────────────────────────────
        with open(OUTPUT_DIR / "pages.json", "w", encoding="utf-8") as f:
            json.dump(self.pages, f, ensure_ascii=False, indent=2)
        print(f"📄 pages.json        ({pages_n} pages + {pdfs_n} PDFs)")

        # ── 2. chunks.json (debug / inspection) ─────────────────────────
        standard_chunks = self._build_chunks(supabase_format=False)
        with open(OUTPUT_DIR / "chunks.json", "w", encoding="utf-8") as f:
            json.dump(standard_chunks, f, ensure_ascii=False, indent=2)
        print(f"🧩 chunks.json       ({len(standard_chunks)} chunks)")

        # ── 3. supabase_chunks.json ⭐ (n8n / Supabase pgvector) ────────
        #
        # Supabase Vector Store node in n8n expects:
        #   { "pageContent": "...", "metadata": { ... } }
        #
        # The metadata fields flow directly into the `documents` table.
        # Required fields match Langchain's Document interface.
        #
        supabase_chunks = self._build_chunks(supabase_format=True)
        with open(OUTPUT_DIR / "supabase_chunks.json", "w", encoding="utf-8") as f:
            json.dump(supabase_chunks, f, ensure_ascii=False, indent=2)
        print(f"🗄  supabase_chunks.json ({len(supabase_chunks)} chunks) ← use this in n8n")

        # ── 4. Language breakdown summary ───────────────────────────────
        langs = {}
        for c in standard_chunks:
            l = c["metadata"]["langue"]
            langs[l] = langs.get(l, 0) + 1
        print(f"\n🌐 Language breakdown: {langs}")
        print(f"📁 All outputs in: ./{OUTPUT_DIR}/\n")

        print("""
How to import supabase_chunks.json into n8n → Supabase Vector Store:
─────────────────────────────────────────────────────────────────────
Option A — Direct insert via n8n:
  1. Add a "Read Binary File" node pointing to supabase_chunks.json
  2. Add a "Code" node to loop over items and format as:
       { json: { pageContent: item.pageContent, metadata: item.metadata } }
  3. Connect to your "Supabase Vector Store" (insert mode) node
  4. The Gemini embeddings node will embed pageContent automatically

Option B — Python script (faster for bulk):
  pip install supabase sentence-transformers (or use openai)
  Then run embed_and_upload.py (see next script to generate)

Supabase table schema needed (run in Supabase SQL editor):
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE documents (
    id        bigserial PRIMARY KEY,
    content   text,
    metadata  jsonb,
    embedding vector(768)   -- 768 for Gemini, 1536 for OpenAI ada-002
  );
  CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
""")

    def _build_chunks(self, supabase_format: bool) -> list[dict]:
        chunks_out = []
        chunk_id   = 0

        for p in self.pages:
            text_chunks = chunk_text(p["text"])
            for i, chunk in enumerate(text_chunks):

                # Shared metadata — matches spec §7.1 (URL, titre, date, langue)
                metadata = {
                    "source_url":       p["url"],
                    "title":            p["title"],
                    "langue":           p["langue"],           # ← SPEC §7.1
                    "date_crawl":       p["date_crawl"],       # ← SPEC §7.1
                    "source_type":      p["source_type"],      # "page" | "pdf"
                    "chunk_index":      i,
                    "total_chunks":     len(text_chunks),
                    "meta_description": p.get("meta_description", ""),
                }

                if supabase_format:
                    # Langchain / n8n Supabase Vector Store format
                    chunks_out.append({
                        "pageContent": chunk,   # ← text to embed
                        "metadata":    metadata,
                    })
                else:
                    chunks_out.append({
                        "id":          f"chunk_{chunk_id:05d}",
                        "text":        chunk,
                        "metadata":    metadata,
                    })
                chunk_id += 1

        return chunks_out


if __name__ == "__main__":
    asyncio.run(CRIScraper().run())
