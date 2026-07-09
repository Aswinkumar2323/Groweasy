# 🚀 GrowEasy AI-Powered CSV Importer

An intelligent CSV importer that uses **Google Gemini AI** to automatically map any CSV format into GrowEasy CRM lead records. Upload CSVs from Facebook Leads, Google Ads, Excel exports, or any custom format — the AI handles the field mapping.

> **Position**: Software Developer (Full-Time)

---

## ✨ Features

### Core Functionality
- 📤 **Drag & Drop CSV Upload** — Intuitive file upload with drag & drop and file picker
- 👁️ **Smart Preview** — Instant client-side parsing with scrollable data table
- 🤖 **AI-Powered Extraction** — Google Gemini intelligently maps arbitrary columns to CRM fields
- 📊 **Results Dashboard** — Summary stats, parsed records table, skipped records with reasons

### Technical Highlights
- 🔄 **Batch Processing** — Records processed in batches with retry mechanism
- 📡 **Server-Sent Events (SSE)** — Real-time progress updates during AI processing
- 🎨 **Dark/Light Mode** — Premium design with smooth theme transitions
- 📱 **Fully Responsive** — Mobile, tablet, and desktop optimized
- 🐳 **Docker Ready** — Multi-container setup with docker-compose
- 🔒 **Type Safe** — Full TypeScript across frontend and backend
- ⬇️ **CSV Export** — Download AI-processed CRM data as CSV

### AI Capabilities
- Handles **any CSV column naming** (Phone Number, Mobile, Contact → mobile_without_country_code)
- Merges split fields (First Name + Last Name → name)
- Extracts country codes from phone numbers
- Maps status values to allowed CRM statuses
- Captures unmapped but useful data in `crm_note`
- Skips records without email or phone number

---

## 🏗️ Architecture

```
groweasy/
├── frontend/          # Next.js 14 (App Router, TypeScript)
│   ├── src/
│   │   ├── app/           # Pages & layout
│   │   ├── components/    # React components
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript interfaces
│   └── Dockerfile
│
├── backend/           # Express.js (TypeScript)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # CSV parser, Gemini AI
│   │   ├── middleware/     # Error handling, file upload
│   │   ├── utils/         # Retry logic, logger
│   │   └── types/         # TypeScript interfaces
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/import/upload` | Upload & parse CSV file |
| `POST` | `/api/import/process` | AI extraction (supports SSE) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** 9+
- **Google Gemini API Key** — Get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the Repository

```bash
git clone git https://github.com/Aswinkumar2323/Groweasy.git
cd groweasy-csv-importer
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on **http://localhost:3000**

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) and start importing CSVs!

---

## 🐳 Docker Setup

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_key_here

# Build and run
docker-compose up --build

# App available at http://localhost:3000
```

---

## 🎯 CRM Fields

The AI extracts these fields from any CSV format:

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Country code |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | Lead status |
| `crm_note` | Notes/remarks |
| `data_source` | Source |
| `possession_time` | Property possession time |
| `description` | Additional description |

### Allowed CRM Status Values
- `GOOD_LEAD_FOLLOW_UP`
- `DID_NOT_CONNECT`
- `BAD_LEAD`
- `SALE_DONE`

### Allowed Data Source Values
- `leads_on_demand`
- `meridian_tower`
- `eden_park`
- `varah_swamy`
- `sarjapur_plots`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 19, TypeScript |
| **Backend** | Node.js, Express, TypeScript |
| **AI** | Google Gemini (gemini-2.0-flash) |
| **CSV Parsing** | PapaParse (client), csv-parse (server) |
| **Styling** | Vanilla CSS with custom design system |
| **Containerization** | Docker, docker-compose |

---

## 📝 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `PORT` | ❌ | `5000` | Server port |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | CORS origin |
| `LOG_LEVEL` | ❌ | `info` | Log level |

### Frontend (`frontend/.env.local`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ❌ | `http://localhost:5000` | Backend API URL |

---

## 📄 License

MIT
