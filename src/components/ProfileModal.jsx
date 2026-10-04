import React, { useState } from 'react';
import { X, Check, UserCheck, Sparkles, Palette } from 'lucide-react';

const CUTE_AVATARS = ['🌸', '🍓', '🧸', '🐱', '☕', '🌻', '🥑', '🎨', '🌙', '🎧', '💫', '🌿', '🐰', '🍒', '🫧', '🍯'];

const PASTEL_COLORS = [
  '#FF7E67', // Warm Peach
  '#9C6ADE', // Soft Lilac
  '#F5A623', // Warm Honey
  '#4E9F76', // Sage
  '#4A90E2', // Dusk Sky
  '#E85D75', // Blush Rose
  '#00B4D8'  // Ocean Breeze
];

export function ProfileModal({
  isOpen,
  onClose,
  currentUserKey,
  onSwitchUser,
  users,
  onUpdateProfile
}) {
  if (!isOpen) return null;

  const user1 = users?.user1 || { name: 'Alex', avatar: '🌸', color: '#FF7E67' };
  const user2 = users?.user2 || { name: 'Maya', avatar: '🍓', color: '#9C6ADE' };

  const activeUser = currentUserKey === 'user1' ? user1 : user2;

  const [editName, setEditName] = useState(activeUser.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(activeUser.avatar || '🌸');
  const [selectedColor, setSelectedColor] = useState(activeUser.color || '#FF7E67');

  const handleSave = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    onUpdateProfile(currentUserKey, {
      name: editName.trim(),
      avatar: selectedAvatar,
      color: selectedColor
    });
    onClose();
  };

  const handleSelectActiveUser = (key) => {
    onSwitchUser(key);
    const targetUser = key === 'user1' ? user1 : user2;
    setEditName(targetUser.name);
    setSelectedAvatar(targetUser.avatar);
    setSelectedColor(targetUser.color);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="profile-modal-box animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <span className="modal-icon-badge">🧸</span>
            <h3 className="modal-title">Profile & Duo Settings</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Switch Who is using this device */}
        <div className="profile-switch-section">
          <span className="section-label">Who is using this phone?</span>
          <div className="profile-switch-cards">
            <button
              type="button"
              className={`user-select-card ${currentUserKey === 'user1' ? 'active' : ''}`}
              onClick={() => handleSelectActiveUser('user1')}
            >
              <span className="card-avatar">{user1.avatar}</span>
              <span className="card-name">{user1.name}</span>
              {currentUserKey === 'user1' && (
                <span className="active-badge">Active <Check size={12} /></span>
              )}
            </button>

            <button
              type="button"
              className={`user-select-card ${currentUserKey === 'user2' ? 'active' : ''}`}
              onClick={() => handleSelectActiveUser('user2')}
            >
              <span className="card-avatar">{user2.avatar}</span>
              <span className="card-name">{user2.name}</span>
              {currentUserKey === 'user2' && (
                <span className="active-badge">Active <Check size={12} /></span>
              )}
            </button>
          </div>
        </div>

        {/* Edit profile form */}
        <form onSubmit={handleSave} className="profile-edit-form">
          <div className="input-group">
            <label className="form-field-label">Your Name</label>
            <input
              type="text"
              className="profile-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={20}
              placeholder="Your name or nickname"
            />
          </div>

          {/* Avatar Picker */}
          <div className="input-group">
            <label className="form-field-label">Choose Avatar Emoji</label>
            <div className="avatar-grid-picker">
              {CUTE_AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  className={`avatar-pick-btn ${selectedAvatar === av ? 'picked' : ''}`}
                  onClick={() => setSelectedAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color theme picker */}
          <div className="input-group">
            <label className="form-field-label">Accent Theme Color</label>
            <div className="color-palette-row">
              {PASTEL_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`color-pick-bubble ${selectedColor === col ? 'picked' : ''}`}
                  style={{ backgroundColor: col }}
                  onClick={() => setSelectedColor(col)}
                  title={col}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="save-profile-btn">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
