import React from 'react';

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const formatNumber = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const PostCard = ({ post }) => {
  const {
    title,
    author,
    created_at,
    score,
    num_comments,
    content,
    ai_summary,
    permalink,
    post_categories = []
  } = post;

  return (
    <div className="post-card">
      <div className="post-content">
        <h3 className="post-title">
          <a href={permalink} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h3>

        <div className="post-meta">
          <span className="post-author">by u/{author}</span>
          <span className="post-date">{formatDate(created_at)}</span>
        </div>

        {ai_summary && (
          <p className="post-summary">
            <span className="summary-icon">🤖</span>
            {ai_summary}
          </p>
        )}

        {!ai_summary && content && content.length > 0 && (
          <p className="post-preview">
            {content.length > 200 ? `${content.substring(0, 200)}...` : content}
          </p>
        )}

        {post_categories && post_categories.length > 0 && (
          <div className="post-categories">
            <span className="categories-label">Categories:</span>
            {post_categories.map((pc, index) => {
              const category = pc.categories;
              const parentName = category?.parent_name;
              const displayName = parentName
                ? `${parentName} › ${category.name}`
                : category?.name || 'Unknown';

              return (
                <span
                  key={index}
                  className="category-tag"
                  title={`Confidence: ${(pc.confidence * 100).toFixed(1)}%`}
                >
                  {displayName}
                  <span className="confidence-badge">
                    {(pc.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              );
            })}
          </div>
        )}

        <div className="post-stats">
          <span className="post-score">
            ⬆ {formatNumber(score)} upvotes
          </span>
          <span className="post-comments">
            💬 {formatNumber(num_comments)} comments
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
