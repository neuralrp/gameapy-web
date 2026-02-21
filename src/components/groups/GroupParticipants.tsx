import { useApp } from '../../contexts/AppContext';

export function GroupParticipants() {
  const { groupSessionState, leaveGroupSession } = useApp();
  const { host, guest, isHost, groupSession } = groupSessionState;

  if (!groupSession) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#F8F0D8]/80 rounded-full text-sm">
      <div className="flex items-center gap-1">
        <span 
          className={`w-2 h-2 rounded-full ${isHost ? 'bg-green-500' : 'bg-blue-500'}`}
          title={isHost ? 'You (Host)' : 'Host'}
        />
        <span className="text-[#483018] font-medium">
          {isHost ? 'You' : host?.name || 'Host'}
        </span>
      </div>
      
      {guest && (
        <>
          <span className="text-[#483018]/50">&</span>
          <div className="flex items-center gap-1">
            <span 
              className={`w-2 h-2 rounded-full ${!isHost ? 'bg-green-500' : 'bg-blue-500'}`}
              title={!isHost ? 'You (Guest)' : 'Guest'}
            />
            <span className="text-[#483018] font-medium">
              {!isHost ? 'You' : guest.name}
            </span>
          </div>
        </>
      )}
      
      {!guest && (
        <span className="text-[#483018]/50 italic ml-1">waiting...</span>
      )}

      <button
        onClick={() => leaveGroupSession()}
        className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
      >
        Leave
      </button>
    </div>
  );
}
