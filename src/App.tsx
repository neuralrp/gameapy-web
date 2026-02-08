import { AppProvider, useApp } from './contexts/AppContext';
import { CounselorSelection } from './screens/CounselorSelection';
import { ChatScreen } from './screens/ChatScreen';
import { CardInventoryModal } from './screens/CardInventoryModal';

function AppContent() {
  const { counselor, showInventory, setShowInventory } = useApp();

  return (
    <>
      {counselor ? <ChatScreen /> : <CounselorSelection />}
      {showInventory && <CardInventoryModal onClose={() => setShowInventory(false)} />}
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
