import React, { useState } from 'react';
import { Sparkles, Smile, Coffee, Moon, Flame, HeartHandshake, Zap, Plus } from 'lucide-react';

const PRESET_MOODS = [
  { emoji: '✨', label: 'Glowing & happy' },
  { emoji: '☕', label: 'Cozy & relaxed' },
  { emoji: '🥱', label: 'Sleepy / low energy' },
  { emoji: '🚀', label: 'Crushing goals' },
  { emoji: '🫂', label: 'Need cozy hugs' },
  { emoji: '🍕', label: 'Craving snacks' },
  { emoji: '🎧', label: 'In deep focus' },
  { emoji: '🥳', label: 'Hyped & excited' },
];

export function MoodTicker({ currentUser, partnerUser, onUpdateMood }) {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('💫');
  const [customText, setCustomText] = useState('');

  const currentMoodEmoji = currentUser?.moodEmoji || '✨';
  const currentMoodLabel = currentUser?.moodLabel || 'Feeling good';

  const handleSelectPreset = (preset) => {
    onUpdateMood(preset.emoji, preset.label);
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onUpdateMood(customEmoji || '💫', customText.trim());
    setIsEditingCustom(false);
    setCustomText('');
  };

  return (
    <div className="mood-ticker-wrapper">
      <div className="mood-ticker-card">
        {/* Partner vibe highlight card */}
        {partnerUser && (
          <div className="partner-vibe-banner">
            <div className="partner-vibe-left">
              <span className="partner-vibe-emoji">{partnerUser.moodEmoji || '☕'}</span>
              <div className="partner-vibe-text">
                <span className="partner-vibe-label">
                  {partnerUser.name}'s vibe right now:
                </span>
                <span className="partner-vibe-quote">
                  "{partnerUser.moodLabel || 'Chilling peacefully'}"
                </span>
              </div>
            </div>
            <span className="partner-vibe-badge">Live</span>
          </div>
        )}

        {/* Your vibe selector */}
        <div className="my-vibe-section">
          <div className="my-vibe-header">
            <span className="my-vibe-title">
              <Smile size={16} className="vibe-icon" />
              Check your vibe:
            </span>
            <span className="current-vibe-preview">
              {currentMoodEmoji} {currentMoodLabel}
            </span>
          </div>

          <div className="mood-pills-scroll">
            {PRESET_MOODS.map((mood) => {
              const isSelected = currentMoodEmoji === mood.emoji;
              return (
                <button
                  key={mood.emoji}
                  className={`mood-pill-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectPreset(mood)}
                  type="button"
                >
                  <span className="pill-emoji">{mood.emoji}</span>
                  <span className="pill-text">{mood.label}</span>
                </button>
              );
            })}

            <button
              className="mood-pill-btn custom-btn"
              onClick={() => setIsEditingCustom(!isEditingCustom)}
              type="button"
            >
              <Plus size={14} />
              <span>Custom</span>
            </button>
          </div>

          {isEditingCustom && (
            <form onSubmit={handleSaveCustom} className="custom-mood-form animate-pop-in">
              <input
                type="text"
                className="custom-emoji-input"
                value={customEmoji}
                maxLength={4}
                onChange={(e) => setCustomEmoji(e.target.value)}
                title="Emoji"
              />
              <input
                type="text"
                className="custom-text-input"
                placeholder="What are you up to or feeling?..."
                value={customText}
                maxLength={40}
                onChange={(e) => setCustomText(e.target.value)}
                autoFocus
              />
              <button type="submit" className="custom-submit-btn">
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
