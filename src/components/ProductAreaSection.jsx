import React, { useState } from 'react';
import CompactPostCard from './CompactPostCard';

const ProductAreaSection = ({ productArea, posts, initialPostLimit = 3 }) => {
  const [showAllPosts, setShowAllPosts] = useState(false);

  const displayedPosts = showAllPosts ? posts : posts.slice(0, initialPostLimit);
  const hasMorePosts = posts.length > initialPostLimit;

  return (
    <div className="product-area-section">
      <div className="product-area-header">
        <h3 className="product-area-name">
          {productArea.name}
          <span className="product-area-count">({posts.length})</span>
        </h3>
      </div>

      <div className="product-area-posts">
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

export default ProductAreaSection;
