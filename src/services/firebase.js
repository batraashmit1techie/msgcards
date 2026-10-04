import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  update,
  remove,
  serverTimestamp,
  onDisconnect
} from 'firebase/database';

const LOCAL_STORAGE_CONFIG_KEY = 'duoday_firebase_config';
const LOCAL_STORAGE_DATA_KEY = 'duoday_offline_data_';

let firebaseApp = null;
let realtimeDb = null;
let isConfiguredCache = null;

// Cross-tab broadcast channel for local multi-tab sync when Firebase is not yet configured
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('duoday_sync_channel');
  }
} catch {
  // Ignore
}

/**
 * Retrieve Firebase credentials from localStorage or Vite environment variables
 */
export function getFirebaseConfig() {
  if (typeof window === 'undefined') return null;

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.apiKey && (parsed.databaseURL || parsed.projectId)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading stored Firebase config', err);
  }

  // Fallback to Vite environment variables
  const env = import.meta.env;
  if (env && env.VITE_FIREBASE_API_KEY && (env.VITE_FIREBASE_DATABASE_URL || env.VITE_FIREBASE_PROJECT_ID)) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      databaseURL: env.VITE_FIREBASE_DATABASE_URL || `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || ''
    };
  }

  return null;
}

/**
 * Save Firebase config to localStorage and reinitialize
 */
export function saveFirebaseConfig(config) {
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  }
  isConfiguredCache = null;
  firebaseApp = null;
  realtimeDb = null;
  initFirebase();
}

/**
 * Check if a valid Firebase Realtime Database config is available
 */
export function isFirebaseConfigured() {
  if (isConfiguredCache !== null) return isConfiguredCache;
  const config = getFirebaseConfig();
  isConfiguredCache = Boolean(config && config.apiKey && (config.databaseURL || config.projectId));
  return isConfiguredCache;
}

/**
 * Initialize or retrieve Firebase Realtime Database
 */
export function initFirebase() {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!firebaseApp) {
      const currentApps = getApps();
      if (currentApps.length > 0) {
        firebaseApp = currentApps[0];
      } else {
        firebaseApp = initializeApp(config);
      }
    }
    if (!realtimeDb && firebaseApp) {
      // Ensure databaseURL is present
      const dbUrl = config.databaseURL || `https://${config.projectId}-default-rtdb.firebaseio.com`;
      realtimeDb = getDatabase(firebaseApp, dbUrl);
    }
    return realtimeDb;
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    return null;
  }
}

// Ensure init is attempted on load
if (typeof window !== 'undefined') {
  initFirebase();
}

/**
 * Offline / Fallback Local Storage Data Manager
 */
function getLocalRoomData(roomId) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DATA_KEY + roomId);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Local data read error', err);
  }

  // Initial cozy default state for new rooms
  const now = Date.now();
  return {
    metadata: {
      createdAt: now,
      name: 'Our Cozy Space',
    },
    users: {
      user1: {
        name: 'Alex',
        avatar: '🌸',
        color: '#FF7E67',
        moodEmoji: '✨',
        moodLabel: 'Feeling inspired & happy',
        isOnline: true,
        lastActive: now,
      },
      user2: {
        name: 'Maya',
        avatar: '🍓',
        color: '#9C6ADE',
        moodEmoji: '☕',
        moodLabel: 'Cozy morning coffee vibe',
        isOnline: false,
        lastActive: now - 1000 * 60 * 18,
      }
    },
    cards: {
      card_demo_1: {
        id: 'card_demo_1',
        author: 'user2',
        authorName: 'Maya',
        authorAvatar: '🍓',
        type: 'vibe',
        content: 'Good morning! Sitting with iced matcha and listening to the rain outside. Hope you have the sweetest day today! ☁️🍵',
        moodEmoji: '☕',
        moodLabel: 'Cozy & relaxed',
        location: 'Cozy corner cafe',
        timestamp: now - 1000 * 60 * 45,
        dateStr: new Date(now).toISOString().slice(0, 10),
        reactions: {
          '❤️': { user1: true },
          '✨': { user2: true }
        },
        comments: {
          c1: { authorName: 'Alex', text: 'Love this for you! Order a croissant for me too 🥐', timestamp: now - 1000 * 60 * 30 }
        }
      },
      card_demo_2: {
        id: 'card_demo_2',
        author: 'user1',
        authorName: 'Alex',
        authorAvatar: '🌸',
        type: 'highlight',
        content: 'Just finished my morning sprint! Ready to conquer the rest of today 💪',
        moodEmoji: '✨',
        moodLabel: 'On a roll',
        location: 'Desk sanctuary',
        timestamp: now - 1000 * 60 * 12,
        dateStr: new Date(now).toISOString().slice(0, 10),
        reactions: {
          '🔥': { user2: true }
        }
      }
    },
    prompts: {},
    nudge: null
  };
}

function saveLocalRoomData(roomId, data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_DATA_KEY + roomId, JSON.stringify(data));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'DUODAY_UPDATE', roomId, data });
    }
  } catch (err) {
    console.error('Local data write error', err);
  }
}

/**
 * Subscribe to real-time updates for a specific room.
 * Returns an unsubscribe callback.
 */
export function subscribeToRoom(roomId, onUpdate) {
  const db = initFirebase();

  if (db) {
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          onUpdate(val);
        } else {
          // If room doesn't exist yet, initialize it
          const initial = getLocalRoomData(roomId);
          set(roomRef, initial);
          onUpdate(initial);
        }
      },
      (error) => {
        console.warn('Realtime Database listen error, falling back to local sync:', error);
        // Fallback to local
        const data = getLocalRoomData(roomId);
        onUpdate(data);
      }
    );

    return () => unsubscribe();
  }

  // BroadcastChannel fallback when Firebase is not configured
  const currentData = getLocalRoomData(roomId);
  onUpdate(currentData);

  const handleBroadcast = (event) => {
    if (event.data && event.data.type === 'DUODAY_UPDATE' && event.data.roomId === roomId) {
      onUpdate(event.data.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (e) => {
    if (e.key === LOCAL_STORAGE_DATA_KEY + roomId && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Post a new update card
 */
export async function postCard(roomId, cardData) {
  const db = initFirebase();
  const cardId = 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const cardWithId = { ...cardData, id: cardId };

  if (db) {
    const cardRef = ref(db, `rooms/${roomId}/cards/${cardId}`);
    await set(cardRef, cardWithId);
    return cardWithId;
  }

  // Local fallback
  const data = getLocalRoomData(roomId);
  if (!data.cards) data.cards = {};
  data.cards[cardId] = cardWithId;
  saveLocalRoomData(roomId, data);
  return cardWithId;
}

/**
 * Delete a card
 */
export async function deleteCard(roomId, cardId) {
  const db = initFirebase();
  if (db) {
    const cardRef = ref(db, `rooms/${roomId}/cards/${cardId}`);
    await remove(cardRef);
    return;
  }

  const data = getLocalRoomData(roomId);
  if (data.cards && data.cards[cardId]) {
    delete data.cards[cardId];
    saveLocalRoomData(roomId, data);
  }
}

/**
 * Toggle emoji reaction on a card
 */
export async function toggleReaction(roomId, cardId, emoji, userKey) {
  const db = initFirebase();
  if (db) {
    const reactionUserRef = ref(db, `rooms/${roomId}/cards/${cardId}/reactions/${emoji}/${userKey}`);
    // Check if exists
    onValue(
      reactionUserRef,
      (snapshot) => {
        if (snapshot.exists()) {
          remove(reactionUserRef);
        } else {
          set(reactionUserRef, true);
        }
      },
      { onlyOnce: true }
    );
    return;
  }

  // Local fallback
  const data = getLocalRoomData(roomId);
  if (data.cards && data.cards[cardId]) {
    const card = data.cards[cardId];
    if (!card.reactions) card.reactions = {};
    if (!card.reactions[emoji]) card.reactions[emoji] = {};

    if (card.reactions[emoji][userKey]) {
      delete card.reactions[emoji][userKey];
      if (Object.keys(card.reactions[emoji]).length === 0) {
        delete card.reactions[emoji];
      }
    } else {
      card.reactions[emoji][userKey] = true;
    }
    saveLocalRoomData(roomId, data);
  }
}

/**
 * Add a comment / mini note to a card
 */
export async function addComment(roomId, cardId, comment) {
  const db = initFirebase();
  const commentId = 'c_' + Date.now();
  const commentObj = { ...comment, id: commentId, timestamp: Date.now() };

  if (db) {
    const commentRef = ref(db, `rooms/${roomId}/cards/${cardId}/comments/${commentId}`);
    await set(commentRef, commentObj);
    return commentObj;
  }

  const data = getLocalRoomData(roomId);
  if (data.cards && data.cards[cardId]) {
    if (!data.cards[cardId].comments) data.cards[cardId].comments = {};
    data.cards[cardId].comments[commentId] = commentObj;
    saveLocalRoomData(roomId, data);
  }
  return commentObj;
}

/**
 * Update user mood & vibe
 */
export async function updateUserMood(roomId, userKey, moodEmoji, moodLabel) {
  const db = initFirebase();
  const updates = {
    moodEmoji,
    moodLabel,
    lastActive: Date.now()
  };

  if (db) {
    const userRef = ref(db, `rooms/${roomId}/users/${userKey}`);
    await update(userRef, updates);
    return;
  }

  const data = getLocalRoomData(roomId);
  if (data.users && data.users[userKey]) {
    data.users[userKey] = { ...data.users[userKey], ...updates };
    saveLocalRoomData(roomId, data);
  }
}

/**
 * Update user profile details (name, avatar, accent color)
 */
export async function updateUserProfile(roomId, userKey, profileData) {
  const db = initFirebase();
  if (db) {
    const userRef = ref(db, `rooms/${roomId}/users/${userKey}`);
    await update(userRef, profileData);
    return;
  }

  const data = getLocalRoomData(roomId);
  if (data.users && data.users[userKey]) {
    data.users[userKey] = { ...data.users[userKey], ...profileData };
    saveLocalRoomData(roomId, data);
  }
}

/**
 * Send an animated nudge / heart ping to partner
 */
export async function sendNudge(roomId, fromUserKey, fromUserName, emoji = '💓') {
  const db = initFirebase();
  const nudgeData = {
    fromUserKey,
    fromUserName,
    emoji,
    timestamp: Date.now(),
    id: 'nudge_' + Date.now()
  };

  if (db) {
    const nudgeRef = ref(db, `rooms/${roomId}/nudge`);
    await set(nudgeRef, nudgeData);
    return;
  }

  const data = getLocalRoomData(roomId);
  data.nudge = nudgeData;
  saveLocalRoomData(roomId, data);
}

/**
 * Answer daily prompt question
 */
export async function answerDailyPrompt(roomId, dateStr, userKey, answerText) {
  const db = initFirebase();
  const answerData = {
    text: answerText,
    timestamp: Date.now()
  };

  if (db) {
    const answerRef = ref(db, `rooms/${roomId}/prompts/${dateStr}/answers/${userKey}`);
    await set(answerRef, answerData);
    return;
  }

  const data = getLocalRoomData(roomId);
  if (!data.prompts) data.prompts = {};
  if (!data.prompts[dateStr]) data.prompts[dateStr] = { answers: {} };
  if (!data.prompts[dateStr].answers) data.prompts[dateStr].answers = {};
  data.prompts[dateStr].answers[userKey] = answerData;
  saveLocalRoomData(roomId, data);
}

/**
 * Set user presence status
 */
export async function updatePresence(roomId, userKey, isOnline) {
  const db = initFirebase();
  const updates = {
    isOnline,
    lastActive: Date.now()
  };

  if (db) {
    const userRef = ref(db, `rooms/${roomId}/users/${userKey}`);
    await update(userRef, updates);

    // Setup onDisconnect hook so when tab closes, user is marked offline
    if (isOnline) {
      const onlineRef = ref(db, `rooms/${roomId}/users/${userKey}/isOnline`);
      onDisconnect(onlineRef).set(false);
      const lastActiveRef = ref(db, `rooms/${roomId}/users/${userKey}/lastActive`);
      onDisconnect(lastActiveRef).set(Date.now());
    }
    return;
  }

  const data = getLocalRoomData(roomId);
  if (data.users && data.users[userKey]) {
    data.users[userKey].isOnline = isOnline;
    data.users[userKey].lastActive = Date.now();
    saveLocalRoomData(roomId, data);
  }
}
