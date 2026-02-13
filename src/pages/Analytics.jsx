import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCategories, getSummary, getTrends, getProductAreaTrends } from '../services/api';

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [productAreaTrends, setProductAreaTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProductArea, setSelectedProductArea] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [categoriesData, summaryData, trendsData, productAreaTrendsData] = await Promise.all([
        getCategories(true),
        getSummary(),
        getTrends(),
        getProductAreaTrends()
      ]);

      setCategories(categoriesData.data || []);
      setSummary(summaryData);
      setTrends(trendsData);
      setProductAreaTrends(productAreaTrendsData);
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

        {/* Product Area Trending Chart */}
        {productAreaTrends && productAreaTrends.datasets && productAreaTrends.datasets.length > 0 && (
          <div className="chart-section">
            <h2>🏢 Product Area Trends Over Time (% of Total Posts)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Weekly breakdown showing each product area as a percentage of total posts.
              <strong> Click a product area chip to highlight it.</strong>
            </p>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart
                data={productAreaTrends.labels.map((label, index) => {
                  const point = { week: label };
                  productAreaTrends.datasets.forEach(dataset => {
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
                  wrapperStyle={{ fontSize: '0.75rem', cursor: 'pointer' }}
                  iconType="line"
                  onClick={(e) => {
                    const clickedArea = e.value;
                    setSelectedProductArea(selectedProductArea === clickedArea ? null : clickedArea);
                  }}
                />
                {productAreaTrends.datasets.map((dataset, index) => {
                  const colors = [
                    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                    '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e',
                    '#a855f7', '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9',
                    '#64748b', '#f472b6', '#facc15', '#2dd4bf'
                  ];
                  const isSelected = selectedProductArea === dataset.label;
                  const isOtherSelected = selectedProductArea && !isSelected;

                  return (
                    <Line
                      key={dataset.label}
                      type="monotone"
                      dataKey={dataset.label}
                      stroke={colors[index % colors.length]}
                      strokeWidth={isSelected ? 4 : 2}
                      strokeOpacity={isOtherSelected ? 0.15 : 1}
                      dot={{ r: isSelected ? 4 : 3, strokeOpacity: isOtherSelected ? 0.15 : 1, fillOpacity: isOtherSelected ? 0.15 : 1 }}
                      activeDot={{
                        r: 6,
                        onClick: () => {
                          setSelectedProductArea(selectedProductArea === dataset.label ? null : dataset.label);
                        }
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            {/* Product Area selection chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '1.5rem',
              justifyContent: 'center'
            }}>
              {productAreaTrends.datasets.map((dataset, index) => {
                const colors = [
                  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                  '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e',
                  '#a855f7', '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9',
                  '#64748b', '#f472b6', '#facc15', '#2dd4bf'
                ];
                const isSelected = selectedProductArea === dataset.label;

                return (
                  <button
                    key={dataset.label}
                    onClick={() => setSelectedProductArea(isSelected ? null : dataset.label)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: isSelected ? colors[index % colors.length] : 'var(--bg-secondary)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      border: `2px solid ${colors[index % colors.length]}`,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? '600' : '500',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.background = colors[index % colors.length];
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    {dataset.label}
                  </button>
                );
              })}
            </div>
            {selectedProductArea && (
              <p style={{
                textAlign: 'center',
                color: 'var(--reddit-orange)',
                fontWeight: 'bold',
                marginTop: '1rem',
                fontSize: '0.95rem'
              }}>
                📌 Viewing: <strong>{selectedProductArea}</strong>
              </p>
            )}
          </div>
        )}

        {/* Trending Chart */}
        {trends && trends.datasets && trends.datasets.length > 0 && (
          <div className="chart-section">
            <h2>📈 Category Trends Over Time (% of Total Posts)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Weekly breakdown showing each category as a percentage of total posts.
              <strong> Click a line to highlight it.</strong>
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
                onClick={(e) => {
                  // Click on chart background to deselect
                  if (e && e.activeLabel && !e.activePayload) {
                    setSelectedCategory(null);
                  }
                }}
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
                  wrapperStyle={{ fontSize: '0.85rem', cursor: 'pointer' }}
                  iconType="line"
                  onClick={(e) => {
                    const clickedCategory = e.value;
                    setSelectedCategory(selectedCategory === clickedCategory ? null : clickedCategory);
                  }}
                />
                {trends.datasets.slice(0, 15).map((dataset, index) => {
                  const colors = [
                    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                    '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e',
                    '#a855f7', '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9'
                  ];
                  const isSelected = selectedCategory === dataset.label;
                  const isOtherSelected = selectedCategory && !isSelected;

                  return (
                    <Line
                      key={dataset.label}
                      type="monotone"
                      dataKey={dataset.label}
                      stroke={colors[index % colors.length]}
                      strokeWidth={isSelected ? 4 : 2}
                      strokeOpacity={isOtherSelected ? 0.15 : 1}
                      dot={{ r: isSelected ? 4 : 3, strokeOpacity: isOtherSelected ? 0.15 : 1, fillOpacity: isOtherSelected ? 0.15 : 1 }}
                      activeDot={{
                        r: 6,
                        onClick: (e, payload) => {
                          const clickedCategory = dataset.label;
                          setSelectedCategory(selectedCategory === clickedCategory ? null : clickedCategory);
                        }
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            {/* Category selection chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '1.5rem',
              justifyContent: 'center'
            }}>
              {trends.datasets.slice(0, 15).map((dataset, index) => {
                const colors = [
                  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                  '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#22c55e',
                  '#a855f7', '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9'
                ];
                const isSelected = selectedCategory === dataset.label;

                return (
                  <button
                    key={dataset.label}
                    onClick={() => setSelectedCategory(isSelected ? null : dataset.label)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: isSelected ? colors[index % colors.length] : 'var(--bg-secondary)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      border: `2px solid ${colors[index % colors.length]}`,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? '600' : '500',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.background = colors[index % colors.length];
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    {dataset.label}
                  </button>
                );
              })}
            </div>
            {selectedCategory && (
              <p style={{
                textAlign: 'center',
                color: 'var(--reddit-orange)',
                fontWeight: 'bold',
                marginTop: '1rem',
                fontSize: '0.95rem'
              }}>
                📌 Viewing: <strong>{selectedCategory}</strong>
              </p>
            )}
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
