import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Sparkles, Send } from 'lucide-react';

export function ShareModal({ isOpen, onClose, roomId, onSwitchRoom }) {
  const [copied, setCopied] = useState(false);
  const [newRoomInput, setNewRoomInput] = useState('');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : `https://duoday.vercel.app/?room=${roomId}`;

  // Simple QR code image URL generator via safe public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=2E2522&bgcolor=FFF9F5&data=${encodeURIComponent(currentUrl)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (!newRoomInput.trim()) return;
    onSwitchRoom(newRoomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    setNewRoomInput('');
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="share-modal-box animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <span className="modal-icon-badge">💌</span>
            <h3 className="modal-title">Invite Your Friend</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="share-intro-text">
          Send this private link to your friend. When she opens it on her phone, you will both be instantly connected to this exact shared board!
        </p>

        {/* QR Code preview */}
        <div className="qr-code-frame">
          <img src={qrCodeUrl} alt="Room QR Code" className="qr-image" />
          <span className="qr-label">Scan with phone camera to open</span>
        </div>

        {/* Copy Link Input Box */}
        <div className="copy-link-group">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="share-link-input"
            onClick={(e) => e.target.select()}
          />
          <button
            type="button"
            className={`copy-link-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Switch / Custom room code */}
        <div className="custom-room-section">
          <span className="custom-room-label">Want a special room name?</span>
          <form onSubmit={handleRoomSubmit} className="custom-room-form">
            <input
              type="text"
              placeholder="e.g. maya-and-me"
              value={newRoomInput}
              onChange={(e) => setNewRoomInput(e.target.value)}
              className="room-input"
              maxLength={25}
            />
            <button type="submit" className="room-btn" disabled={!newRoomInput.trim()}>
              Switch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
