import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CategorySection from './components/CategorySection';
import ProductAreaSection from './components/ProductAreaSection';
import CategoryFilterSidebar from './components/CategoryFilterSidebar';
import Analytics from './pages/Analytics';
import { getPosts } from './services/api';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="main-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        📱 Posts
      </Link>
      <Link to="/analytics" className={location.pathname === '/analytics' ? 'active' : ''}>
        📊 Analytics
      </Link>
    </nav>
  );
}

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProductAreas, setSelectedProductAreas] = useState([]);

  const INITIAL_SELECTION_LIMIT = 6;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all posts (or a large batch) sorted by most recent
      const result = await getPosts({
        page: 1,
        limit: 500,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      setPosts(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group posts by category
  const postsByCategory = {};
  const categoryInfo = {};

  posts.forEach(post => {
    if (post.post_categories && post.post_categories.length > 0) {
      post.post_categories.forEach(pc => {
        const category = pc.categories;
        if (category) {
          const catId = category.id;
          if (!postsByCategory[catId]) {
            postsByCategory[catId] = [];
            categoryInfo[catId] = {
              id: catId,
              name: category.name,
              description: category.description,
              parent_name: category.parent_name
            };
          }
          postsByCategory[catId].push(post);
        }
      });
    }
  });

  // Group posts by product area
  const postsByProductArea = {};
  const productAreaInfo = {};

  posts.forEach(post => {
    if (post.post_product_areas && post.post_product_areas.length > 0) {
      post.post_product_areas.forEach(ppa => {
        const productArea = ppa.product_areas;
        if (productArea) {
          const paId = productArea.id;
          if (!postsByProductArea[paId]) {
            postsByProductArea[paId] = [];
            productAreaInfo[paId] = {
              id: paId,
              name: productArea.name
            };
          }
          postsByProductArea[paId].push(post);
        }
      });
    }
  });

  // Sort by post count
  const sortedCategories = Object.entries(postsByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([id, posts]) => ({ ...categoryInfo[id], posts }));

  const sortedProductAreas = Object.entries(postsByProductArea)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([id, posts]) => ({ ...productAreaInfo[id], posts }));

  // Initialize selected categories/product areas with top 6
  useEffect(() => {
    if (sortedCategories.length > 0 && selectedCategories.length === 0) {
      const topCategoryIds = sortedCategories
        .slice(0, INITIAL_SELECTION_LIMIT)
        .map(c => c.id);
      setSelectedCategories(topCategoryIds);
    }
  }, [sortedCategories.length]);

  useEffect(() => {
    if (sortedProductAreas.length > 0 && selectedProductAreas.length === 0) {
      const topProductAreaIds = sortedProductAreas
        .slice(0, INITIAL_SELECTION_LIMIT)
        .map(pa => pa.id);
      setSelectedProductAreas(topProductAreaIds);
    }
  }, [sortedProductAreas.length]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleProductAreaToggle = (productAreaId) => {
    setSelectedProductAreas(prev =>
      prev.includes(productAreaId)
        ? prev.filter(id => id !== productAreaId)
        : [...prev, productAreaId]
    );
  };

  // Filter displayed categories based on selection
  const displayedCategories = sortedCategories.filter(cat =>
    selectedCategories.includes(cat.id)
  );

  const displayedProductAreas = sortedProductAreas.filter(pa =>
    selectedProductAreas.includes(pa.id)
  );

  if (loading) {
    return (
      <>
        <header className="app-header">
          <h1>📱 r/CopilotStudio Posts</h1>
        </header>
        <div className="loading-message">Loading posts...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="app-header">
          <h1>📱 r/CopilotStudio Posts</h1>
        </header>
        <div className="error-message">
          <h3>Error loading posts</h3>
          <p>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="app-header">
        <h1>📱 r/CopilotStudio Posts</h1>
        <p>Browse posts from the Copilot Studio subreddit organized by AI categories</p>
        <div className="header-stats">
          <span>{posts.length} posts</span>
          <span>•</span>
          <span>{sortedCategories.length} categories</span>
          <span>•</span>
          <span>{sortedProductAreas.length} product areas</span>
        </div>
      </header>

      <div className="app-container-with-sidebar">
        <CategoryFilterSidebar
          categories={sortedCategories}
          productAreas={sortedProductAreas}
          selectedCategories={selectedCategories}
          selectedProductAreas={selectedProductAreas}
          onCategoryToggle={handleCategoryToggle}
          onProductAreaToggle={handleProductAreaToggle}
        />

        <div className="main-content-area">
          {/* Categories Section */}
          {displayedCategories.length > 0 && (
            <section className="categories-view">
              <h2 className="section-title">📑 By Category ({displayedCategories.length})</h2>
              <div className="sections-grid">
                {displayedCategories.map(category => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    posts={category.posts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Product Areas Section */}
          {displayedProductAreas.length > 0 && (
            <section className="product-areas-view">
              <h2 className="section-title">🏢 By Product Area ({displayedProductAreas.length})</h2>
              <div className="sections-grid">
                {displayedProductAreas.map(productArea => (
                  <ProductAreaSection
                    key={productArea.id}
                    productArea={productArea}
                    posts={productArea.posts}
                  />
                ))}
              </div>
            </section>
          )}

          {displayedCategories.length === 0 && displayedProductAreas.length === 0 && (
            <div className="empty-message">
              <h3>No categories selected</h3>
              <p>Select categories from the sidebar to view posts</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<PostsPage />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
