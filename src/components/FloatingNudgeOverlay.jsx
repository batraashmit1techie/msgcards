import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

export function FloatingNudgeOverlay({ nudge, currentUserKey }) {
  const [activeNudge, setActiveNudge] = useState(null);

  useEffect(() => {
    if (!nudge || !nudge.timestamp) return;

    // Only show if the nudge was sent by the other person within the last 9 seconds
    const isRecent = Date.now() - nudge.timestamp < 9000;
    const isFromPartner = nudge.fromUserKey !== currentUserKey;

    if (isRecent && isFromPartner) {
      setActiveNudge(nudge);

      // Trigger subtle phone vibration if available
      try {
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {
        // Ignore
      }

      const timer = setTimeout(() => {
        setActiveNudge(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [nudge, currentUserKey]);

  if (!activeNudge) return null;

  // Generate 8 floating hearts with random offsets
  const hearts = [
    { id: 1, left: '20%', xShift: '-30px', rot: '-20deg', delay: '0s', size: 38 },
    { id: 2, left: '35%', xShift: '25px', rot: '15deg', delay: '0.2s', size: 48 },
    { id: 3, left: '50%', xShift: '-15px', rot: '-10deg', delay: '0.1s', size: 54 },
    { id: 4, left: '65%', xShift: '35px', rot: '25deg', delay: '0.35s', size: 42 },
    { id: 5, left: '80%', xShift: '-20px', rot: '-15deg', delay: '0.25s', size: 46 },
    { id: 6, left: '42%', xShift: '10px', rot: '5deg', delay: '0.5s', size: 50 },
    { id: 7, left: '28%', xShift: '-35px', rot: '-25deg', delay: '0.6s', size: 36 },
    { id: 8, left: '72%', xShift: '20px', rot: '18deg', delay: '0.45s', size: 40 },
  ];

  return (
    <div className="nudge-overlay-root pointer-events-none">
      {/* Toast Alert */}
      <div className="nudge-toast-pill animate-pop-in">
        <span className="nudge-toast-avatar">{activeNudge.emoji || '💓'}</span>
        <div className="nudge-toast-body">
          <span className="nudge-toast-title">
            {activeNudge.fromUserName || 'Your friend'} sent you love!
          </span>
          <span className="nudge-toast-sub">Thinking of you right now 🌸</span>
        </div>
      </div>

      {/* Floating Animated Hearts */}
      <div className="floating-hearts-container">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="floating-heart-item"
            style={{
              left: h.left,
              animationDelay: h.delay,
              '--x-shift': h.xShift,
              '--rot': h.rot,
              fontSize: `${h.size}px`
            }}
          >
            {activeNudge.emoji || '💓'}
          </div>
        ))}
      </div>
    </div>
  );
}
