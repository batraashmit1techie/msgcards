import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { compressImage } from './utils/imageCompressor';
import { startRoomSync } from './services/syncService';
import {
  Camera,
  Heart,
  Send,
  Trash2,
  Share2,
  Check,
  Sparkles,
  Zap,
  X,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

// All 26 quick day-to-day update cards requested
export const QUICK_CARDS = [
  // Daily & Love
  { id: 'good_morning', label: 'Good morning', emoji: '☀️', category: 'daily' },
  { id: 'woke_up', label: 'Woke up', emoji: '🥱', category: 'daily' },
  { id: 'how_are_you', label: 'How are you?', emoji: '💭', category: 'daily' },
  { id: 'ily', label: 'ily', emoji: '❤️', category: 'daily' },
  { id: 'imy', label: 'imy', emoji: '🥺', category: 'daily' },
  { id: 'good_night', label: 'Good night', emoji: '🌙', category: 'daily' },
  { id: 'im_sleeping', label: "I'm sleeping", emoji: '😴', category: 'daily' },
  { id: 'what_happened', label: 'What happened?', emoji: '❓', category: 'daily' },

  // Mood & Vibe
  { id: 'good', label: 'Good', emoji: '😊', category: 'health' },
  { id: 'bad', label: 'Bad', emoji: '😞', category: 'health' },
  { id: 'mood_not_good', label: 'Mood not good', emoji: '🌧️', category: 'health' },
  { id: 'im_not_well', label: "I'm not well", emoji: '🥺', category: 'health' },
  { id: 'im_sick', label: "I'm sick", emoji: '🤒', category: 'health' },
  { id: 'im_in_pain', label: "I'm in pain", emoji: '😣', category: 'health' },
  { id: 'cramps', label: 'Cramps', emoji: '🩸', category: 'health' },
  { id: 'periods', label: 'Periods', emoji: '🩹', category: 'health' },

  // Places & Routine
  { id: 'going_college', label: 'Going college', emoji: '🎓', category: 'routine' },
  { id: 'going_office', label: 'Going office', emoji: '💼', category: 'routine' },
  { id: 'going_gym', label: 'Going gym', emoji: '🏋️', category: 'routine' },
  { id: 'going_german', label: 'Going German', emoji: '🇩🇪', category: 'routine' },
  { id: 'coming_back_home', label: 'Coming back home', emoji: '🏡', category: 'routine' },
  { id: 'going_out_friends', label: 'Going out with friends', emoji: '👯', category: 'social' },
  { id: 'going_out_family', label: 'Going out with family', emoji: '👨‍👩‍👧', category: 'social' },
  { id: 'family', label: 'Family', emoji: '🏠', category: 'social' },

  // Chaos
  { id: 'office_chaos', label: 'Office chaos', emoji: '🤯', category: 'chaos' },
  { id: 'college_chaos', label: 'College friends chaos', emoji: '🌪️', category: 'chaos' }
];

const CATEGORIES = [
  { id: 'all', label: 'All Cards' },
  { id: 'daily', label: '☀️ Daily & Love' },
  { id: 'health', label: '🩹 Mood & Health' },
  { id: 'routine', label: '🎓 Going Somewhere' },
  { id: 'social', label: '👯 Friends & Family' },
  { id: 'chaos', label: '🤯 Chaos' }
];

function getInitialRoom() {
  if (typeof window === 'undefined') return 'our-space';
  const params = new URLSearchParams(window.location.search);
  const q = params.get('pair') || params.get('room');
  if (q && q.trim()) return q.trim().toLowerCase();
  return localStorage.getItem('duo_room_id') || 'our-space';
}

function getInitialRole() {
  if (typeof window === 'undefined') return 'me';
  return localStorage.getItem('duo_user_role') || 'me';
}

export default function App() {
  const [roomId, setRoomId] = useState(getInitialRoom);
  const [role, setRole] = useState(getInitialRole); // 'me' or 'her'
  const [cards, setCards] = useState([]);
  const [customText, setCustomText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCustomBox, setShowCustomBox] = useState(false);

  const fileInputRef = useRef(null);
  const syncRef = useRef(null);

  // Sync URL & localStorage for Room
  useEffect(() => {
    localStorage.setItem('duo_room_id', roomId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('pair') !== roomId) {
        url.searchParams.set('pair', roomId);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [roomId]);

  // Sync role in localStorage
  useEffect(() => {
    localStorage.setItem('duo_user_role', role);
  }, [role]);

  // Start real-time sync
  useEffect(() => {
    const sync = startRoomSync(
      roomId,
      (updatedCards) => {
        setCards(updatedCards);
      },
      (incomingCard) => {
        // When the other person updates, show notification
        if (incomingCard.author !== role) {
          const authorLabel = incomingCard.author === 'me' ? 'Me' : 'Her';
          showToast(`${authorLabel}: ${incomingCard.text} ✨`);
          try {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          } catch {
            // Ignore
          }
        }
      }
    );

    syncRef.current = sync;

    return () => {
      sync.cleanup();
    };
  }, [roomId, role]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Post any card (quick card or custom card)
  const postNewCard = async (text, photoUrl = null) => {
    if (!text.trim() && !photoUrl) return;

    setIsPosting(true);

    const newCard = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      author: role, // 'me' or 'her'
      text: text.trim(),
      photoUrl: photoUrl || null,
      timestamp: Date.now(),
      hearts: {}
    };

    if (syncRef.current) {
      await syncRef.current.addCard(newCard);
    }

    // Mini confetti burst
    try {
      confetti({
        particleCount: 22,
        spread: 45,
        origin: { y: 0.3 },
        colors: ['#FF7E67', '#FFA07A', '#FF6584']
      });
    } catch {
      // Ignore
    }

    showToast(`Posted: ${text} ✨`);
    setIsPosting(false);
  };

  // Quick-tap card handler
  const handleQuickTap = (quickCard) => {
    postNewCard(`${quickCard.label} ${quickCard.emoji}`);
  };

  // Custom text submit
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customText.trim() && !photo) return;
    await postNewCard(customText, photo);
    setCustomText('');
    setPhoto(null);
    setShowCustomBox(false);
  };

  // Photo Select
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 0.72);
      setPhoto(compressed);
      setShowCustomBox(true);
    } catch (err) {
      console.error('Photo error', err);
    }
  };

  // Toggle Heart
  const handleToggleHeart = async (cardId) => {
    if (syncRef.current) {
      await syncRef.current.toggleHeart(cardId, role);
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Delete this update?')) {
      if (syncRef.current) {
        await syncRef.current.deleteCard(cardId);
      }
    }
  };

  // Copy share link
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?pair=${roomId}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const inp = document.createElement('input');
        inp.value = shareUrl;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        document.body.removeChild(inp);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const filteredQuickCards = QUICK_CARDS.filter((c) => {
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  return (
    <div className="simple-app-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="incoming-toast-pill animate-pop-in">
          <Sparkles size={16} color="#FF684D" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="simple-header">
        <div className="header-brand">
          <div className="brand-dot-pulse" />
          <h1 className="brand-title">Our Daily Cards</h1>
        </div>

        <button
          className={`btn-share-link ${copiedLink ? 'copied' : ''}`}
          onClick={handleCopyLink}
          title="Share link with her"
        >
          {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
        </button>
      </header>

      {/* Role Picker (Who is this phone) */}
      <div className="role-switch-bar">
        <span className="role-prompt-label">This phone is:</span>
        <div className="role-pill-group">
          <button
            type="button"
            className={`role-pill-btn ${role === 'me' ? 'active me' : ''}`}
            onClick={() => setRole('me')}
          >
            <span className="role-icon">👤</span>
            <span>Me</span>
          </button>
          <button
            type="button"
            className={`role-pill-btn ${role === 'her' ? 'active her' : ''}`}
            onClick={() => setRole('her')}
          >
            <span className="role-icon">🌸</span>
            <span>Her</span>
          </button>
        </div>
      </div>

      {/* Quick Tap Cards Section */}
      <section className="quick-cards-panel">
        <div className="quick-cards-header">
          <div className="quick-title-group">
            <Zap size={16} color="#FF684D" />
            <h2 className="quick-cards-title">Tap to Update Instantly</h2>
          </div>
          <span className="quick-hint">1-tap sends to {role === 'me' ? 'her' : 'his'} phone</span>
        </div>

        {/* Category Tabs */}
        <div className="quick-category-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Cards Grid */}
        <div className="quick-cards-grid">
          {filteredQuickCards.map((qc) => (
            <button
              key={qc.id}
              className="quick-card-btn"
              onClick={() => handleQuickTap(qc)}
              disabled={isPosting}
              title={`Tap to send "${qc.label}"`}
            >
              <span className="qc-emoji">{qc.emoji}</span>
              <span className="qc-label">{qc.label}</span>
            </button>
          ))}
        </div>

        {/* Toggle Custom Note / Photo Bar */}
        <div className="custom-note-trigger-row">
          <button
            type="button"
            className="btn-toggle-custom"
            onClick={() => setShowCustomBox(!showCustomBox)}
          >
            <span>{showCustomBox ? '▲ Hide custom note' : '✏️ Write custom note / add photo'}</span>
          </button>
        </div>

        {/* Custom Note Composer (collapsible) */}
        {showCustomBox && (
          <form onSubmit={handleCustomSubmit} className="custom-composer-box animate-pop-in">
            <textarea
              className="custom-textarea"
              placeholder={`Write a custom message for ${role === 'me' ? 'her' : 'him'}...`}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={2}
              maxLength={400}
              autoFocus
            />

            {photo && (
              <div className="composer-photo-preview animate-pop-in">
                <img src={photo} alt="Preview" className="preview-img" />
                <button
                  type="button"
                  className="btn-remove-photo"
                  onClick={() => setPhoto(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="custom-composer-actions">
              <button
                type="button"
                className="btn-attach-camera"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
                <span>{photo ? 'Change Photo' : 'Add Photo'}</span>
              </button>

              <button
                type="submit"
                className="btn-post-custom"
                disabled={isPosting || (!customText.trim() && !photo)}
              >
                <Send size={14} />
                <span>Send Note</span>
              </button>
            </div>
          </form>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </section>

      {/* Day-to-Day Cards Feed */}
      <section className="cards-feed-section">
        <div className="feed-header-line">
          <span className="feed-title">Day-to-Day Updates</span>
          <span className="feed-count">{cards.length} updates</span>
        </div>

        {cards.length > 0 ? (
          <div className="cards-list">
            {cards.map((card) => {
              const isMine = card.author === role;
              const authorLabel = card.author === 'me' ? 'Me' : 'Her';
              const heartCount = Object.keys(card.hearts || {}).length;
              const hasHearted = card.hearts && card.hearts[role];

              return (
                <article
                  key={card.id}
                  className={`feed-card animate-pop-in ${card.author === 'me' ? 'from-me' : 'from-her'}`}
                >
                  <div className="feed-card-header">
                    <div className="author-badge-group">
                      <span className={`author-avatar-dot ${card.author}`}>
                        {card.author === 'me' ? '👤' : '🌸'}
                      </span>
                      <div className="author-text-meta">
                        <span className="author-name">{authorLabel}</span>
                        <span className="post-timestamp">{formatTime(card.timestamp)}</span>
                      </div>
                    </div>

                    {isMine && (
                      <button
                        className="btn-delete-card"
                        onClick={() => handleDeleteCard(card.id)}
                        title="Delete card"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Photo frame if attached */}
                  {card.photoUrl && (
                    <div className="card-photo-box">
                      <img src={card.photoUrl} alt="Moment" className="card-image" loading="lazy" />
                    </div>
                  )}

                  {/* Card text */}
                  {card.text && (
                    <p className="card-text-content">{card.text}</p>
                  )}

                  {/* Card bottom bar with Love button */}
                  <div className="card-bottom-bar">
                    <button
                      className={`btn-heart-react ${hasHearted ? 'hearted' : ''}`}
                      onClick={() => handleToggleHeart(card.id)}
                      title="Heart this update"
                    >
                      <Heart
                        size={15}
                        fill={hasHearted ? '#FF6584' : 'none'}
                        color={hasHearted ? '#FF6584' : 'currentColor'}
                      />
                      <span>{heartCount > 0 ? `${heartCount} Love` : 'Love'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-box animate-fade-in">
            <span className="empty-emoji">💌</span>
            <h3 className="empty-title">No cards posted yet</h3>
            <p className="empty-text">
              Tap any quick card above like "Good morning ☀️" or "Going college 🎓" to post your first update!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
