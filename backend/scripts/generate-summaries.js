import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';
import Groq from 'groq-sdk';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateSummaries() {
  console.log('='.repeat(60));
  console.log('AI Summary Generation');
  console.log('Generating one-sentence summaries for all posts');
  console.log('='.repeat(60));

  try {
    // Get posts without summaries
    console.log('\n[1/2] Fetching posts...');
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content')
      .is('ai_summary', null); // Only posts without summaries

    if (error) throw error;
    console.log(`Found ${posts.length} posts needing summaries\n`);

    if (posts.length === 0) {
      console.log('All posts already have summaries!');
      return;
    }

    console.log('[2/2] Generating summaries...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        const prompt = `Summarize this Reddit post in ONE sentence (max 100 characters). Be concise and descriptive.

Title: ${post.title}
Content: ${post.content.substring(0, 500)}

Respond with ONLY the summary sentence, nothing else.`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 100
        });

        const summary = completion.choices[0]?.message?.content?.trim() || '';

        // Update post with summary
        const { error: updateError } = await supabase
          .from('posts')
          .update({ ai_summary: summary.substring(0, 200) }) // Max 200 chars
          .eq('id', post.id);

        if (updateError) {
          console.error(`✗ Error updating post ${post.id}`);
          errorCount++;
        } else {
          console.log(`✓ "${post.title.substring(0, 40)}..." → "${summary.substring(0, 60)}..."`);
          successCount++;
        }

        // Rate limit: 30 req/min = 2 sec delay
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`✗ Error processing post: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary Generation Complete!');
    console.log(`Success: ${successCount}/${posts.length}`);
    console.log(`Errors: ${errorCount}/${posts.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nFailed:', error.message);
    process.exit(1);
  }
}

generateSummaries();
