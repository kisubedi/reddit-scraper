import React, { useState } from 'react';

const FilterPanel = ({ filters, onFilterChange, onSearch, categories }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (parentId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  return (
    <div className="filter-panel">
      <h2>Filters</h2>

      <div className="filter-group">
        <label htmlFor="search">Search:</label>
        <input
          type="text"
          id="search"
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Category:</label>
        <div className="hierarchical-categories">
          <div
            className={`category-item ${filters.category === '' ? 'active' : ''}`}
            onClick={() => onFilterChange('category', '')}
          >
            📋 All Categories
          </div>

          {categories.map(parent => (
            <div key={parent.id} className="category-parent">
              <div
                className="category-parent-header"
                onClick={() => toggleCategory(parent.id)}
              >
                <span className="expand-icon">
                  {expandedCategories[parent.id] ? '▼' : '▶'}
                </span>
                <span className="category-name">{parent.name}</span>
                <span className="category-count">
                  ({(parent.subcategories || []).reduce((sum, sub) => sum + (sub.post_count || 0), 0)})
                </span>
              </div>

              {expandedCategories[parent.id] && (
                <div className="category-children">
                  {(parent.subcategories || []).map(sub => (
                    <div
                      key={sub.id}
                      className={`category-child ${filters.category === sub.name ? 'active' : ''}`}
                      onClick={() => onFilterChange('category', sub.name)}
                    >
                      <span className="category-name">{sub.name}</span>
                      <span className="category-count">({sub.post_count || 0})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="sortBy">Sort By:</label>
        <select
          id="sortBy"
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
        >
          <option value="created_at">Date Posted</option>
          <option value="score">Score</option>
          <option value="num_comments">Comments</option>
        </select>
      </div>

      <button
        className="clear-filters-btn"
        onClick={() => onFilterChange('reset')}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;
