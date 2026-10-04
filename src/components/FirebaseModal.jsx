import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { getFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured } from '../services/firebase';

export function FirebaseModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getFirebaseConfig() || {};

  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [databaseURL, setDatabaseURL] = useState(currentConfig.databaseURL || '');
  const [rawJson, setRawJson] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();

  const handleParseJson = () => {
    try {
      // Find object inside string if copied with const firebaseConfig = { ... }
      let clean = rawJson.trim();
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
        // Replace unquoted keys if necessary
        const parsed = Function('"use strict";return (' + clean + ')')();
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.databaseURL) setDatabaseURL(parsed.databaseURL);
        else if (parsed.projectId) {
          setDatabaseURL(`https://${parsed.projectId}-default-rtdb.firebaseio.com`);
        }
        setFeedback({ type: 'success', message: 'Config parsed successfully!' });
        setShowJsonInput(false);
      } else {
        setFeedback({ type: 'error', message: 'Could not find JSON object in pasted text.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Invalid JSON format. Please fill fields manually.' });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setFeedback({ type: 'error', message: 'Please enter API Key and Project ID.' });
      return;
    }

    const calculatedDbUrl = databaseURL.trim() || `https://${projectId.trim()}-default-rtdb.firebaseio.com`;

    const config = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      databaseURL: calculatedDbUrl,
      authDomain: `${projectId.trim()}.firebaseapp.com`
    };

    saveFirebaseConfig(config);
    setFeedback({ type: 'success', message: 'Firebase connected! Syncing live across all phones.' });
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetToLocal = () => {
    if (window.confirm('Reset to local test sync mode?')) {
      saveFirebaseConfig(null);
      setApiKey('');
      setProjectId('');
      setDatabaseURL('');
      setFeedback({ type: 'info', message: 'Reverted to local broadcast mode.' });
      if (onConfigSaved) onConfigSaved();
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="firebase-modal-box animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-group">
            <span className="modal-icon-badge">☁️</span>
            <h3 className="modal-title">Live Phone Sync Setup</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Current status banner */}
        <div className={`status-banner ${isConfigured ? 'status-connected' : 'status-local'}`}>
          <div className="status-banner-icon">
            {isConfigured ? <CheckCircle2 size={20} color="#48BB78" /> : <AlertCircle size={20} color="#E53E3E" />}
          </div>
          <div className="status-banner-content">
            <h5 className="status-title">
              {isConfigured ? 'Connected to Firebase Realtime Database' : 'Currently in Local Test Sync Mode'}
            </h5>
            <p className="status-desc">
              {isConfigured
                ? 'Your updates are syncing in real-time between your phone and your friend\'s phone anywhere in the world!'
                : 'Connect your free Firebase Realtime Database so when either of you posts on your phone, it instantly reflects on the other phone.'}
            </p>
          </div>
        </div>

        {/* Step-by-step guide card */}
        <div className="setup-guide-card">
          <h5 className="guide-title">
            <Sparkles size={15} color="#FF684D" /> How to get free Firebase sync (takes 2 mins):
          </h5>
          <ol className="guide-steps-list">
            <li>
              Open{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="guide-link"
              >
                Firebase Console <ExternalLink size={12} />
              </a>{' '}
              and click <strong>Add Project</strong> (100% free).
            </li>
            <li>
              Go to <strong>Build</strong> ➔ <strong>Realtime Database</strong> ➔ click <strong>Create Database</strong>. Choose "Start in test mode".
            </li>
            <li>
              Click Project Settings (gear icon at top left) ➔ scroll to "Your apps" ➔ click <strong>&lt;/&gt; (Web)</strong> ➔ copy your config!
            </li>
          </ol>
        </div>

        {/* Quick paste toggle */}
        <div className="json-paste-toggle-row">
          <button
            type="button"
            className="toggle-link-btn"
            onClick={() => setShowJsonInput(!showJsonInput)}
          >
            {showJsonInput ? 'Hide JSON paste' : '⚡ Have full config snippet? Paste JSON here'}
          </button>
        </div>

        {showJsonInput && (
          <div className="json-paste-box animate-pop-in">
            <textarea
              className="json-textarea"
              placeholder='Paste firebaseConfig = { apiKey: "...", projectId: "...", ... }'
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={3}
            />
            <button type="button" className="btn-parse-json" onClick={handleParseJson}>
              Extract Fields
            </button>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSave} className="firebase-form">
          <div className="input-group">
            <label className="form-field-label">API Key</label>
            <input
              type="text"
              className="form-input"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="form-field-label">Project ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="my-duo-app-123"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="form-field-label">Realtime Database URL (optional if standard)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://my-duo-app-123-default-rtdb.firebaseio.com"
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
            />
          </div>

          {feedback && (
            <div className={`feedback-alert ${feedback.type}`}>
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="modal-buttons-row">
            {isConfigured && (
              <button
                type="button"
                className="btn-reset-mode"
                onClick={handleResetToLocal}
                title="Disconnect Firebase"
              >
                <RotateCcw size={14} />
                <span>Disconnect</span>
              </button>
            )}
            <button type="submit" className="btn-save-firebase">
              <Save size={15} />
              <span>Save & Connect Live</span>
            </button>
          </div>
        </form>

        {/* Vercel Tip */}
        <div className="vercel-hint-box">
          <span className="hint-label">Tip for Vercel Deployment:</span>
          <p className="hint-text">
            You can also add these in your Vercel Project Settings ➔ <strong>Environment Variables</strong>:
            <br />
            <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_PROJECT_ID</code>, <code>VITE_FIREBASE_DATABASE_URL</code>
          </p>
        </div>
      </div>
    </div>
  );
}
