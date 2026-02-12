import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FilterPanel from './components/FilterPanel';
import PostList from './components/PostList';
import Analytics from './pages/Analytics';
import { getPosts, getCategories } from './services/api';

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
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [filters.category, filters.search, filters.sortBy, filters.sortOrder]);

  const loadCategories = async () => {
    try {
      const result = await getCategories(true);
      setCategories(result.data || []); // Hierarchical structure with subcategories
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadPosts = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPosts({
        page,
        limit: pagination.limit,
        category: filters.category || undefined,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (page === 1) {
        setPosts(result.data || []);
      } else {
        setPosts(prev => [...prev, ...(result.data || [])]);
      }

      setPagination(result.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load posts');
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'reset') {
      setFilters({
        category: '',
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      return;
    }

    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleLoadMore = () => {
    if (!loading && pagination.page < pagination.totalPages) {
      loadPosts(pagination.page + 1);
    }
  };

  const handleSearch = (query) => {
    handleFilterChange('search', query);
  };

  return (
    <>
      <header className="app-header">
        <h1>📱 r/CopilotStudio Posts</h1>
        <p>Browse posts from the Copilot Studio subreddit with AI categorization</p>
        <div className="header-stats">
          <span>{pagination.total || 0} posts</span>
          <span>•</span>
          <span>{categories.length} categories</span>
        </div>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            categories={categories}
          />
        </aside>

        <main className="main-content">
          <PostList
            posts={posts}
            loading={loading}
            error={error}
            onLoadMore={handleLoadMore}
            hasMore={pagination.page < pagination.totalPages}
          />
        </main>
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
