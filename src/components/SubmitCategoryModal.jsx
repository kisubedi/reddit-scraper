import React, { useState } from 'react';
import { submitCategoryRequest } from '../services/api';

const SubmitCategoryModal = ({ isOpen, onClose }) => {
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await submitCategoryRequest(topicName, description);
      setSuccess(true);

      // Reset form after 2 seconds and close
      setTimeout(() => {
        setTopicName('');
        setDescription('');
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit category request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setTopicName('');
      setDescription('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Submit a Category</h2>
          <button className="modal-close" onClick={handleClose} disabled={submitting}>
            ×
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Category request submitted successfully!</p>
            <p className="success-subtext">Thank you for your suggestion.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="topic-name">
                Topic Name <span className="required">*</span>
              </label>
              <input
                id="topic-name"
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., Custom Connectors, Power Automate Integration"
                maxLength={100}
                required
                disabled={submitting}
                autoFocus
              />
              <div className="char-count">{topicName.length}/100</div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what types of posts should fall under this category..."
                rows={4}
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="error-message-modal">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !topicName.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitCategoryModal;
