import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  MapPin,
  Trash2,
  Smile,
  Send,
  Sparkles,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_REACTIONS = ['❤️', '✨', '🥺', '😂', '🔥', '☕', '🫂'];

export function UpdateCard({
  card,
  currentUserKey,
  onToggleReaction,
  onAddComment,
  onDeleteCard
}) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isAuthor = card.author === currentUserKey;
  const reactions = card.reactions || {};
  const comments = card.comments ? Object.values(card.comments) : [];

  const formatCardTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleReactionClick = (emoji) => {
    onToggleReaction(card.id, emoji);

    // Subtle micro-confetti on click
    try {
      confetti({
        particleCount: 12,
        spread: 40,
        origin: { y: 0.7 }
      });
    } catch {
      // Ignore
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(card.id, commentText.trim());
    setCommentText('');
  };

  const getBadgeForType = (type) => {
    switch (type) {
      case 'moment':
        return { label: '📸 Snapshot', color: 'badge-moment' };
      case 'highlight':
        return { label: '✨ Highlight', color: 'badge-highlight' };
      case 'vibe':
        return { label: '☕ Vibe Check', color: 'badge-vibe' };
      case 'status':
        return { label: '📍 Right Now', color: 'badge-status' };
      default:
        return { label: '💭 Thought', color: 'badge-thought' };
    }
  };

  const badge = getBadgeForType(card.type);

  return (
    <article className="update-card animate-pop-in">
      {/* Top author row */}
      <div className="card-top-row">
        <div className="card-author-group">
          <div className="card-avatar-wrapper">
            <span className="card-avatar-emoji">{card.authorAvatar || '🌸'}</span>
          </div>
          <div className="card-meta-text">
            <div className="card-author-name-row">
              <span className="card-author-name">{card.authorName || 'Friend'}</span>
              <span className={`card-type-badge ${badge.color}`}>{badge.label}</span>
            </div>
            <div className="card-sub-meta">
              <span className="card-time">{formatCardTime(card.timestamp)}</span>
              {card.location && (
                <span className="card-location">
                  <MapPin size={11} />
                  {card.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {isAuthor && (
          <button
            className="card-delete-btn"
            onClick={() => {
              if (window.confirm('Delete this update card?')) {
                onDeleteCard(card.id);
              }
            }}
            title="Delete card"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Photo frame (if attached) */}
      {card.photoUrl && (
        <div className="card-photo-polaroid">
          <img
            src={card.photoUrl}
            alt="Shared moment"
            className="card-photo-img"
            loading="lazy"
          />
        </div>
      )}

      {/* Card text content */}
      {card.content && (
        <p className="card-body-text">{card.content}</p>
      )}

      {/* Card Mood pill if present */}
      {card.moodEmoji && (
        <div className="card-mood-pill">
          <span className="mood-pill-icon">{card.moodEmoji}</span>
          <span className="mood-pill-text">{card.moodLabel || 'Feeling good'}</span>
        </div>
      )}

      {/* Interactive Reactions Tray */}
      <div className="card-footer-tray">
        <div className="reactions-list">
          {Object.entries(reactions).map(([emoji, users]) => {
            const userCount = Object.keys(users || {}).length;
            if (userCount === 0) return null;
            const hasReacted = users && users[currentUserKey];

            return (
              <button
                key={emoji}
                className={`reaction-pill ${hasReacted ? 'active' : ''}`}
                onClick={() => handleReactionClick(emoji)}
                title={hasReacted ? 'Remove reaction' : 'Add reaction'}
              >
                <span className="reaction-emoji">{emoji}</span>
                <span className="reaction-count">{userCount}</span>
              </button>
            );
          })}

          {/* Quick React Picker Trigger */}
          <div className="emoji-picker-inline-wrapper">
            <button
              className="quick-react-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="React to this update"
            >
              <Smile size={16} />
              <span>React</span>
            </button>

            {showEmojiPicker && (
              <div className="quick-emoji-popup animate-pop-in">
                {POPULAR_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className="popup-emoji-btn"
                    onClick={() => {
                      handleReactionClick(emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment toggle button */}
        <button
          className={`comment-toggle-btn ${comments.length > 0 ? 'has-comments' : ''}`}
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <MessageCircle size={15} />
          <span>{comments.length > 0 ? comments.length : 'Reply'}</span>
        </button>
      </div>

      {/* Comments section */}
      {(comments.length > 0 || showCommentInput) && (
        <div className="card-comments-drawer">
          {comments.map((c) => (
            <div key={c.id || c.timestamp} className="mini-comment-item">
              <span className="comment-author">{c.authorName}:</span>
              <span className="comment-text">{c.text}</span>
            </div>
          ))}

          {showCommentInput && (
            <form onSubmit={handleCommentSubmit} className="mini-comment-form">
              <input
                type="text"
                placeholder="Leave a sweet note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-input"
                maxLength={140}
                autoFocus
              />
              <button type="submit" className="comment-submit-btn" disabled={!commentText.trim()}>
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
