import { supabase } from '../src/config/database.js';

async function verify() {
  console.log('🔍 Verifying Product Areas Setup\n');
  console.log('='.repeat(60));

  // Check product_areas table
  console.log('\n1. Checking product_areas table...');
  const { data: areas, error: areasError } = await supabase
    .from('product_areas')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (areasError) {
    console.error('❌ Error:', areasError.message);
    return;
  }

  console.log(`✅ Found ${areas.length} product areas:`);
  areas.forEach((area, i) => {
    console.log(`   ${i + 1}. ${area.name}`);
  });

  // Check post_product_areas table
  console.log('\n2. Checking post_product_areas table...');
  const { data: assignments, error: assignError, count } = await supabase
    .from('post_product_areas')
    .select('*', { count: 'exact', head: true });

  if (assignError) {
    console.error('❌ Error:', assignError.message);
    return;
  }

  console.log(`✅ Found ${count || 0} product area assignments`);

  // Get sample assignments
  const { data: sampleAssignments } = await supabase
    .from('post_product_areas')
    .select(`
      confidence,
      product_areas (name),
      posts (title)
    `)
    .limit(5);

  if (sampleAssignments && sampleAssignments.length > 0) {
    console.log('\n3. Sample assignments:');
    sampleAssignments.forEach((assignment, i) => {
      console.log(`\n   ${i + 1}. Post: "${assignment.posts.title.substring(0, 50)}..."`);
      console.log(`      → ${assignment.product_areas.name} (${(assignment.confidence * 100).toFixed(0)}%)`);
    });
  } else {
    console.log('\n⚠️  No product area assignments found yet.');
    console.log('   Run the scraper to classify existing posts.');
  }

  // Check total posts
  console.log('\n4. Checking total posts...');
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total posts in database: ${totalPosts || 0}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification Complete!\n');
}

verify().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
