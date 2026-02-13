import React from 'react';

const CategoryFilterSidebar = ({
  categories,
  productAreas,
  selectedCategories,
  selectedProductAreas,
  onCategoryToggle,
  onProductAreaToggle
}) => {
  return (
    <aside className="filter-sidebar">
      <div className="filter-section">
        <h3 className="filter-title">📑 Categories</h3>
        <div className="filter-list">
          {categories.map(category => (
            <label key={category.id} className="filter-item">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => onCategoryToggle(category.id)}
              />
              <span className="filter-label">
                {category.name}
                <span className="filter-count">({category.posts.length})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {productAreas.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">🏢 Product Areas</h3>
          <div className="filter-list">
            {productAreas.map(productArea => (
              <label key={productArea.id} className="filter-item">
                <input
                  type="checkbox"
                  checked={selectedProductAreas.includes(productArea.id)}
                  onChange={() => onProductAreaToggle(productArea.id)}
                />
                <span className="filter-label">
                  {productArea.name}
                  <span className="filter-count">({productArea.posts.length})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default CategoryFilterSidebar;
