// Simple script to check product area classification status
// Run with: node check-classification-status.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkStatus() {
  try {
    console.log('\n📊 Checking Product Area Classification Status...\n');

    // Count total posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    console.log(`Total posts in database: ${totalPosts}`);

    // Count posts with product areas
    const { data: classified, error } = await supabase
      .from('post_product_areas')
      .select('post_id, product_areas(name)');

    if (error) {
      console.error('Error:', error);
      return;
    }

    const uniquePosts = new Set(classified.map(c => c.post_id));
    const classifiedCount = uniquePosts.size;
    const unclassifiedCount = totalPosts - classifiedCount;

    console.log(`Classified posts: ${classifiedCount}`);
    console.log(`Unclassified posts: ${unclassifiedCount}`);
    console.log(`Progress: ${((classifiedCount / totalPosts) * 100).toFixed(1)}%`);

    // Get breakdown by product area
    const areaCount = {};
    classified.forEach(item => {
      const areaName = item.product_areas?.name;
      if (areaName) {
        areaCount[areaName] = (areaCount[areaName] || 0) + 1;
      }
    });

    console.log('\n📈 Breakdown by Product Area:');
    Object.entries(areaCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([area, count]) => {
        console.log(`  ${area}: ${count} assignments`);
      });

    console.log('\n✅ Status check complete\n');
  } catch (error) {
    console.error('Failed to check status:', error.message);
  }
}

checkStatus();
