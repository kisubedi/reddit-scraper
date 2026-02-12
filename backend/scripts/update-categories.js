import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';

dotenv.config();

const newCategories = [
  'Knowledge',
  'Triggers',
  'Flows',
  'Actions / Tools',
  'Topics',
  'CUA',
  'Licensing',
  'Quotas / Limits / Entitlements',
  'Evals',
  'GenAI Quality / Reliability / Hallucinations',
  'Data Sources & Grounding',
  'Integrations',
  'Publishing / Channels',
  'Authentication / Authorization / Identity',
  'Governance / Compliance / Admin Controls',
  'Performance / Latency / Timeouts / Throttling',
  'DevEx / ALM / Pro‑dev / Source Control',
  'UI / UX Bugs & Authoring Issues',
  'Templates / Samples / Best Practices',
  'Feature Requests / Ideas',
  'Announcements / Updates / Meta',
  'General'
];

async function updateCategories() {
  console.log('='.repeat(60));
  console.log('Updating Categories');
  console.log('='.repeat(60));

  try {
    // Step 1: Deactivate old categories
    console.log('\n[1/3] Deactivating old categories...');
    const { error: deactivateError } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;
    console.log('✓ Old categories deactivated');

    // Step 2: Insert new categories
    console.log('\n[2/3] Inserting new categories...');
    for (const name of newCategories) {
      const { error } = await supabase
        .from('categories')
        .upsert({
          name,
          description: `Posts related to ${name}`,
          is_active: true,
          post_count: 0
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error(`Error inserting ${name}:`, error.message);
      } else {
        console.log(`✓ ${name}`);
      }
    }

    // Step 3: Clear old post categorizations
    console.log('\n[3/3] Clearing old post categorizations...');
    const { error: clearError } = await supabase
      .from('post_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clearError) throw clearError;
    console.log('✓ Old categorizations cleared');

    console.log('\n' + '='.repeat(60));
    console.log('Categories Updated Successfully!');
    console.log(`Total new categories: ${newCategories.length}`);
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Run: npm run reclassify');
    console.log('2. This will categorize all 51 posts with new categories');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Update Failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

updateCategories();
