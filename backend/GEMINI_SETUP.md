# Google Gemini AI Setup Guide

## Get Your Free API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in with Google Account**
   - Use your personal or work Google account

3. **Create API Key**
   - Click "Create API Key"
   - Copy the key (starts with `AIza...`)

4. **Add to Your .env File**
   ```bash
   # Open backend/.env and add:
   GEMINI_API_KEY=AIzaSyYour_API_Key_Here
   ```

## Free Tier Limits

- **Rate Limit:** 15 requests per minute
- **Daily Quota:** 1,500 requests per day
- **Model:** gemini-1.5-flash (fast, free)

**For your use case:**
- Scraping 30 posts/day = 30 API calls ✅
- Reclassifying 451 posts = ~30 minutes (with 4-sec delays)
- Well within free limits!

## Test Your Setup

```bash
cd backend
npm run test-gemini
```

**Expected Output:**
```
============================================================
Google Gemini AI - Classification Test
============================================================

Test Post:
Title: How to connect SharePoint knowledge base to Copilot Studio?
Content: I want to add my SharePoint documents...

AI Classification Results:
  - Knowledge: 85%
  - Data Sources & Grounding: 75%

============================================================
✓ Gemini test completed successfully!
============================================================
```

## How It Works

### AI Classification (when GEMINI_API_KEY is set)
1. Scraper uses AI to classify each post
2. Gemini analyzes title + content (up to 1000 chars)
3. Returns 1-3 most relevant categories with confidence scores
4. 4-second delay between requests (respects 15/min limit)
5. Falls back to keywords if rate limit hit

### Keyword Classification (fallback)
- If no GEMINI_API_KEY set, uses keyword matching
- Same logic as before
- No rate limits, but less accurate

## Usage

### Scrape New Posts with AI
```bash
npm run scrape
```

### Reclassify Existing Posts with AI
```bash
npm run reclassify
```
⚠️ Warning: Reclassifying 451 posts takes ~30 minutes with rate limit delays

### Run Without AI (Keywords Only)
```bash
# Just don't set GEMINI_API_KEY in .env
# Or remove it temporarily
```

## Rate Limit Handling

The scripts automatically:
- Add 4-second delays between AI requests (15/min limit)
- Pause for 60 seconds if rate limit hit
- Fall back to keyword matching on errors
- Log all AI classifications for monitoring

## Cost

**100% FREE** ✅
- No credit card required
- Permanent free tier
- 1,500 requests/day forever

## Troubleshooting

### "API_KEY_INVALID" Error
- Check that your key is correct in .env
- Make sure you copied the full key (starts with `AIza...`)
- No quotes around the key in .env

### Rate Limit Errors
- Script will auto-pause and retry
- 451 posts takes ~30 min (4 sec × 451 posts)
- Can run overnight for large batches

### AI Returns "General" for Everything
- Model might be struggling with context
- Try the test script first: `npm run test-gemini`
- Check that categories are loaded correctly

## Next Steps

1. Get API key from https://makersuite.google.com/app/apikey
2. Add to `backend/.env`
3. Test: `npm run test-gemini`
4. Run: `npm run scrape` or `npm run reclassify`
5. Deploy to Railway (add GEMINI_API_KEY to Railway env vars)

## Comparison: AI vs Keywords

| Feature | AI (Gemini) | Keywords |
|---------|------------|----------|
| Accuracy | High (understands context) | Medium (literal matching) |
| Speed | ~4 sec/post | Instant |
| Cost | Free (1500/day) | Free (unlimited) |
| Setup | Needs API key | No setup |
| Rate Limits | 15/min, 1500/day | None |

**Recommendation:** Use AI for better accuracy. The rate limits are not an issue for your daily volume.
