import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Friend {
  id: number;
  username: string;
  name: string;
  friends_since: string;
}

interface PendingRequest {
  id: number;
  requester_id: number;
  username: string;
  name: string;
  created_at: string;
}

interface TradeModalProps {
  friend: Friend;
  onClose: () => void;
  onSend: (cardType: string, cardId: number, message: string) => void;
}

const TradeModal: React.FC<TradeModalProps> = ({ friend, onClose, onSend }) => {
  const [cardType, setCardType] = useState('self');
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!cardId) return;
    setLoading(true);
    try {
      await onSend(cardType, parseInt(cardId), message);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Share Card with {friend.name || friend.username}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Card Type</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
            >
              <option value="self">Self Card</option>
              <option value="character">Character Card</option>
              <option value="world">World Event</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Card ID</label>
            <input
              type="number"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="Enter card ID..."
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white resize-none"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !cardId}
            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Share Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const FriendsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tradeFriend, setTradeFriend] = useState<Friend | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        apiService.getFriends(),
        apiService.getPendingFriendRequests(),
      ]);
      setFriends(friendsRes.data || []);
      setPendingRequests(pendingRes.data || []);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    }
  };

  const handleSendRequest = async () => {
    if (!newFriendUsername.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiService.sendFriendRequest(newFriendUsername.trim());
      if (res.success) {
        setSuccess('Friend request sent!');
        setNewFriendUsername('');
        loadData();
      } else {
        setError(res.message || 'Failed to send request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId: number) => {
    try {
      await apiService.acceptFriendRequest(requesterId);
      setSuccess('Friend request accepted!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requesterId: number) => {
    try {
      await apiService.declineFriendRequest(requesterId);
      setSuccess('Friend request declined');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to decline request');
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await apiService.removeFriend(friendId);
      setSuccess('Friend removed');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove friend');
    }
  };

  const handleSendTrade = async (cardType: string, cardId: number, message: string) => {
    if (!tradeFriend) return;
    try {
      const res = await apiService.sendTradeRequest({
        receiver_username: tradeFriend.username,
        card_type: cardType,
        card_id: cardId,
        message: message || undefined,
      });
      if (res.success) {
        setSuccess('Card share request sent!');
      } else {
        setError(res.message || 'Failed to send share request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send share request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
              placeholder="Enter username..."
              className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              Add Friend
            </button>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Pending Requests ({pendingRequests.length})</h2>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{req.name || req.username}</span>
                    {req.name && <span className="text-gray-500 ml-2">@{req.username}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.requester_id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.requester_id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Your Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No friends yet. Add someone to start sharing cards!</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{friend.name || friend.username}</span>
                    {friend.name && <span className="text-gray-500 ml-2">@{friend.username}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTradeFriend(friend)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded text-sm transition-colors"
                    >
                      Share Card
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="px-3 py-1 bg-gray-700 hover:bg-red-600 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {tradeFriend && (
        <TradeModal
          friend={tradeFriend}
          onClose={() => setTradeFriend(null)}
          onSend={handleSendTrade}
        />
      )}
    </div>
  );
};
