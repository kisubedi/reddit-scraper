import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';

dotenv.config();

// Same keywords as scraper.js
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
  'Announcements / Updates / Meta': ['announcement', 'update', 'release', 'version', 'changelog', 'roadmap', 'coming soon', 'new', 'meta', 'subreddit']
};

async function reclassify() {
  console.log('='.repeat(60));
  console.log('Reclassifying Posts with New Categories');
  console.log('='.repeat(60));

  try {
    // Get all posts
    console.log('\n[1/2] Fetching all posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');

    if (postsError) throw postsError;
    console.log(`Found ${posts.length} posts`);

    // Get categories
    console.log('\n[2/2] Categorizing posts...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (catError) throw catError;
    console.log(`Active categories: ${categories.length}\n`);

    let successCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();
      const title = post.title.toLowerCase();
      const assignments = [];

      for (const category of categories) {
        const keywords = categoryKeywords[category.name] || [];
        let score = 0;

        for (const keyword of keywords) {
          if (title.includes(keyword.toLowerCase())) score += 3;
          if (text.includes(keyword.toLowerCase())) score += 1;
        }

        if (score > 0) {
          const confidence = Math.min(score / (keywords.length * 4) * 2.5, 0.98);
          if (confidence >= 0.25) {
            assignments.push({
              post_id: post.id,
              category_id: category.id,
              category_name: category.name,
              confidence
            });
          }
        }
      }

      if (assignments.length > 0) {
        // Insert categorizations
        const inserts = assignments.map(a => ({
          post_id: a.post_id,
          category_id: a.category_id,
          confidence: a.confidence
        }));

        const { error } = await supabase
          .from('post_categories')
          .insert(inserts);

        if (error) {
          console.error(`✗ Error categorizing: ${post.title.substring(0, 50)}...`);
        } else {
          const categoryNames = assignments
            .map(a => `${a.category_name} (${(a.confidence * 100).toFixed(0)}%)`)
            .join(', ');
          console.log(`✓ "${post.title.substring(0, 50)}..." → ${categoryNames}`);
          successCount++;
        }
      } else {
        console.log(`⊘ "${post.title.substring(0, 50)}..." → No categories`);
        skippedCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Reclassification Complete!');
    console.log(`Successfully categorized: ${successCount}/${posts.length}`);
    console.log(`Skipped (no match): ${skippedCount}/${posts.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Reclassification Failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

reclassify();
