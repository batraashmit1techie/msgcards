import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Smile,
  Send,
  Loader2
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import confetti from 'canvas-confetti';

const QUICK_TAGS = [
  'Morning coffee ☕',
  'Study grind 📚',
  'Walking outside 🌿',
  'Lunch break 🥗',
  'Gym session 🏋️',
  'Sunset view 🌅',
  'Late night thoughts 🌙'
];

const MOOD_OPTIONS = [
  { emoji: '✨', label: 'Glowing' },
  { emoji: '☕', label: 'Cozy' },
  { emoji: '🥱', label: 'Sleepy' },
  { emoji: '🚀', label: 'Productive' },
  { emoji: '🫂', label: 'Sweet' },
  { emoji: '🍕', label: 'Foodie' }
];

export function CreateCardModal({
  isOpen,
  onClose,
  onSubmitCard,
  currentUserKey,
  currentUser
}) {
  const [cardType, setCardType] = useState('moment'); // 'moment' | 'highlight' | 'thought' | 'status'
  const [content, setContent] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [location, setLocation] = useState('');
  const [selectedMood, setSelectedMood] = useState({ emoji: '✨', label: 'Glowing' });
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMsg('');
      const compressed = await compressImage(file, 900, 0.75);
      setPhotoDataUrl(compressed);
      if (cardType !== 'moment') {
        setCardType('moment');
      }
    } catch (err) {
      console.error('Image compression error', err);
      setErrorMsg('Could not process photo. Please try a different image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !photoDataUrl) {
      setErrorMsg('Please write a note or attach a photo.');
      return;
    }

    const newCard = {
      author: currentUserKey,
      authorName: currentUser?.name || 'Friend',
      authorAvatar: currentUser?.avatar || '🌸',
      type: cardType,
      content: content.trim(),
      photoUrl: photoDataUrl || null,
      moodEmoji: selectedMood.emoji,
      moodLabel: selectedMood.label,
      location: location.trim() || null,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().slice(0, 10),
      reactions: {}
    };

    await onSubmitCard(newCard);

    // Burst confetti!
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF684D', '#FFD166', '#FFB6C1', '#A87FF3']
      });
    } catch {
      // Ignore
    }

    // Reset and close
    setContent('');
    setPhotoDataUrl(null);
    setLocation('');
    setErrorMsg('');
    onClose();
  };

  const handleAddTag = (tag) => {
    if (content.includes(tag)) return;
    setContent((prev) => (prev ? `${prev} • ${tag}` : tag));
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="create-modal-sheet animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <span className="modal-icon-badge">✨</span>
            <h3 className="modal-title">New Daily Update</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Card Type Selector */}
        <div className="card-type-pills">
          <button
            type="button"
            className={`type-pill ${cardType === 'moment' ? 'active' : ''}`}
            onClick={() => setCardType('moment')}
          >
            📸 Snapshot
          </button>
          <button
            type="button"
            className={`type-pill ${cardType === 'highlight' ? 'active' : ''}`}
            onClick={() => setCardType('highlight')}
          >
            ✨ Highlight
          </button>
          <button
            type="button"
            className={`type-pill ${cardType === 'thought' ? 'active' : ''}`}
            onClick={() => setCardType('thought')}
          >
            💭 Thought
          </button>
          <button
            type="button"
            className={`type-pill ${cardType === 'status' ? 'active' : ''}`}
            onClick={() => setCardType('status')}
          >
            📍 Right Now
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-card-form">
          {/* Photo upload / preview area */}
          {photoDataUrl ? (
            <div className="photo-preview-box">
              <img src={photoDataUrl} alt="Upload preview" className="preview-image" />
              <button
                type="button"
                className="remove-photo-btn"
                onClick={() => setPhotoDataUrl(null)}
                title="Remove photo"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className={`photo-drop-zone ${isCompressing ? 'compressing' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {isCompressing ? (
                <div className="compressing-state">
                  <Loader2 size={24} className="spin-icon" />
                  <span>Optimizing photo for phone sync...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="camera-icon-circle">
                    <Camera size={22} color="#FF684D" />
                  </div>
                  <span className="drop-prompt-main">Snap or upload a photo moment</span>
                  <span className="drop-prompt-sub">Tap here to open camera / gallery</span>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
          />

          {/* Textarea */}
          <div className="input-group">
            <textarea
              className="card-textarea"
              placeholder={
                cardType === 'moment'
                  ? "What's the story behind this snapshot?..."
                  : cardType === 'highlight'
                  ? "What was the highlight or best moment of your day?..."
                  : cardType === 'status'
                  ? "What are you doing right now? Where are you?..."
                  : "Write whatever is on your mind today..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={400}
            />
            <span className="char-count">{content.length}/400</span>
          </div>

          {/* Quick preset tags */}
          <div className="quick-tags-scroll">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="quick-tag-chip"
                onClick={() => handleAddTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Mood & Location Row */}
          <div className="form-extra-row">
            <div className="mood-select-group">
              <span className="form-label-mini">Vibe:</span>
              <div className="mood-mini-pills">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.emoji}
                    type="button"
                    className={`mini-mood-btn ${selectedMood.emoji === mood.emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="location-input-group">
              <MapPin size={14} className="location-icon" />
              <input
                type="text"
                placeholder="Add place/location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="location-input"
                maxLength={40}
              />
            </div>
          </div>

          {errorMsg && <p className="form-error-text">{errorMsg}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-card-btn"
            disabled={isCompressing || (!content.trim() && !photoDataUrl)}
          >
            <Send size={16} />
            <span>Post to Our Board</span>
          </button>
        </form>
      </div>
    </div>
  );
}
