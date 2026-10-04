import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, Lock, Sparkles, MessageCircleHeart } from 'lucide-react';
import { getTodayPrompt } from '../utils/prompts';
import confetti from 'canvas-confetti';

export function DailyPromptCard({
  roomId,
  dateStr,
  promptData,
  currentUserKey,
  currentUser,
  partnerUser,
  partnerUserKey,
  onAnswerPrompt
}) {
  const [answerInput, setAnswerInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const question = getTodayPrompt(dateStr);
  const answers = promptData?.answers || {};
  const myAnswer = answers[currentUserKey];
  const partnerAnswer = answers[partnerUserKey];

  const hasMyAnswer = Boolean(myAnswer?.text);
  const hasPartnerAnswer = Boolean(partnerAnswer?.text);
  const bothAnswered = hasMyAnswer && hasPartnerAnswer;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    onAnswerPrompt(dateStr, currentUserKey, answerInput.trim());
    setAnswerInput('');
    setIsEditing(false);

    try {
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { y: 0.3 }
      });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="daily-prompt-card">
      <div className="prompt-header-row">
        <div className="prompt-tag-badge">
          <MessageCircleHeart size={14} className="prompt-sparkle-icon" />
          <span>Today's Question for Us</span>
        </div>
        <span className="prompt-date-text">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <h3 className="prompt-question-text">{question}</h3>

      {/* Answers display area */}
      <div className="prompt-answers-grid">
        {/* Current user's card */}
        <div className={`answer-box my-answer ${hasMyAnswer ? 'answered' : 'empty'}`}>
          <div className="answer-box-header">
            <span className="answer-user-badge">
              <span className="avatar-mini">{currentUser?.avatar || '🌸'}</span>
              <span className="user-name">{currentUser?.name || 'You'}</span>
            </span>
            {hasMyAnswer && (
              <button
                className="edit-answer-link"
                onClick={() => {
                  setAnswerInput(myAnswer.text);
                  setIsEditing(true);
                }}
              >
                Edit
              </button>
            )}
          </div>

          {hasMyAnswer && !isEditing ? (
            <p className="answer-content-text">"{myAnswer.text}"</p>
          ) : (
            <form onSubmit={handleSubmit} className="answer-input-form">
              <textarea
                className="prompt-textarea"
                placeholder={`Your answer to "${question.slice(0, 30)}..."`}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                rows={2}
                maxLength={200}
              />
              <div className="answer-btn-row">
                {isEditing && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="submit-answer-btn"
                  disabled={!answerInput.trim()}
                >
                  <Send size={13} />
                  <span>{hasMyAnswer ? 'Update' : 'Post Answer'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Partner's card */}
        <div className={`answer-box partner-answer ${hasPartnerAnswer ? 'answered' : 'empty'}`}>
          <div className="answer-box-header">
            <span className="answer-user-badge">
              <span className="avatar-mini">{partnerUser?.avatar || '🍓'}</span>
              <span className="user-name">{partnerUser?.name || 'Friend'}</span>
            </span>
            {hasPartnerAnswer && <CheckCircle2 size={15} color="#48BB78" />}
          </div>

          {hasPartnerAnswer ? (
            hasMyAnswer ? (
              <p className="answer-content-text">"{partnerAnswer.text}"</p>
            ) : (
              <div className="blurred-mystery-box">
                <Lock size={18} className="lock-icon" />
                <p className="mystery-text">
                  {partnerUser?.name || 'Friend'} has answered! Answer above to reveal their secret 💌
                </p>
              </div>
            )
          ) : (
            <div className="waiting-placeholder">
              <span className="waiting-dot" />
              <p className="waiting-text">
                Waiting for {partnerUser?.name || 'friend'} to answer today...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
