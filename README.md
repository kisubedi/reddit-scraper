# Reddit Scraper - r/CopilotStudio

Full-stack Reddit scraper with AI-powered categorization.

## Features

- **Backend API**: Node.js/Express REST API
- **Database**: Supabase (PostgreSQL)
- **AI Categorization**: Keyword-based classification (100% free)
- **Automated Scraping**: Daily via GitHub Actions
- **Analytics**: Trends, comparisons, and statistics

## Tech Stack

- Backend: Node.js, Express
- Database: Supabase
- Hosting: Railway (backend)
- CI/CD: GitHub Actions

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 2. Run Scraper

```bash
cd backend
npm run scrape
```

## Deployment

See `DEPLOYMENT.md` for complete deployment instructions.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/posts` - Get all posts (with pagination, filters)
- `GET /api/categories` - Get all categories
- `GET /api/analytics/summary` - Get summary statistics

## License

MIT
