import React from 'react';
import PostCard from './PostCard';

const PostList = ({ posts, loading, error, onLoadMore, hasMore }) => {
  if (error) {
    return (
      <div className="error-message">
        <h3>Error loading posts</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="loading-message">
        <p>Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty-message">
        <h3>No posts found</h3>
        <p>Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="load-more-btn"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default PostList;
