import { supabase } from '../src/config/database.js';
import { classifyProductArea } from '../src/services/groq.service.js';

async function classifyExistingPosts() {
  console.log('🏢 Classifying Existing Posts into Product Areas\n');
  console.log('='.repeat(60));

  try {
    // Get all posts that don't have product area assignments yet
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(100); // Process 100 most recent posts

    if (error) throw error;

    console.log(`\nFound ${posts.length} posts to classify`);

    // Get all product areas
    const { data: productAreas } = await supabase
      .from('product_areas')
      .select('id, name')
      .eq('is_active', true);

    console.log(`Product areas loaded: ${productAreas.length}\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      console.log(`\n[${i + 1}/${posts.length}] "${post.title.substring(0, 50)}..."`);

      // Check if already classified
      const { data: existing } = await supabase
        .from('post_product_areas')
        .select('id')
        .eq('post_id', post.id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('  ⏭️  Already classified, skipping');
        skipCount++;
        continue;
      }

      try {
        // Classify into product areas
        const areas = await classifyProductArea(post.title, post.content || '');

        if (areas && areas.length > 0) {
          // Insert assignments
          const assignments = [];
          for (const area of areas) {
            const productArea = productAreas.find(pa => pa.name === area.name);
            if (productArea) {
              assignments.push({
                post_id: post.id,
                product_area_id: productArea.id,
                confidence: area.confidence
              });
            }
          }

          if (assignments.length > 0) {
            await supabase
              .from('post_product_areas')
              .insert(assignments);

            console.log(`  ✅ ${assignments.map(a => {
              const pa = productAreas.find(p => p.id === a.product_area_id);
              return pa.name;
            }).join(', ')}`);

            successCount++;
          }
        } else {
          console.log('  ⚠️  No areas assigned');
        }

        // Rate limiting - wait 2 seconds between requests
        if (i < posts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (classifyError) {
        console.error(`  ❌ Error: ${classifyError.message}`);
        errorCount++;

        if (classifyError.message === 'RATE_LIMIT') {
          console.log('\n⚠️  Rate limit hit! Stopping for now.');
          break;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Classification Summary:');
    console.log(`  ✅ Successfully classified: ${successCount}`);
    console.log(`  ⏭️  Skipped (already done): ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  }
}

classifyExistingPosts();
