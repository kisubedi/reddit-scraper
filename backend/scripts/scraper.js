import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';
import fetch from 'node-fetch';

dotenv.config();

const SUBREDDIT = 'copilotstudio';
const HOURS_AGO = 168; // 7 days

// Keywords for categorization
const categoryKeywords = {
  'Integration & APIs': ['api', 'integration', 'webhook', 'rest', 'endpoint', 'connector', 'mcp', 'oauth', 'sharepoint', 'dataverse'],
  'Authentication & Security': ['auth', 'authentication', 'security', 'sso', 'login', 'password', 'permission', 'role', 'access', 'token', 'entra'],
  'Custom Actions & Functions': ['custom action', 'power automate', 'flow', 'function', 'logic', 'automation', 'trigger', 'expression', 'variable', 'claude'],
  'Conversation Design': ['conversation', 'dialog', 'user experience', 'ux', 'flow design', 'prompt', 'response', 'personality', 'tone', 'greeting', 'bot', 'copilot agent', 'knowledge'],
  'Troubleshooting & Errors': ['error', 'issue', 'problem', 'bug', 'not working', 'help', 'troubleshoot', 'fix', 'debug', 'failed', 'broken', 'timeout', 'cant', 'unable'],
  'New Features & Updates': ['new feature', 'update', 'announcement', 'roadmap', 'release', 'coming soon', 'preview', 'beta', 'feature request', 'opus', 'model'],
  'Getting Started & Tutorials': ['getting started', 'tutorial', 'beginner', 'how to', 'guide', 'learn', 'introduction', 'basics', 'first time', 'setup', 'course', 'recommend', 'advice']
};

async function scrape() {
  console.log('='.repeat(60));
  console.log('Reddit Scraper - r/' + SUBREDDIT);
  console.log('Started at:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Fetch posts from Reddit
    console.log(`\n[1/4] Fetching posts from r/${SUBREDDIT}...`);
    const url = `https://www.reddit.com/r/${SUBREDDIT}/new.json?limit=100`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Reddit API returned ${response.status}: ${text.substring(0, 200)}`);
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const json = await response.json();

    if (!json.data || !json.data.children) {
      console.error('Unexpected response structure:', JSON.stringify(json).substring(0, 200));
      throw new Error('Invalid Reddit API response');
    }

    const posts = json.data.children.map(child => child.data);

    const cutoffTime = Date.now() - (HOURS_AGO * 60 * 60 * 1000);
    const recentPosts = posts.filter(post => (post.created_utc * 1000) >= cutoffTime);

    console.log(`Found ${recentPosts.length} posts from last ${HOURS_AGO} hours`);

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

      // Categorize
      const text = `${post.title} ${post.selftext}`.toLowerCase();
      for (const category of categories) {
        const keywords = categoryKeywords[category.name] || [];
        let score = 0;

        for (const keyword of keywords) {
          if (post.title.toLowerCase().includes(keyword.toLowerCase())) score += 3;
          if (text.includes(keyword.toLowerCase())) score += 1;
        }

        if (score > 0) {
          const confidence = Math.min(score / (keywords.length * 4) * 2.5, 0.98);
          if (confidence >= 0.25) {
            await supabase
              .from('post_categories')
              .insert({
                post_id: inserted.id,
                category_id: category.id,
                confidence
              });
          }
        }
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
