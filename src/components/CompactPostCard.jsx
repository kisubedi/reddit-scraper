import React from 'react';

const CompactPostCard = ({ post }) => {
  const { title, permalink, score, num_comments } = post;

  return (
    <div className="compact-post-card">
      <div className="compact-post-title">{title}</div>
      <div className="compact-post-meta">
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="reddit-link"
        >
          Link to Reddit post →
        </a>
        <span className="compact-stats">
          ⬆ {score} • 💬 {num_comments}
        </span>
      </div>
    </div>
  );
};

export default CompactPostCard;
