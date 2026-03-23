# CRI Moroccan Investment Portal - Technical Documentation

## Overview
This is a modern Next.js web application representing the Regional Investment Center (CRI - Centre Régional d'Investissement) of Morocco. It aims to simplify the investment journey by providing transparent information on investment procedures, land access (foncier), legal appeals (recours), and a regional dashboard. It also features an AI-powered chatbot assistant for answering user queries and an Admin Dashboard for monitoring these interactions.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) with CSS Variables for flexible theming.
- **UI Components:** Custom Shadcn UI components based on Radix UI primitives.
- **Icons:** Lucide React
- **Chatbot Backend:** n8n Webhook integration.
- **Database / Logging:** Supabase

## Application Structure

### Pages (`app/`)
The application utilizes the Next.js App Router with the following main routes:
- `/` (`app/page.tsx`): Home page featuring the hero section and quick access to main features.
- `/procedures` (`app/procedures/page.tsx`): Investment procedures and administrative acts categorized by domain.
- `/foncier` (`app/foncier/page.tsx`): Information and guidance regarding land identification and access for investment projects.
- `/recours` (`app/recours/page.tsx`): Legal framework and procedures for appeals (saisine).
- `/mon-cri` (`app/mon-cri/page.tsx`): Regional dashboard featuring an interactive map of Morocco's 12 regions.
- `/faq` (`app/faq/page.tsx`): Frequently Asked Questions categorized by topics like technical support and procedures.
- `/admin` (`app/admin/page.tsx`): Admin Dashboard to view, filter, export, and flag logged chatbot conversations.

### API Routes (`app/api/`)
- `/api/chatbot/route.ts`: API endpoint that acts as a proxy for the chatbot. It forwards user messages to an external n8n workflow webhook and logs the interactions (including detected source URLs and low-confidence flags) to Supabase asynchronously.
- `/api/admin/conversations/route.ts`: REST API powering the Admin Dashboard. It handles fetching paginated/filtered conversation logs, updating flags/notes, and exporting data to CSV.

### Components (`components/`)
- **UI Primitives (`components/ui/`):** Reusable UI components (Buttons, Dialogs, Inputs, etc.) generated using Shadcn UI.
- **Feature Components:**
  - `navbar.tsx` & `footer.tsx`: Global layout components.
  - `chatbot-button.tsx`: A floating, interactive chat widget that manages user sessions.
  - Content components (`faq-content.tsx`, `procedures-content.tsx`, `mon-cri-content.tsx`, etc.) that hold the localized business logic and presentation for the pages.

## Key Features

### AI Chatbot Integration & Logging
The platform includes an integrated chatbot (`<ChatbotButton />`) to assist users in real-time.
- **Frontend:** Floating chat interface tracking user and assistant messages, maintaining a consistent `sessionId` per browser tab.
- **Backend Proxy:** Next.js API route forwards requests securely to the n8n webhook.
- **Asynchronous Logging:** Conversations are logged to Supabase without blocking the user response. It automatically detects low-confidence responses and extracts source URLs.
- **Required Configuration:** `N8N_WEBHOOK_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Admin Dashboard (`/admin`)
A dedicated interface for administrators to monitor the AI's performance.
- View all logged conversations with details like timestamps, questions, answers, and extracted URLs.
- Filter by text search, date range, or flags (e.g., "Low Confidence").
- Mark/flag specific conversations for review and add internal notes.
- Export filtered data to CSV.
- **Required Configuration:** Uses `SUPABASE_SERVICE_KEY` for administrative write access.

### Interactive "Mon CRI" Dashboard
The `/mon-cri` page uses a simplified SVG representation of Morocco to interactively display the 12 regions, allowing investors to pinpoint their targeted Regional Investment Center.

### Procedures & FAQ Filtering
Both the Procedures and FAQ pages utilize client-side React state (`useState`) to filter dense lists of information via category pills, providing a smooth user experience without page reloads.

## Data Pipeline (RAG)
Outside of the main Next.js web application, this repository contains python scripts for extracting and preparing knowledge-base data for the n8n AI Chatbot Agent.

- **Scraper (`scraper_cri_invest.py`):** Uses Playwright and BeautifulSoup to crawl the `cri-invest.ma` website. It extracts page content and downloads PDF documents. It also performs language detection (French/Arabic/English) and outputs standard JSON chunks as well as a `supabase_chunks.json` file which is ready for vector database insertion.
- **Embedding Script (`embed_and_upload.py`):** Reads the outputted `supabase_chunks.json`, generates vector embeddings using Google's Gemini API (`models/embedding-001`), and uploads the documents alongside their embeddings into a Supabase pgvector table (`documents`). This table acts as the knowledge base for the n8n AI Agent.

## Getting Started

### Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   # or yarn install / pnpm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` (or `.env.local`) file in the `Cri_website` root directory. You must include the following variables for full functionality:
   ```env
   N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/..."
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_KEY="your-service-role-key" # Required for Admin Dashboard API
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

The project is orchestrated using Docker Compose to manage the Next.js application, a local n8n instance, and a PostgreSQL database for n8n's internal storage.

### 1. Prerequisites
- Docker and Docker Compose installed.
- Valid Supabase and Gemini API credentials in your `.env` files.

### 2. Deployment Steps

1.  **Configure Environment:**
    Ensure you have a `.env` file at the root and optionally in `Cri_website/`. Docker Compose will load these.
    ```bash
    # Minimum required in root .env
    GEMINI_API_KEY=your_key
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_KEY=your_service_key
    N8N_ENCRYPTION_KEY=a_random_secure_string
    ```

2.  **Start Orchestration:**
    ```bash
    docker compose up --build -d
    ```

3.  **Configure n8n Workflow:**
    - Access n8n at [http://localhost:5678](http://localhost:5678).
    - Create/Import your workflow.
    - Set the **Webhook** node path to `chatbot` and method to `POST`.
    - Set the workflow to **Active**.

### 3. Service URLs
- **Main Portal:** [http://localhost:3000](http://localhost:3000)
- **n8n Dashboard:** [http://localhost:5678](http://localhost:5678)
- **Database (Internal):** Port `5432` (accessible internally by n8n)

### 4. Technical Details
- **Networking:** The `app` container communicates with `n8n` via the internal Docker network using `http://n8n:5678/webhook/chatbot`.
- **Persistence:** n8n workflows and database data are persisted in Docker volumes (`n8n_data`, `postgres_data`).
- **Hybrid Cloud:** n8n runs locally but connects to Supabase Cloud for vector retrieval and logging.

## Theming
The project uses `next-themes` and CSS variables (`oklch` colors) to support Light and Dark modes. Theme colors and base styles are defined centrally in `app/globals.css`.