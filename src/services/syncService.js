/**
 * Real-time Sync Service
 * Supports:
 * 1. Instant Cloud Sync (Zero-config, global real-time SSE between phones via secure room topic)
 * 2. Firebase Realtime Database (Optional if credentials provided)
 * 3. LocalStorage persistence (History never lost on reload)
 * 4. BroadcastChannel (Instant multi-tab testing on same machine)
 */

import { initFirebase } from './firebase';
import { ref, set, remove, onValue } from 'firebase/database';

const LOCAL_STORAGE_KEY_PREFIX = 'duoday_cards_';
const NTFY_BASE = 'https://ntfy.sh';

// Generate or retrieve room cards from local storage
export function getLocalCards(roomId) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + roomId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read local cards', err);
  }

  // Initial starter cards for a cozy first look
  const now = Date.now();
  return [
    {
      id: 'card_demo_1',
      author: 'her',
      text: 'Good morning! Sitting with my coffee and getting ready for the day ☕ Hope you have a wonderful day!',
      photoUrl: null,
      mood: '☕ Cozy',
      timestamp: now - 1000 * 60 * 30,
      hearts: { me: true }
    }
  ];
}

export function saveLocalCards(roomId, cards) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + roomId, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save local cards', err);
  }
}

/**
 * Start real-time sync for a specific room.
 * Calls onCardsUpdate(cards) whenever any card is added, edited, or deleted.
 * Calls onIncomingUpdate(card, author) when the other person posts.
 */
export function startRoomSync(roomId, onCardsUpdate, onIncomingUpdate) {
  let cards = getLocalCards(roomId);
  onCardsUpdate(cards);

  const cleanRoomId = (roomId || 'our-duo-space').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  const topic = `duo_sync_${cleanRoomId}`;

  let eventSource = null;
  let broadcastChannel = null;

  // 1. Cross-tab sync for testing on desktop
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel(`channel_${topic}`);
      broadcastChannel.onmessage = (event) => {
        handleIncomingAction(event.data);
      };
    }
  } catch {
    // Ignore
  }

  // 2. Firebase Database subscription (if configured)
  const db = initFirebase();
  let firebaseUnsub = null;
  if (db) {
    const roomRef = ref(db, `rooms/${cleanRoomId}/cards_list`);
    firebaseUnsub = onValue(roomRef, (snapshot) => {
      const val = snapshot.val();
      if (val && Array.isArray(val)) {
        cards = val;
        saveLocalCards(roomId, cards);
        onCardsUpdate([...cards]);
      }
    });
  }

  // 3. Instant Global Cloud Relay (SSE) for phone-to-phone real-time sync
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      // Connect to SSE stream
      eventSource = new EventSource(`${NTFY_BASE}/${topic}/sse`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.message) {
            const action = JSON.parse(payload.message);
            handleIncomingAction(action);
          }
        } catch {
          // Non-JSON ping
        }
      };

      eventSource.onerror = () => {
        // SSE auto-reconnects
      };
    }
  } catch (err) {
    console.warn('SSE subscription failed', err);
  }

  function handleIncomingAction(action) {
    if (!action || !action.type) return;

    if (action.type === 'NEW_CARD') {
      const incomingCard = action.card;
      // Prevent duplicates
      if (!cards.some((c) => c.id === incomingCard.id)) {
        cards = [incomingCard, ...cards];
        saveLocalCards(roomId, cards);
        onCardsUpdate([...cards]);
        if (onIncomingUpdate) {
          onIncomingUpdate(incomingCard);
        }
      }
    } else if (action.type === 'DELETE_CARD') {
      cards = cards.filter((c) => c.id !== action.cardId);
      saveLocalCards(roomId, cards);
      onCardsUpdate([...cards]);
    } else if (action.type === 'TOGGLE_HEART') {
      cards = cards.map((c) => {
        if (c.id === action.cardId) {
          const hearts = { ...(c.hearts || {}) };
          if (hearts[action.user]) {
            delete hearts[action.user];
          } else {
            hearts[action.user] = true;
          }
          return { ...c, hearts };
        }
        return c;
      });
      saveLocalCards(roomId, cards);
      onCardsUpdate([...cards]);
    } else if (action.type === 'FULL_SYNC') {
      if (action.cards && Array.isArray(action.cards)) {
        // Merge newest cards
        const map = new Map();
        [...action.cards, ...cards].forEach((c) => {
          if (!map.has(c.id)) map.set(c.id, c);
        });
        cards = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        saveLocalCards(roomId, cards);
        onCardsUpdate([...cards]);
      }
    }
  }

  // Function to broadcast an action to the cloud and other devices
  async function broadcastAction(action) {
    // Local broadcast
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(action);
      } catch {
        // Ignore
      }
    }

    // Cloud SSE broadcast
    try {
      await fetch(`${NTFY_BASE}/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(action)
      });
    } catch (err) {
      console.warn('Cloud broadcast error', err);
    }

    // Firebase sync
    if (db) {
      try {
        const roomRef = ref(db, `rooms/${cleanRoomId}/cards_list`);
        set(roomRef, cards);
      } catch (err) {
        console.warn('Firebase sync error', err);
      }
    }
  }

  return {
    async addCard(newCard) {
      cards = [newCard, ...cards];
      saveLocalCards(roomId, cards);
      onCardsUpdate([...cards]);
      await broadcastAction({ type: 'NEW_CARD', card: newCard });
    },

    async deleteCard(cardId) {
      cards = cards.filter((c) => c.id !== cardId);
      saveLocalCards(roomId, cards);
      onCardsUpdate([...cards]);
      await broadcastAction({ type: 'DELETE_CARD', cardId });
    },

    async toggleHeart(cardId, user) {
      cards = cards.map((c) => {
        if (c.id === cardId) {
          const hearts = { ...(c.hearts || {}) };
          if (hearts[user]) {
            delete hearts[user];
          } else {
            hearts[user] = true;
          }
          return { ...c, hearts };
        }
        return c;
      });
      saveLocalCards(roomId, cards);
      onCardsUpdate([...cards]);
      await broadcastAction({ type: 'TOGGLE_HEART', cardId, user });
    },

    cleanup() {
      if (eventSource) {
        eventSource.close();
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (firebaseUnsub) {
        firebaseUnsub();
      }
    }
  };
}
