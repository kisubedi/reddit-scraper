import { supabase } from '../src/config/database.js';

async function addSummaryColumn() {
  console.log('Adding ai_summary column to posts table...\n');

  try {
    // Execute SQL to add column (if not exists)
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS ai_summary TEXT;

        COMMENT ON COLUMN posts.ai_summary IS 'AI-generated one-sentence summary';
      `
    });

    if (error) {
      // If RPC doesn't exist, use direct SQL
      console.log('Note: Add this column manually in Supabase SQL Editor:');
      console.log('\nALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_summary TEXT;');
      console.log('\nOr I can guide you through it.');
    } else {
      console.log('✓ Column added successfully!');
    }

  } catch (err) {
    console.log('\nTo add the column manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this SQL:');
    console.log('\n   ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_summary TEXT;\n');
  }
}

addSummaryColumn();
