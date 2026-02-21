import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { SpeechSynthesisProvider } from './contexts/SpeechSynthesisContext';
import { MainScreen } from './screens/MainScreen';
import { ChatScreen } from './screens/ChatScreen';
import { CardInventoryModal } from './screens/CardInventoryModal';
import { AdvisorCreatorScreen } from './screens/AdvisorCreatorScreen';
import { LoginScreen } from './screens/LoginScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { GroupJoinModal } from './components/groups';
import { Toast } from './components/shared/Toast';

function AppContent() {
  const { 
    counselor, 
    showInventory, 
    setShowInventory, 
    showInventoryFullScreen, 
    setShowInventoryFullScreen, 
    toast,
    isAuthenticated,
    authLoading
  } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <div className="text-[#3D3426] font-retro text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/create-advisor" element={<AdvisorCreatorScreen />} />
        <Route path="/friends" element={<FriendsScreen onBack={() => window.history.back()} />} />
        <Route path="/join/:inviteCode" element={<JoinGroupRoute />} />
        <Route path="/*" element={
          showInventoryFullScreen ? (
            <CardInventoryModal
              isFullScreen={true}
              onClose={() => setShowInventoryFullScreen(false)}
            />
          ) : counselor ? (
            <ChatScreen />
          ) : (
            <MainScreen />
          )
        } />
      </Routes>
      {showInventory && <CardInventoryModal onClose={() => setShowInventory(false)} />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          show={true}
        />
      )}
    </>
  );
}

function JoinGroupRoute() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const handleJoined = () => {
    showToast({ message: 'Joined group chat!', type: 'success' });
    navigate('/');
  };

  const handleCancelled = () => {
    navigate('/');
  };

  if (!inviteCode) {
    return <Navigate to="/" replace />;
  }

  return (
    <GroupJoinModal
      inviteCode={inviteCode}
      onJoined={handleJoined}
      onCancelled={handleCancelled}
    />
  );
}

function App() {
  return (
    <AppProvider>
      <SpeechSynthesisProvider>
        <AppContent />
      </SpeechSynthesisProvider>
    </AppProvider>
  );
}

export default App;
