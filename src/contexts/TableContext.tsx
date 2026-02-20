import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  TableSlots,
  TableSlotCard,
  HandCard,
  ConversationMode,
  TableSlotPosition,
  Card,
} from '../types/card';
import type { Counselor } from '../types/counselor';
import type { Personality } from '../types/personality';
import { apiService } from '../services/api';

interface TableContextType {
  slots: TableSlots;
  hand: HandCard[];
  conversationMode: ConversationMode;
  draggedCard: HandCard | null;
  sessionId: number | null;
  isTableVisible: boolean;
  conversationPartner: Personality | null;
  setIsTableVisible: (visible: boolean) => void;
  setDraggedCard: (card: HandCard | null) => void;
  setSessionId: (id: number | null) => void;
  playCard: (position: TableSlotPosition) => Promise<void>;
  removeCard: (position: TableSlotPosition) => Promise<void>;
  loadTableState: (sessionId: number) => Promise<void>;
  clearTable: () => void;
  toggleTableVisibility: () => void;
  loadAllCards: () => Promise<void>;
  addCardToHand: (cardType: string, cardId: number) => Promise<void>;
  removeCardFromHand: (cardType: string, cardId: number) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const DEFAULT_SLOTS: TableSlots = {
  center: null,
  far_left: null,
  far_right: null,
};

function determineMode(slots: TableSlots): ConversationMode {
  const farCards = [slots.far_left, slots.far_right].filter(Boolean);
  
  for (const card of farCards) {
    if (card?.card_type === 'character' || card?.card_type === 'self') {
      return 'roleplay';
    }
  }
  
  if (farCards.length === 2) {
    return 'three_way';
  }
  
  return 'advisory';
}

export function TableProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<TableSlots>(DEFAULT_SLOTS);
  const [hand, setHand] = useState<HandCard[]>([]);
  const [draggedCard, setDraggedCard] = useState<HandCard | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [conversationPartner, setConversationPartner] = useState<Personality | null>(null);

  const conversationMode = determineMode(slots);

  const playCard = useCallback(async (position: TableSlotPosition) => {
    if (!draggedCard || !sessionId) return;
    
    try {
      await apiService.playCardToTable(
        sessionId,
        position,
        draggedCard.card_type,
        draggedCard.card_id
      );
      
      const newCard = {
        session_id: sessionId,
        slot_position: position,
        card_type: draggedCard.card_type,
        card_id: draggedCard.card_id,
        card_data: draggedCard.card_data,
      } as TableSlotCard;
      
      setSlots(prev => {
        const newSlots = {
          ...prev,
          [position]: newCard,
        };
        return newSlots;
      });
      
      if (position === 'far_left') {
        if (draggedCard.card_type === 'personality') {
          const personality = await apiService.getPersonality(draggedCard.card_id);
          setConversationPartner(personality);
        } else if (draggedCard.card_type === 'character' || draggedCard.card_type === 'self') {
          setConversationPartner(null);
        }
      }
      
      setDraggedCard(null);
    } catch (error) {
      console.error('Failed to play card:', error);
      throw error;
    }
  }, [draggedCard, sessionId]);

  const removeCard = useCallback(async (position: TableSlotPosition) => {
    if (!sessionId) return;
    
    try {
      await apiService.removeCardFromTable(sessionId, position);
      
      setSlots(prev => ({
        ...prev,
        [position]: null,
      }));
      
      if (position === 'far_left') {
        setConversationPartner(null);
      }
    } catch (error) {
      console.error('Failed to remove card:', error);
      throw error;
    }
  }, [sessionId]);

  const loadTableState = useCallback(async (sid: number) => {
    try {
      const response = await apiService.getTableState(sid);
      
      if (response.success && response.data) {
        const newSlots: TableSlots = { ...DEFAULT_SLOTS };
        
        for (const slot of response.data.slots || []) {
          newSlots[slot.slot_position as TableSlotPosition] = slot;
        }
        
        setSlots(newSlots);
        setSessionId(sid);
        
        if (newSlots.far_left?.card_type === 'personality' && newSlots.far_left?.card_data) {
          const personality = await apiService.getPersonality(newSlots.far_left.card_id);
          setConversationPartner(personality);
        } else {
          setConversationPartner(null);
        }
      }
    } catch (error) {
      console.error('Failed to load table state:', error);
    }
  }, []);

  const clearTable = useCallback(() => {
    setSlots(DEFAULT_SLOTS);
    setConversationPartner(null);
  }, []);

  const toggleTableVisibility = useCallback(() => {
    setIsTableVisible(prev => !prev);
  }, []);

  const loadAllCards = useCallback(async () => {
    try {
      const [cardsRes, universalRes, counselorsRes] = await Promise.all([
        apiService.getCards(),
        apiService.getUniversalCards(),
        apiService.getCounselors(),
      ]);

      const allCards: HandCard[] = [];
      const items = cardsRes.data?.items || [];

      // 1. Self cards
      items
        .filter((c: Card) => c.card_type === 'self')
        .forEach((card: Card) => {
          allCards.push({
            id: card.id,
            client_id: 0,
            card_type: 'self',
            card_id: card.id,
            position: 0,
            added_at: card.created_at,
            card_data: card.payload,
          });
        });

      // 2. Character cards
      items
        .filter((c: Card) => c.card_type === 'character')
        .forEach((card: Card) => {
          allCards.push({
            id: card.id,
            client_id: 0,
            card_type: 'character',
            card_id: card.id,
            position: 0,
            added_at: card.created_at,
            card_data: card.payload,
          });
        });

      // 3. World cards
      items
        .filter((c: Card) => c.card_type === 'world')
        .forEach((card: Card) => {
          allCards.push({
            id: card.id,
            client_id: 0,
            card_type: 'world',
            card_id: card.id,
            position: 0,
            added_at: card.created_at,
            card_data: card.payload,
          });
        });

      // 5. Universal cards
      (universalRes.data || []).forEach((card: any) => {
        allCards.push({
          id: card.id,
          client_id: 0,
          card_type: 'universal',
          card_id: card.id,
          position: 0,
          added_at: card.created_at,
          card_data: {
            name: card.title,
            title: card.title,
            description: card.description,
            ...card.card_json,
            image_url: card.image_url,
          },
        });
      });

      // 6. Counselors (personalities)
      counselorsRes.forEach((c: Counselor) => {
        allCards.push({
          id: -c.id,
          client_id: 0,
          card_type: 'personality',
          card_id: c.id,
          position: 0,
          added_at: new Date().toISOString(),
          card_data: {
            name: c.name,
            description: c.description,
            specialty: c.specialty,
            visuals: c.visuals,
          },
        });
      });

      setHand(allCards);
    } catch (error) {
      console.error('Failed to load all cards:', error);
    }
  }, []);

  const addCardToHand = useCallback(async (cardType: string, cardId: number) => {
    try {
      const response = await apiService.addCardToHand(cardType, cardId);
      
      if (response.success) {
        await loadAllCards();
      }
    } catch (error) {
      console.error('Failed to add card to hand:', error);
      throw error;
    }
  }, [loadAllCards]);

  const removeCardFromHand = useCallback(async (cardType: string, cardId: number) => {
    try {
      const response = await apiService.removeCardFromHand(cardType, cardId);
      
      if (response.success) {
        setHand(prev => prev.filter(
          c => !(c.card_type === cardType && c.card_id === cardId)
        ));
      }
    } catch (error) {
      console.error('Failed to remove card from hand:', error);
      throw error;
    }
  }, []);

  return (
    <TableContext.Provider value={{
      slots,
      hand,
      conversationMode,
      draggedCard,
      sessionId,
      isTableVisible,
      conversationPartner,
      setIsTableVisible,
      setDraggedCard,
      setSessionId,
      playCard,
      removeCard,
      loadTableState,
      clearTable,
      toggleTableVisibility,
      loadAllCards,
      addCardToHand,
      removeCardFromHand,
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
