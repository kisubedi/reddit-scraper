import { supabase } from './src/config/database.js';

async function testProductAreaTrendsAPI() {
  console.log('🧪 Testing Product Area Trends API Logic\n');
  console.log('='.repeat(60));

  try {
    // Simulate what the API endpoint does
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        created_at,
        post_product_areas (
          product_area_id,
          product_areas (
            id,
            name
          )
        )
      `)
      .gte('created_at', oneYearAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`✅ Found ${posts.length} posts\n`);

    // Count posts with product area assignments
    const postsWithAreas = posts.filter(p => p.post_product_areas && p.post_product_areas.length > 0);
    console.log(`✅ Posts with product areas: ${postsWithAreas.length}\n`);

    // Get all product areas
    const { data: productAreas } = await supabase
      .from('product_areas')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order');

    console.log(`✅ Product areas loaded: ${productAreas.length}\n`);

    // Group by week
    const weeklyData = {};

    posts.forEach(post => {
      const date = new Date(post.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          total: 0,
          productAreas: {}
        };
      }

      weeklyData[weekKey].total++;

      if (post.post_product_areas && post.post_product_areas.length > 0) {
        post.post_product_areas.forEach(ppa => {
          const areaName = ppa.product_areas?.name;
          if (areaName) {
            weeklyData[weekKey].productAreas[areaName] =
              (weeklyData[weekKey].productAreas[areaName] || 0) + 1;
          }
        });
      }
    });

    const weeks = Object.keys(weeklyData).sort();
    console.log(`✅ Weeks of data: ${weeks.length}\n`);

    // Show sample data
    console.log('📊 Sample Weekly Data (last 3 weeks):\n');
    weeks.slice(-3).forEach(week => {
      console.log(`  Week of ${week}:`);
      console.log(`    Total posts: ${weeklyData[week].total}`);
      console.log(`    Product areas:`);
      Object.entries(weeklyData[week].productAreas).forEach(([area, count]) => {
        const percent = ((count / weeklyData[week].total) * 100).toFixed(1);
        console.log(`      - ${area}: ${count} (${percent}%)`);
      });
      console.log();
    });

    // Show which areas have data
    const areasWithData = new Set();
    Object.values(weeklyData).forEach(week => {
      Object.keys(week.productAreas).forEach(area => areasWithData.add(area));
    });

    console.log(`✅ Product areas with data: ${areasWithData.size}`);
    console.log(`   ${Array.from(areasWithData).join(', ')}\n`);

    console.log('='.repeat(60));
    console.log('✅ API Logic Test Complete!');
    console.log('\nThe endpoint would return this data as JSON for the chart.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testProductAreaTrendsAPI();
