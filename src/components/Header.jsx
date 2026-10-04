import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function Header({
  currentUser,
  partnerUser,
  currentUserKey,
  onOpenProfile,
  onOpenShare,
  onOpenSettings,
  onSendNudge,
  isFirebaseActive,
  roomId
}) {
  const [nudgeSent, setNudgeSent] = useState(false);

  const handleNudgeClick = () => {
    onSendNudge();
    setNudgeSent(true);

    // Mini confetti burst on sender's device too
    try {
      confetti({
        particleCount: 24,
        spread: 60,
        origin: { y: 0.15 },
        colors: ['#FF684D', '#FFA07A', '#FFB6C1', '#FF69B4']
      });
    } catch {
      // Ignore
    }

    setTimeout(() => {
      setNudgeSent(false);
    }, 2500);
  };

  const partnerIsOnline = partnerUser?.isOnline;
  const partnerLastActive = partnerUser?.lastActive;

  const formatLastSeen = () => {
    if (partnerIsOnline) return 'Online now';
    if (!partnerLastActive) return 'Offline';
    const diffMins = Math.floor((Date.now() - partnerLastActive) / (1000 * 60));
    if (diffMins < 1) return 'Just active';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Earlier this week';
  };

  return (
    <header className="header-container">
      {/* Top brand & status row */}
      <div className="header-top-row">
        <div className="header-logo-group">
          <div className="header-logo-badge">
            <span className="logo-sparkle">✨</span>
          </div>
          <div>
            <h1 className="header-app-title">DuoDay</h1>
            <p className="header-room-subtitle">
              Space: <span className="room-code-tag">{roomId}</span>
            </p>
          </div>
        </div>

        <div className="header-actions-right">
          {/* Quick Nudge / Poke Button */}
          <button
            className={`btn-nudge ${nudgeSent ? 'sent' : ''}`}
            onClick={handleNudgeClick}
            title={`Send love to ${partnerUser?.name || 'your friend'}`}
          >
            <Heart
              size={17}
              className={`nudge-heart-icon ${nudgeSent ? 'beating' : ''}`}
              fill={nudgeSent ? '#FF684D' : 'currentColor'}
            />
            <span className="nudge-text">
              {nudgeSent ? 'Sent! 💓' : 'Poke'}
            </span>
          </button>

          {/* Share Room Button */}
          <button
            className="header-icon-btn"
            onClick={onOpenShare}
            title="Invite friend with link"
            aria-label="Share room"
          >
            <Share2 size={18} />
          </button>

          {/* Settings / Firebase Status */}
          <button
            className="header-icon-btn"
            onClick={onOpenSettings}
            title={isFirebaseActive ? "Connected to Firebase Realtime DB" : "Local Sync / Configure Firebase"}
            aria-label="Settings"
          >
            <Settings size={18} />
            <span
              className={`status-dot-badge ${isFirebaseActive ? 'active' : 'warn'}`}
              title={isFirebaseActive ? 'Live Realtime Cloud Sync Active' : 'Local / Setup Mode'}
            />
          </button>
        </div>
      </div>

      {/* Duo Profile Capsule Bar */}
      <div className="duo-capsule-card">
        {/* Current User Pill */}
        <button
          className="duo-user-pill current"
          onClick={onOpenProfile}
          title="Click to switch or edit profile"
        >
          <div
            className="user-avatar-circle"
            style={{ backgroundColor: currentUser?.color ? `${currentUser.color}25` : '#FFEBE7' }}
          >
            <span className="avatar-emoji">{currentUser?.avatar || '🌸'}</span>
          </div>
          <div className="user-info-text">
            <div className="user-name-row">
              <span className="user-name">{currentUser?.name || 'You'}</span>
              <span className="you-tag">You</span>
            </div>
            <span className="user-mood-preview">
              {currentUser?.moodEmoji || '✨'} {currentUser?.moodLabel || 'Feeling good'}
            </span>
          </div>
        </button>

        {/* Center Connection Heart */}
        <div className="duo-connection-knot" title="Connected in real-time">
          <div className="connection-line" />
          <div className="connection-heart-icon">
            <Heart size={14} fill="#FF8A75" color="#FF8A75" />
          </div>
          <div className="connection-line" />
        </div>

        {/* Partner User Pill */}
        <div
          className="duo-user-pill partner"
          onClick={onOpenProfile}
          title={`Partner: ${partnerUser?.name || 'Friend'}. Click to switch view.`}
        >
          <div
            className="user-avatar-circle"
            style={{ backgroundColor: partnerUser?.color ? `${partnerUser.color}25` : '#EDE5FC' }}
          >
            <span className="avatar-emoji">{partnerUser?.avatar || '🍓'}</span>
            <span className={`presence-pip ${partnerIsOnline ? 'online' : 'offline'}`} />
          </div>
          <div className="user-info-text">
            <div className="user-name-row">
              <span className="user-name">{partnerUser?.name || 'Friend'}</span>
              <span className={`partner-status-tag ${partnerIsOnline ? 'online' : ''}`}>
                {formatLastSeen()}
              </span>
            </div>
            <span className="user-mood-preview">
              {partnerUser?.moodEmoji || '☕'} {partnerUser?.moodLabel || 'Chilling'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
