import React from 'react';

const FilterPanel = ({ filters, onFilterChange, onSearch, categories }) => {
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
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name} ({category.post_count || 0})
            </option>
          ))}
        </select>
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
