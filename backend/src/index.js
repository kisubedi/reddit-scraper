import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, testConnection } from './config/database.js';

dotenv.config();

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
            level,
            categories!parent_id (
              name
            )
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

    res.json({
      data,
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
    // Get all active categories with post counts
    const { data: allCategories, error } = await supabase
      .from('categories')
      .select('id, name, description, parent_id, level, sort_order, post_count')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    // Organize into hierarchy
    const parents = allCategories.filter(c => c.level === 0);
    const children = allCategories.filter(c => c.level === 1);

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
      flat: allCategories // Also return flat list for filtering
    });
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
