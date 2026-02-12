import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';
import fetch from 'node-fetch';
import { classifyPost } from '../src/services/groq.service.js';

dotenv.config();

const SUBREDDIT = 'copilotstudio';
const HOURS_AGO = 8760; // 365 days (1 year)
const TARGET_POSTS = 500; // Target number of posts to fetch
const USE_AI_CLASSIFICATION = process.env.GROQ_API_KEY ? true : false;

// Keywords for categorization
const categoryKeywords = {
  'Knowledge': ['knowledge', 'knowledge source', 'knowledge base', 'documents', 'files', 'upload', 'sharepoint', 'onedrive', 'semantic', 'search', 'rag', 'retrieval', 'grounding', 'citation'],
  'Triggers': ['trigger', 'event', 'webhook', 'start', 'invoke', 'when', 'on message', 'conversation start'],
  'Flows': ['flow', 'power automate', 'logic app', 'workflow', 'orchestration', 'sequence', 'branching', 'conditional'],
  'Actions / Tools': ['action', 'tool', 'function', 'api call', 'custom action', 'plugin', 'skill', 'capability', 'tool use'],
  'Topics': ['topic', 'subject', 'node', 'dialog', 'conversation flow', 'intent', 'utterance', 'phrase'],
  'CUA': ['cua', 'custom user attribute', 'attribute', 'variable', 'context', 'session', 'state'],
  'Licensing': ['license', 'licensing', 'subscription', 'plan', 'pricing', 'cost', 'tier', 'premium'],
  'Quotas / Limits / Entitlements': ['quota', 'limit', 'throttle', 'rate limit', 'entitlement', 'capacity', 'usage', 'exceeded'],
  'Evals': ['eval', 'evaluation', 'test', 'testing', 'quality', 'assessment', 'measure', 'metric'],
  'GenAI Quality / Reliability / Hallucinations': ['hallucination', 'accuracy', 'incorrect', 'wrong', 'quality', 'reliability', 'gen ai', 'generative', 'llm', 'model', 'response quality'],
  'Data Sources & Grounding': ['data source', 'grounding', 'dataverse', 'database', 'sql', 'api', 'connector', 'data', 'source'],
  'Integrations': ['integration', 'integrate', 'connect', 'mcp', 'third party', 'external', 'api', 'webhook', 'connector'],
  'Publishing / Channels': ['publish', 'channel', 'teams', 'web', 'mobile', 'deployment', 'deploy', 'release'],
  'Authentication / Authorization / Identity': ['auth', 'authentication', 'authorization', 'identity', 'sso', 'entra', 'login', 'sign in', 'permission', 'role', 'access', 'token', 'oauth', 'security'],
  'Governance / Compliance / Admin Controls': ['governance', 'compliance', 'admin', 'policy', 'dlp', 'data loss prevention', 'control', 'audit', 'regulation'],
  'Performance / Latency / Timeouts / Throttling': ['performance', 'latency', 'timeout', 'slow', 'throttling', 'speed', 'delay', 'wait', 'hang', 'freeze'],
  'DevEx / ALM / Pro‑dev / Source Control': ['devex', 'alm', 'pro dev', 'professional developer', 'source control', 'git', 'deployment', 'ci cd', 'pipeline', 'developer experience'],
  'UI / UX Bugs & Authoring Issues': ['ui', 'ux', 'bug', 'interface', 'authoring', 'studio', 'editor', 'canvas', 'visual', 'designer', 'ui bug'],
  'Templates / Samples / Best Practices': ['template', 'sample', 'example', 'best practice', 'pattern', 'recommendation', 'guide', 'how to'],
  'Feature Requests / Ideas': ['feature request', 'idea', 'suggestion', 'wishlist', 'enhancement', 'improvement', 'could we', 'would be nice'],
  'Announcements / Updates / Meta': ['announcement', 'update', 'release', 'version', 'changelog', 'roadmap', 'coming soon', 'new', 'meta', 'subreddit'],
  'General': [] // Fallback category with no keywords
};

async function scrape() {
  console.log('='.repeat(60));
  console.log('Reddit Scraper - r/' + SUBREDDIT);
  console.log('Started at:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Fetch posts from Reddit with pagination
    console.log(`\n[1/4] Fetching posts from r/${SUBREDDIT}...`);
    console.log(`Target: ${TARGET_POSTS} posts from last ${Math.floor(HOURS_AGO / 24)} days`);

    let allPosts = [];
    let after = null;
    let pageCount = 0;
    const cutoffTime = Date.now() - (HOURS_AGO * 60 * 60 * 1000);

    // Fetch multiple pages until we have enough posts
    while (allPosts.length < TARGET_POSTS && pageCount < 10) {
      pageCount++;
      const url = `https://www.reddit.com/r/${SUBREDDIT}/new.json?limit=100${after ? `&after=${after}` : ''}`;

      console.log(`  Fetching page ${pageCount}...`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Reddit API returned ${response.status}: ${text.substring(0, 200)}`);
        break;
      }

      const json = await response.json();

      if (!json.data || !json.data.children) {
        console.error('Unexpected response structure');
        break;
      }

      const pagePosts = json.data.children.map(child => child.data);
      const recentPagePosts = pagePosts.filter(post => (post.created_utc * 1000) >= cutoffTime);

      allPosts.push(...recentPagePosts);
      after = json.data.after;

      console.log(`    Got ${recentPagePosts.length} posts (total: ${allPosts.length})`);

      // If no more pages, stop
      if (!after || recentPagePosts.length === 0) {
        console.log(`  No more posts available`);
        break;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const recentPosts = allPosts;
    console.log(`\nTotal fetched: ${recentPosts.length} posts`);

    // Get categories
    console.log('\n[2/4] Loading categories...');
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    console.log(`Active categories: ${categories.length}`);

    // Insert posts
    console.log('\n[3/4] Inserting posts...');
    let newCount = 0;
    let skipCount = 0;

    for (const post of recentPosts) {
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('reddit_id', post.id)
        .single();

      if (existing) {
        skipCount++;
        continue;
      }

      const { data: inserted, error } = await supabase
        .from('posts')
        .insert({
          reddit_id: post.id,
          title: post.title,
          content: post.selftext || '',
          author: post.author,
          score: post.score,
          num_comments: post.num_comments,
          url: `https://reddit.com${post.permalink}`,
          permalink: `https://reddit.com${post.permalink}`,
          thumbnail: post.thumbnail || null,
          link_flair_text: post.link_flair_text || null,
          created_at: new Date(post.created_utc * 1000).toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting post ${post.id}:`, error.message);
        continue;
      }

      // Categorize using AI or keywords
      let assignments = [];

      if (USE_AI_CLASSIFICATION) {
        // AI Classification with Gemini
        try {
          const aiResults = await classifyPost(post.title, post.selftext || '');

          for (const result of aiResults) {
            const category = categories.find(c => c.name === result.name);
            if (category) {
              assignments.push({
                post_id: inserted.id,
                category_id: category.id,
                confidence: result.confidence
              });
            }
          }

          console.log(`  🤖 AI: "${post.title.substring(0, 40)}..." → ${aiResults.map(r => r.name).join(', ')}`);

          // Add delay to respect rate limits (30 req/min = 2 sec between requests)
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          if (error.message === 'RATE_LIMIT') {
            console.warn('⚠️  Rate limit hit, falling back to keywords for this post');
          }
          // Fall back to keyword matching on error
          USE_AI_CLASSIFICATION = false; // Temporarily disable for this batch
        }
      }

      // Keyword Classification (fallback or if AI disabled)
      if (!USE_AI_CLASSIFICATION || assignments.length === 0) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();

        for (const category of categories) {
          const keywords = categoryKeywords[category.name] || [];

          // Skip General category in initial matching
          if (category.name === 'General') continue;

          let score = 0;

          for (const keyword of keywords) {
            if (post.title.toLowerCase().includes(keyword.toLowerCase())) score += 3;
            if (text.includes(keyword.toLowerCase())) score += 1;
          }

          if (score > 0) {
            const confidence = Math.min(score / (keywords.length * 4) * 2.5, 0.98);
            if (confidence >= 0.25) {
              assignments.push({
                post_id: inserted.id,
                category_id: category.id,
                confidence
              });
            }
          }
        }

        // If no categories matched, assign to General
        if (assignments.length === 0) {
          const generalCategory = categories.find(c => c.name === 'General');
          if (generalCategory) {
            assignments.push({
              post_id: inserted.id,
              category_id: generalCategory.id,
              confidence: 0.30
            });
          }
        }
      }

      // Insert all categorizations
      if (assignments.length > 0) {
        await supabase
          .from('post_categories')
          .insert(assignments);
      }

      newCount++;
    }

    console.log(`\nNew posts: ${newCount}`);
    console.log(`Skipped (existing): ${skipCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('Scraping Complete');
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Scraping Failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

scrape().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
