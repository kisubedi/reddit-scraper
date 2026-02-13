import React, { useState } from 'react';
import CompactPostCard from './CompactPostCard';

const CategorySection = ({ category, posts, initialPostLimit = 3 }) => {
  const [showAllPosts, setShowAllPosts] = useState(false);

  const displayedPosts = showAllPosts ? posts : posts.slice(0, initialPostLimit);
  const hasMorePosts = posts.length > initialPostLimit;

  return (
    <div className="category-section">
      <div className="category-header">
        <h3 className="category-name">
          {category.name}
          <span className="category-count">({posts.length})</span>
        </h3>
        {category.description && (
          <p className="category-description">{category.description}</p>
        )}
      </div>

      <div className="category-posts">
        {displayedPosts.map(post => (
          <CompactPostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMorePosts && (
        <button
          className="see-more-btn"
          onClick={() => setShowAllPosts(!showAllPosts)}
        >
          {showAllPosts ? 'Show less' : `See ${posts.length - initialPostLimit} more posts`}
        </button>
      )}
    </div>
  );
};

export default CategorySection;
