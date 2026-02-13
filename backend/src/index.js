import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { supabase, testConnection } from './config/database.js';
import { scrape } from '../scripts/scraper.js';

dotenv.config();

// Backend API v2 - Hierarchical categories with dynamic counts
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get all posts (with AI summaries and hierarchical categories)
app.get('/api/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = supabase
      .from('posts')
      .select(`
        id,
        reddit_id,
        title,
        content,
        author,
        score,
        num_comments,
        url,
        permalink,
        thumbnail,
        link_flair_text,
        ai_summary,
        created_at,
        post_categories (
          confidence,
          categories (
            id,
            name,
            parent_id,
            level
          )
        )
      `, { count: 'exact' });

    // Filter by category name (works for both parent and subcategory names)
    if (category) {
      // Get the category ID to filter posts
      const { data: catData } = await supabase
        .from('categories')
        .select('id, parent_id, level')
        .eq('name', category)
        .eq('is_active', true)
        .single();

      if (catData) {
        if (catData.level === 0) {
          // Parent category - get all posts from its children
          const { data: childIds } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', catData.id)
            .eq('is_active', true);

          if (childIds && childIds.length > 0) {
            const categoryIds = childIds.map(c => c.id);

            // Get posts that have any of these child categories
            const { data: postIds } = await supabase
              .from('post_categories')
              .select('post_id')
              .in('category_id', categoryIds);

            if (postIds && postIds.length > 0) {
              const uniquePostIds = [...new Set(postIds.map(p => p.post_id))];
              query = query.in('id', uniquePostIds);
            } else {
              // No posts found, return empty
              return res.json({
                data: [],
                pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: 0,
                  totalPages: 0
                }
              });
            }
          }
        } else {
          // Subcategory - filter directly
          const { data: postIds } = await supabase
            .from('post_categories')
            .select('post_id')
            .eq('category_id', catData.id);

          if (postIds && postIds.length > 0) {
            const uniquePostIds = [...new Set(postIds.map(p => p.post_id))];
            query = query.in('id', uniquePostIds);
          } else {
            // No posts found, return empty
            return res.json({
              data: [],
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                totalPages: 0
              }
            });
          }
        }
      }
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch all parent categories to join manually
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, parent_id');

    const categoryMap = {};
    allCategories?.forEach(cat => {
      categoryMap[cat.id] = cat;
    });

    // Add parent category names to post_categories
    const postsWithParents = data?.map(post => {
      if (post.post_categories && post.post_categories.length > 0) {
        post.post_categories = post.post_categories.map(pc => {
          const category = pc.categories;
          if (category && category.parent_id) {
            const parent = categoryMap[category.parent_id];
            return {
              ...pc,
              categories: {
                ...category,
                parent_name: parent?.name
              }
            };
          }
          return pc;
        });
      }
      return post;
    });

    res.json({
      data: postsWithParents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get all categories (hierarchical)
app.get('/api/categories', async (req, res) => {
  try {
    // Get all active categories
    const { data: allCategories, error } = await supabase
      .from('categories')
      .select('id, name, description, parent_id, level, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    // Get actual post counts from post_categories table
    const { data: postCounts, error: countError } = await supabase
      .from('post_categories')
      .select('category_id');

    if (countError) throw countError;

    // Count posts per category
    const countMap = {};
    postCounts.forEach(pc => {
      countMap[pc.category_id] = (countMap[pc.category_id] || 0) + 1;
    });

    // Add counts to categories
    const categoriesWithCounts = allCategories.map(cat => ({
      ...cat,
      post_count: countMap[cat.id] || 0
    }));

    // Organize into hierarchy
    const parents = categoriesWithCounts.filter(c => c.level === 0);
    const children = categoriesWithCounts.filter(c => c.level === 1);

    const hierarchical = parents.map(parent => {
      const subcats = children
        .filter(child => child.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      // Calculate parent post count from children
      const totalPostCount = subcats.reduce((sum, sub) => sum + (sub.post_count || 0), 0);

      return {
        ...parent,
        post_count: totalPostCount,
        subcategories: subcats
      };
    });

    res.json({
      data: hierarchical,
      flat: categoriesWithCounts // Also return flat list for filtering
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Manual scraper trigger (for testing)
app.post('/api/scraper/trigger', async (req, res) => {
  console.log('\n🔄 [MANUAL] Manual scrape triggered via API...');

  // Start scraping in background, don't wait for completion
  scrape()
    .then(() => console.log('✅ [MANUAL] Manual scrape completed'))
    .catch(error => console.error('❌ [MANUAL] Manual scrape failed:', error.message));

  // Return immediately
  res.json({
    message: 'Scraping started in background',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Get scraper status
app.get('/api/scraper/status', async (req, res) => {
  try {
    // Get last scraping time by checking newest post's scraped_at
    const { data: latestPost } = await supabase
      .from('posts')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    res.json({
      lastScraped: latestPost?.scraped_at || null,
      totalPosts: totalPosts || 0,
      nextScheduled: 'Every Sunday at 00:00 UTC',
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get category trends over time (weekly data)
app.get('/api/analytics/trends', async (req, res) => {
  try {
    // Get all posts with their categories from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        created_at,
        post_categories (
          category_id,
          categories (
            id,
            name,
            parent_id
          )
        )
      `)
      .gte('created_at', oneYearAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get all subcategories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('is_active', true)
      .eq('level', 1); // Only subcategories

    // Group posts by week
    const weeklyData = {};

    posts.forEach(post => {
      const date = new Date(post.created_at);
      // Get week start (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          total: 0,
          categories: {}
        };
      }

      weeklyData[weekKey].total++;

      // Count categories for this post
      if (post.post_categories && post.post_categories.length > 0) {
        post.post_categories.forEach(pc => {
          const catName = pc.categories?.name;
          if (catName) {
            weeklyData[weekKey].categories[catName] =
              (weeklyData[weekKey].categories[catName] || 0) + 1;
          }
        });
      }
    });

    // Convert to percentage format for charting
    const weeks = Object.keys(weeklyData).sort();
    const trendData = {
      labels: weeks.map(w => {
        const d = new Date(w);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: categories.map(cat => {
        const data = weeks.map(week => {
          const count = weeklyData[week].categories[cat.name] || 0;
          const total = weeklyData[week].total;
          return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        });

        return {
          label: cat.name,
          data: data
        };
      })
    };

    res.json(trendData);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get analytics summary
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: scoreData } = await supabase
      .from('posts')
      .select('score');

    const avgScore = scoreData && scoreData.length > 0
      ? scoreData.reduce((sum, p) => sum + p.score, 0) / scoreData.length
      : 0;

    res.json({
      totalPosts: totalPosts || 0,
      totalCategories: totalCategories || 0,
      recentPosts: recentPosts || 0,
      avgScore: parseFloat(avgScore.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Schedule weekly scraping every Sunday at midnight UTC
// Cron format: minute hour day month weekday
// '0 0 * * 0' = Every Sunday at 00:00 UTC
cron.schedule('0 0 * * 0', async () => {
  console.log('\n🕐 [CRON] Starting scheduled Reddit scrape...');
  console.log(`⏰ [CRON] Time: ${new Date().toISOString()}`);

  try {
    await scrape();
    console.log('✅ [CRON] Scheduled scrape completed successfully\n');
  } catch (error) {
    console.error('❌ [CRON] Scheduled scrape failed:', error.message);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log('⏰ Cron job scheduled: Weekly scrape every Sunday at 00:00 UTC');
