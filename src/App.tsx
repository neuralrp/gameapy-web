import { AppProvider, useApp } from './contexts/AppContext';
import { CounselorSelection } from './screens/CounselorSelection';
import { ChatScreen } from './screens/ChatScreen';
import { GuideScreen } from './screens/GuideScreen';
import { CardInventoryModal } from './screens/CardInventoryModal';
import { Toast } from './components/shared/Toast';

function AppContent() {
  const { counselor, showInventory, setShowInventory, showInventoryFullScreen, setShowInventoryFullScreen, showGuide, toast } = useApp();

  return (
    <>
      {showInventoryFullScreen ? (
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
      )}
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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
