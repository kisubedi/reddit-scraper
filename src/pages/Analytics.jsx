import { useState, useEffect } from 'react';
import { getCategories, getSummary } from '../services/api';

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [categoriesData, summaryData] = await Promise.all([
        getCategories(true),
        getSummary()
      ]);

      setCategories(categoriesData.data || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-message">Loading analytics...</div>;
  }

  // Sort categories by post count descending
  const sortedCategories = [...categories].sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
  const maxCount = Math.max(...sortedCategories.map(c => c.post_count || 0), 1);

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Category breakdown and statistics for r/CopilotStudio posts</p>
      </header>

      <div className="analytics-container">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📄</div>
            <div className="card-content">
              <h3>Total Posts</h3>
              <p className="card-value">{summary?.totalPosts || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🏷️</div>
            <div className="card-content">
              <h3>Categories</h3>
              <p className="card-value">{summary?.totalCategories || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>This Week</h3>
              <p className="card-value">{summary?.recentPosts || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">⭐</div>
            <div className="card-content">
              <h3>Avg Score</h3>
              <p className="card-value">{summary?.avgScore || 0}</p>
            </div>
          </div>
        </div>

        {/* Category Histogram */}
        <div className="chart-section">
          <h2>Posts by Category</h2>
          <div className="histogram">
            {sortedCategories.map((category, index) => {
              const count = category.post_count || 0;
              const percentage = (count / maxCount) * 100;
              const colors = [
                '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e',
                '#a855f7', '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9'
              ];
              const color = colors[index % colors.length];

              return (
                <div key={category.id} className="histogram-row">
                  <div className="category-label" title={category.name}>
                    {category.name}
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    >
                      <span className="bar-value">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Table */}
        <div className="chart-section">
          <h2>Category Details</h2>
          <table className="category-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Posts</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category, index) => {
                const count = category.post_count || 0;
                const percentage = summary?.totalPosts > 0
                  ? ((count / summary.totalPosts) * 100).toFixed(1)
                  : 0;

                return (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{count}</td>
                    <td>{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
