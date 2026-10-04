import React, { useState } from 'react';
import { UpdateCard } from './UpdateCard';
import { Sparkles, Calendar, Heart, Plus } from 'lucide-react';

export function CardFeed({
  cards,
  currentUserKey,
  partnerUser,
  onToggleReaction,
  onAddComment,
  onDeleteCard,
  onOpenCreateModal
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today' | 'mine' | 'theirs'

  const todayStr = new Date().toISOString().slice(0, 10);

  // Convert cards dictionary to array and sort newest first
  const cardList = Object.values(cards || {}).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const filteredCards = cardList.filter((card) => {
    if (activeTab === 'today') {
      const cardDate = new Date(card.timestamp || Date.now()).toISOString().slice(0, 10);
      return cardDate === todayStr;
    }
    if (activeTab === 'mine') {
      return card.author === currentUserKey;
    }
    if (activeTab === 'theirs') {
      return card.author !== currentUserKey;
    }
    return true;
  });

  return (
    <section className="feed-container">
      {/* Feed Filter Tabs */}
      <div className="feed-tabs-bar">
        <button
          className={`feed-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Moments ({cardList.length})
        </button>
        <button
          className={`feed-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button
          className={`feed-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          Mine
        </button>
        <button
          className={`feed-tab-btn ${activeTab === 'theirs' ? 'active' : ''}`}
          onClick={() => setActiveTab('theirs')}
        >
          {partnerUser?.name || 'Friend'}'s
        </button>
      </div>

      {/* Cards list */}
      <div className="cards-stream">
        {filteredCards.length > 0 ? (
          filteredCards.map((card) => (
            <UpdateCard
              key={card.id}
              card={card}
              currentUserKey={currentUserKey}
              onToggleReaction={onToggleReaction}
              onAddComment={onAddComment}
              onDeleteCard={onDeleteCard}
            />
          ))
        ) : (
          <div className="empty-feed-card animate-fade-in">
            <div className="empty-art-icon">💌</div>
            <h4 className="empty-title">
              {activeTab === 'today'
                ? "No updates yet today"
                : activeTab === 'mine'
                ? "You haven't posted any cards yet"
                : activeTab === 'theirs'
                ? `Waiting for ${partnerUser?.name || 'your friend'} to post`
                : "No cards posted yet"}
            </h4>
            <p className="empty-subtext">
              Share a photo, highlight, or cozy thought from your day to reflect instantly on both your screens!
            </p>
            <button className="empty-create-btn" onClick={onOpenCreateModal}>
              <Plus size={16} />
              <span>Share an Update</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
