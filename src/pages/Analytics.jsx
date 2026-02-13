import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCategories, getSummary, getTrends } from '../services/api';

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [categoriesData, summaryData, trendsData] = await Promise.all([
        getCategories(true),
        getSummary(),
        getTrends()
      ]);

      setCategories(categoriesData.data || []);
      setSummary(summaryData);
      setTrends(trendsData);
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

        {/* Trending Chart */}
        {trends && trends.datasets && trends.datasets.length > 0 && (
          <div className="chart-section">
            <h2>📈 Category Trends Over Time (% of Total Posts)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Weekly breakdown showing each category as a percentage of total posts
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={trends.labels.map((label, index) => {
                  const point = { week: label };
                  trends.datasets.forEach(dataset => {
                    point[dataset.label] = parseFloat(dataset.data[index]);
                  });
                  return point;
                })}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis
                  label={{ value: '% of Total Posts', angle: -90, position: 'insideLeft' }}
                  style={{ fontSize: '0.85rem' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.85rem' }}
                  iconType="line"
                />
                {trends.datasets.slice(0, 10).map((dataset, index) => {
                  const colors = [
                    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                    '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e'
                  ];
                  return (
                    <Line
                      key={dataset.label}
                      type="monotone"
                      dataKey={dataset.label}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

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
