import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services/api';

interface GroupJoinModalProps {
  inviteCode: string;
  onJoined: () => void;
  onCancelled: () => void;
}

export function GroupJoinModal({ inviteCode, onJoined, onCancelled }: GroupJoinModalProps) {
  const { joinGroupSession, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [info, setInfo] = useState<{
    hostName: string | null;
    counselorName: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await apiService.getGroupInviteInfo(inviteCode);
        if (response.success && response.data) {
          setInfo({
            hostName: response.data.host?.name || null,
            counselorName: response.data.counselor?.name || null,
          });
        } else {
          setError('Invalid or expired invite');
        }
      } catch (err) {
        setError('Failed to load invite info');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfo();
  }, [inviteCode]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const success = await joinGroupSession(inviteCode);
      if (success) {
        showToast({ message: 'Joined group session!', type: 'success' });
        onJoined();
      } else {
        setError('Failed to join group session');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#F8F0D8] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <p className="text-[#483018] text-center">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#F8F0D8] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-[#483018] mb-4">{error}</p>
          <button
            onClick={onCancelled}
            className="w-full px-4 py-2 rounded-lg bg-[#306850] text-white font-bold hover:bg-[#264038]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#F8F0D8] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-[#483018] mb-4">
          Join Group Chat
        </h2>
        
        <p className="text-[#483018] mb-4">
          {info?.hostName ? (
            <>
              <strong>{info.hostName}</strong> has invited you to a group chat
              {info.counselorName && <> with <strong>{info.counselorName}</strong></>}.
            </>
          ) : (
            'You have been invited to join a group chat.'
          )}
        </p>
        
        <p className="text-sm text-[#483018]/70 mb-6">
          In a group chat, both you and your friend can play cards to the shared 
          table and chat with the AI together.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancelled}
            className="flex-1 px-4 py-2 rounded-lg border-2 border-[#D8D0B8] text-[#483018] hover:bg-[#E8E0C8]"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex-1 px-4 py-2 rounded-lg bg-[#88C070] text-[#483018] font-bold hover:bg-[#78B060] disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
