import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services/api';

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: number;
  friendName: string;
  counselorId: number;
}

export function GroupInviteModal({
  isOpen,
  onClose,
  friendId,
  friendName,
  counselorId,
}: GroupInviteModalProps) {
  const { createGroupSession, showToast, groupSessionState } = useApp();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guestJoined, setGuestJoined] = useState(false);
  
  const groupId = groupSessionState.groupSession?.id ?? null;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!groupId || guestJoined) return;
    
    abortControllerRef.current = new AbortController();
    
    const checkGuestJoined = async () => {
      if (abortControllerRef.current?.signal.aborted) return;
      
      try {
        const response = await apiService.getGroupSession(groupId);
        if (abortControllerRef.current?.signal.aborted) return;
        
        if (response.success && response.data?.group_session?.status === 'active') {
          setGuestJoined(true);
          showToast({ message: `${friendName} joined the group!`, type: 'success' });
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Failed to check group status:', error);
        }
      }
    };
    
    const interval = setInterval(checkGuestJoined, 2000);
    
    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [groupId, guestJoined, friendName, showToast]);

  useEffect(() => {
    if (!isOpen) {
      setInviteCode(null);
      setGuestJoined(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateGroup = async () => {
    setIsCreating(true);
    try {
      const code = await createGroupSession(friendId, counselorId);
      if (code) {
        setInviteCode(code);
        showToast({ message: 'Group session created!', type: 'success' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = inviteCode 
    ? `${window.location.origin}/join/${inviteCode}`
    : '';

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      showToast({ message: 'Link copied!', type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#F8F0D8] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-[#483018] mb-4">
          Invite {friendName} to Group Chat
        </h2>

        {!inviteCode ? (
          <>
            <p className="text-[#483018] mb-4">
              Start a shared conversation where you and {friendName} can both play cards 
              and chat with the AI together.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-[#D8D0B8] text-[#483018] hover:bg-[#E8E0C8]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="flex-1 px-4 py-2 rounded-lg bg-[#88C070] text-[#483018] font-bold hover:bg-[#78B060] disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </>
        ) : (
          <>
            {guestJoined ? (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-[#483018] font-bold text-lg">
                    {friendName} joined!
                  </p>
                  <p className="text-[#483018]/70 text-sm">
                    Close this dialog to start chatting.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 rounded-lg bg-[#306850] text-white font-bold hover:bg-[#264038]"
                >
                  Start Chatting
                </button>
              </>
            ) : (
              <>
                <p className="text-[#483018] mb-4">
                  Share this invite code or link with {friendName}:
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm text-[#483018] mb-1">Invite Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteCode}
                      readOnly
                      className="flex-1 px-3 py-2 rounded border-2 border-[#D8D0B8] bg-white text-[#483018] font-mono text-lg"
                    />
                    <button
                      onClick={handleCopyCode}
                      className="px-4 py-2 rounded bg-[#88C070] text-[#483018] font-bold hover:bg-[#78B060]"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-[#483018] mb-1">Or Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 rounded border-2 border-[#D8D0B8] bg-white text-[#483018] text-sm truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded bg-[#88C070] text-[#483018] font-bold hover:bg-[#78B060]"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#483018]/70 mb-4">
                  Waiting for {friendName} to join...
                </p>

                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 rounded-lg bg-[#306850] text-white font-bold hover:bg-[#264038]"
                >
                  Done
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
