import { Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { CounselorSelection } from './screens/CounselorSelection';
import { ChatScreen } from './screens/ChatScreen';
import { GuideScreen } from './screens/GuideScreen';
import { CardInventoryModal } from './screens/CardInventoryModal';
import { RecoveryScreen } from './screens/RecoveryScreen';
import { RecoveryCodeModal } from './components/shared/RecoveryCodeModal';
import { Toast } from './components/shared/Toast';

function AppContent() {
  const { 
    counselor, 
    showInventory, 
    setShowInventory, 
    showInventoryFullScreen, 
    setShowInventoryFullScreen, 
    showGuide, 
    toast,
    recoveryCode,
    setRecoveryCode,
    showRecoveryCodeModal,
    setShowRecoveryCodeModal
  } = useApp();

  return (
    <>
      <Routes>
        <Route path="/recover" element={<RecoveryScreen />} />
        <Route path="/*" element={
          showInventoryFullScreen ? (
            <CardInventoryModal
              isFullScreen={true}
              onClose={() => setShowInventoryFullScreen(false)}
            />
          ) : showGuide ? (
            <GuideScreen />
          ) : counselor ? (
            <ChatScreen />
          ) : (
            <CounselorSelection />
          )
        } />
      </Routes>
      {showInventory && <CardInventoryModal onClose={() => setShowInventory(false)} />}
      {showRecoveryCodeModal && recoveryCode && (
        <RecoveryCodeModal
          recoveryCode={recoveryCode}
          onClose={() => setShowRecoveryCodeModal(false)}
          onRegenerate={() => {
            // Regenerate will update the recoveryCode state via AppContext
            setRecoveryCode(null);
            setShowRecoveryCodeModal(false);
          }}
        />
      )}
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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
