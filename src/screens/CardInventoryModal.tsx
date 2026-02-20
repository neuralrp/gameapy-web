import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { useDebounce } from '../hooks/useDebounce';
import { ImageGeneratorModal } from '../components/images/ImageGeneratorModal';
import type { Card, CardType } from '../types/card';
import type { CustomAdvisor } from '../types/counselor';
import { ArrowLeft, Search, ChevronRight, Settings, Plus, Trash2 } from 'lucide-react';

type TabType = 'self' | 'character' | 'world' | 'advisor';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCardFields(card: Card): Array<{ label: string; value: string; key: string }> {
  const payload = card.payload || {};
  const fields: Array<{ label: string; value: string; key: string }> = [];

  fields.push({ label: 'Name', value: payload.name || '', key: 'name' });

  if (payload.ai_notes) {
    fields.push({ label: 'AI Notes', value: payload.ai_notes, key: 'ai_notes' });
  }
  if (payload.user_notes) {
    fields.push({ label: 'Your Notes', value: payload.user_notes, key: 'user_notes' });
  }

  return fields;
}

export function CardInventoryModal({ onClose, isFullScreen = false }: { onClose: () => void; isFullScreen?: boolean }) {
  const { showToast, counselor } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('self');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingCardId, setTogglingCardId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [createCardType, setCreateCardType] = useState<CardType>('character');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});

  const [advisors, setAdvisors] = useState<CustomAdvisor[]>([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [deletingAdvisorId, setDeletingAdvisorId] = useState<number | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<CustomAdvisor | null>(null);
  const [isEditingAdvisor, setIsEditingAdvisor] = useState(false);
  const [editAdvisorForm, setEditAdvisorForm] = useState<{ name: string; specialty: string; vibe: string }>({
    name: '',
    specialty: '',
    vibe: ''
  });
  const [savingAdvisor, setSavingAdvisor] = useState(false);

  const [imageRemaining, setImageRemaining] = useState<number | undefined>(undefined);
  const [showImageGenerator, setShowImageGenerator] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const counselorColor = counselor?.visuals.selectionCard.backgroundColor || '#8B7355';

  useEffect(() => {
    loadCards();
    loadImageRemaining();
  }, []);

  const loadImageRemaining = async () => {
    try {
      const response = await apiService.getImageGenerationRemaining();
      if (response.success) {
        setImageRemaining(response.remaining);
      }
    } catch (err) {
      console.error('Failed to load image remaining:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'advisor') {
      loadAdvisors();
    }
  }, [activeTab]);

  const loadCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getCards();
      if (response.success && response.data?.items) {
        setCards(response.data.items);
      } else {
        setError(response.message || 'Failed to load cards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const loadAdvisors = async () => {
    setAdvisorsLoading(true);
    try {
      const advisorList = await apiService.getCustomAdvisors();
      setAdvisors(advisorList);
    } catch (err) {
      console.error('Failed to load advisors:', err);
    } finally {
      setAdvisorsLoading(false);
    }
  };

  const handleTogglePin = async (card: Card) => {
    setTogglingCardId(card.id);

    try {
      if (card.is_pinned) {
        await apiService.unpinCard(card.card_type, card.id);
      } else {
        await apiService.pinCard(card.card_type, card.id);
      }
      await loadCards();

      if (selectedCard && selectedCard.id === card.id) {
        const updatedCard = cards.find(c => c.id === card.id);
        if (updatedCard) {
          setSelectedCard(updatedCard);
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to update pin status');
    } finally {
      setTogglingCardId(null);
    }
  };

  const handleOpenImageGenerator = () => {
    setShowImageGenerator(true);
  };

  const handleImageSaved = async () => {
    await loadCards();
    if (selectedCard) {
      const updatedCard = cards.find(c => c.id === selectedCard.id);
      if (updatedCard) {
        setSelectedCard(updatedCard);
      }
    }
  };

  const handleEdit = (card: Card) => {
    setSelectedCard(card);
    setIsEditing(true);
    setEditForm(extractEditableFields(card));
    setHasUnsavedChanges(false);
    setEditError(null);
  };

  const handleViewCard = (card: Card) => {
    setSelectedCard(card);
    setIsEditing(false);
    setEditError(null);
  };

  const extractEditableFields = (card: Card): Record<string, string> => {
    const payload = card.payload || {};
    return {
      name: payload.name || '',
      ai_notes: payload.ai_notes || '',
      user_notes: payload.user_notes || '',
    };
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!selectedCard) return;

    const errors = validateForm(selectedCard.card_type, editForm);
    if (errors.length > 0) {
      setEditError(errors.join(', '));
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      await apiService.updateCard(selectedCard.card_type, selectedCard.id, editForm);
      await loadCards();
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setSelectedCard(null);
    } catch (err) {
      console.error('Failed to save card:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to save card';
      if (errorMsg.includes('exceeds')) {
        setEditError('One or more fields exceeded the maximum length allowed by the server.');
      } else {
        setEditError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    setIsEditing(false);
    setSelectedCard(null);
    setEditError(null);
    setHasUnsavedChanges(false);
  };

  const validateForm = (_cardType: CardType, form: Record<string, string>): string[] => {
    const errors: string[] = [];

    if (!form.name?.trim()) errors.push('Name is required');
    if (form.name && form.name.length > 160) errors.push('Name must be 160 characters or less');
    if (form.ai_notes && form.ai_notes.length > 16000) errors.push('AI Notes must be 16000 characters or less');
    if (form.user_notes && form.user_notes.length > 16000) errors.push('Your Notes must be 16000 characters or less');

    return errors;
  };

  const handleCreateCard = async () => {
    const errors = validateForm(createCardType, createForm);
    if (errors.length > 0) {
      setCreateError(errors.join(', '));
      return;
    }

    setSaving(true);
    setCreateError(null);

    try {
      const cardData = { ...createForm };
      const response = await apiService.saveCard(createCardType, cardData);

      if (response.success) {
        showToast({
          message: `${createCardType.charAt(0).toUpperCase() + createCardType.slice(1)} card created successfully!`,
          type: 'success'
        });

        await loadCards();
        setIsCreating(false);
        setCreateForm({});
        setCreateError(null);
      } else {
        setCreateError(response.message || 'Failed to save card');
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setCreateForm({});
    setCreateError(null);
  };

  const handleDeleteAdvisor = async (advisorId: number, advisorName: string) => {
    if (!confirm(`Are you sure you want to delete "${advisorName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingAdvisorId(advisorId);

    try {
      const response = await apiService.deleteCustomAdvisor(advisorId);

      if (response.success) {
        showToast({ message: 'Advisor deleted successfully', type: 'success' });
        await loadAdvisors();
      } else {
        showToast({ message: response.message || 'Failed to delete advisor', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to delete advisor:', err);
      showToast({ message: 'Failed to delete advisor', type: 'error' });
    } finally {
      setDeletingAdvisorId(null);
    }
  };

  const handleViewAdvisor = (advisor: CustomAdvisor) => {
    setSelectedAdvisor(advisor);
    const profile = advisor.profile?.data;
    setEditAdvisorForm({
      name: advisor.name,
      specialty: advisor.specialty,
      vibe: profile?.your_vibe || ''
    });
    setIsEditingAdvisor(false);
  };

  const handleCloseAdvisor = () => {
    setSelectedAdvisor(null);
    setIsEditingAdvisor(false);
    setEditAdvisorForm({ name: '', specialty: '', vibe: '' });
  };

  const handleStartEditAdvisor = () => {
    setIsEditingAdvisor(true);
  };

  const handleCancelEditAdvisor = () => {
    if (selectedAdvisor) {
      const profile = selectedAdvisor.profile?.data;
      setEditAdvisorForm({
        name: selectedAdvisor.name,
        specialty: selectedAdvisor.specialty,
        vibe: profile?.your_vibe || ''
      });
    }
    setIsEditingAdvisor(false);
  };

  const handleSaveAdvisor = async () => {
    if (!selectedAdvisor) return;

    if (!editAdvisorForm.name.trim()) {
      showToast({ message: 'Name is required', type: 'error' });
      return;
    }
    if (editAdvisorForm.name.trim().length < 2) {
      showToast({ message: 'Name must be at least 2 characters', type: 'error' });
      return;
    }
    if (!editAdvisorForm.specialty.trim()) {
      showToast({ message: 'Specialty is required', type: 'error' });
      return;
    }
    if (editAdvisorForm.specialty.trim().length < 5) {
      showToast({ message: 'Specialty must be at least 5 characters', type: 'error' });
      return;
    }
    if (!editAdvisorForm.vibe.trim()) {
      showToast({ message: 'Vibe is required', type: 'error' });
      return;
    }
    if (editAdvisorForm.vibe.trim().length < 5) {
      showToast({ message: 'Vibe must be at least 5 characters', type: 'error' });
      return;
    }

    setSavingAdvisor(true);

    try {
      const currentProfile = selectedAdvisor.profile;
      if (!currentProfile) {
        showToast({ message: 'Advisor profile not found', type: 'error' });
        return;
      }
      
      const updatedProfile = {
        ...currentProfile,
        spec: currentProfile.spec || 'gameapy/v1',
        spec_version: currentProfile.spec_version || '1.0.0',
        data: {
          ...currentProfile.data,
          name: editAdvisorForm.name.trim(),
          who_you_are: editAdvisorForm.specialty.trim(),
          your_vibe: editAdvisorForm.vibe.trim()
        }
      };

      const response = await apiService.updateCustomAdvisor(selectedAdvisor.id, updatedProfile);

      if (response.success) {
        showToast({ message: 'Advisor updated successfully', type: 'success' });
        await loadAdvisors();
        const updatedAdvisor = advisors.find(a => a.id === selectedAdvisor.id);
        if (updatedAdvisor) {
          setSelectedAdvisor({ ...updatedAdvisor, name: editAdvisorForm.name.trim(), specialty: editAdvisorForm.specialty.trim() });
        }
        setIsEditingAdvisor(false);
      } else {
        showToast({ message: response.message || 'Failed to update advisor', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to update advisor:', err);
      showToast({ message: 'Failed to update advisor', type: 'error' });
    } finally {
      setSavingAdvisor(false);
    }
  };

  const getInitialCreateForm = (_cardType: CardType): Record<string, string> => {
    return { name: '', ai_notes: '', user_notes: '' };
  };

  const handleStartCreate = (cardType: CardType) => {
    setCreateCardType(cardType);
    setCreateForm(getInitialCreateForm(cardType));
    setCreateError(null);
    setIsCreating(true);
  };

  const handleCreateAdvisor = () => {
    onClose();
    navigate('/create-advisor');
  };

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    setCreateError(null);
  };

  const filteredCards = cards
    .filter((card) => card.card_type === activeTab)
    .filter((card) => {
      if (!debouncedSearchQuery) return true;

      const name = card.payload?.name || '';
      const aiNotes = card.payload?.ai_notes || '';
      const userNotes = card.payload?.user_notes || '';

      const query = debouncedSearchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(query) ||
        aiNotes.toLowerCase().includes(query) ||
        userNotes.toLowerCase().includes(query)
      );
    });

  const filteredAdvisors = advisors.filter((advisor) => {
    if (!debouncedSearchQuery) return true;

    const query = debouncedSearchQuery.toLowerCase();
    return (
      advisor.name.toLowerCase().includes(query) ||
      advisor.specialty.toLowerCase().includes(query) ||
      advisor.description.toLowerCase().includes(query)
    );
  });

  const getCardTitle = (card: Card): string => {
    return card.payload?.name || (card.card_type === 'world' ? 'Untitled Event' : card.card_type === 'character' ? 'Unnamed Character' : 'Self Card');
  };

  const getCardSubtitle = (card: Card): string => {
    const desc = card.payload?.ai_notes || '';
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc || 'No notes yet';
  };

  const getEmptyStateMessage = (): string => {
    if (debouncedSearchQuery) {
      return 'No results match your search.';
    }
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    if (activeTab === 'advisor') {
      return 'No custom advisors yet. Create your first one!';
    }
    return `No ${tabName} cards yet. Start chatting to create cards!`;
  };

  return (
    <div className={isFullScreen ? 'min-h-screen flex flex-col bg-gray-50 fade-in' : 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-enter'}>
      <div className={isFullScreen ? 'bg-white flex-1 flex flex-col h-full shadow-2xl' : 'bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden'}>
        <div className="flex justify-between items-center p-5 pb-4 flex-shrink-0 bg-white">
          <h2 className="font-sans text-xl font-semibold text-gray-900">
            {isCreating
              ? 'Create New Card'
              : selectedCard
              ? isEditing
                ? `Edit: ${getCardTitle(selectedCard)}`
                : getCardTitle(selectedCard)
              : 'Your Cards'}
          </h2>
          <button
            onClick={() => {
              if (isCreating) {
                handleCancelCreate();
              } else if (selectedCard) {
                handleCancel();
              } else {
                onClose();
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {!selectedCard && !isCreating && (
          <div className="px-5 pb-4 flex-shrink-0 bg-white border-b border-gray-100">
            <div className="segmented-control mb-4">
              {(['self', 'character', 'world', 'advisor'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`segmented-control-item ${activeTab === tab ? 'active' : ''}`}
                  style={activeTab === tab ? { color: counselorColor } : { color: '#6B7280' }}
                >
                  {tab === 'world' ? 'Universal' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="search-wrapper">
              <Search className="search-icon w-5 h-5" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="card-input"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 relative">
          {loading && !selectedCard && !isCreating && activeTab !== 'advisor' ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error && !selectedCard && !isCreating && activeTab !== 'advisor' ? (
            <ErrorMessage message={error} onRetry={loadCards} />
          ) : advisorsLoading && activeTab === 'advisor' ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : isCreating ? (
            <CardCreateForm
              cardType={createCardType}
              setCardType={(type) => {
                setCreateCardType(type);
                setCreateForm(getInitialCreateForm(type));
              }}
              form={createForm}
              onChange={handleCreateFormChange}
              onSave={handleCreateCard}
              onCancel={handleCancelCreate}
              saving={saving}
              error={createError}
              counselorColor={counselorColor}
            />
          ) : selectedCard ? (
            isEditing ? (
              <CardEditForm
                form={editForm}
                onChange={handleFormChange}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
                error={editError}
                counselorColor={counselorColor}
              />
            ) : (
              <CardDetailView
                card={selectedCard}
                onEdit={() => handleEdit(selectedCard)}
                onTogglePin={() => handleTogglePin(selectedCard)}
                toggling={togglingCardId === selectedCard.id}
                counselorColor={counselorColor}
                onOpenImageGenerator={handleOpenImageGenerator}
                imageRemaining={imageRemaining}
              />
            )
          ) : selectedAdvisor ? (
            isEditingAdvisor ? (
              <AdvisorEditForm
                form={editAdvisorForm}
                onChange={(field, value) => setEditAdvisorForm(prev => ({ ...prev, [field]: value }))}
                onSave={handleSaveAdvisor}
                onCancel={handleCancelEditAdvisor}
                saving={savingAdvisor}
                counselorColor={counselorColor}
              />
            ) : (
              <AdvisorDetailView
                advisor={selectedAdvisor}
                onEdit={handleStartEditAdvisor}
                onDelete={() => handleDeleteAdvisor(selectedAdvisor.id, selectedAdvisor.name)}
                onClose={handleCloseAdvisor}
                deleting={deletingAdvisorId === selectedAdvisor.id}
                counselorColor={counselorColor}
              />
            )
          ) : (activeTab === 'advisor' ? filteredAdvisors.length === 0 : filteredCards.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-sans text-gray-600 text-base mb-6">{getEmptyStateMessage()}</p>
              {!debouncedSearchQuery && (
                <button
                  onClick={() => activeTab === 'advisor' ? handleCreateAdvisor() : handleStartCreate(activeTab as CardType)}
                  className="pill-button pill-button-primary"
                  style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create {activeTab === 'advisor' ? 'Advisor' : activeTab === 'world' ? 'Universal' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Card
                </button>
              )}
            </div>
          ) : activeTab === 'advisor' ? (
            <div className="space-y-3">
              {filteredAdvisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="card-item"
                  onClick={() => handleViewAdvisor(advisor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-pinned" title="Custom Advisor">
                          🤖 Custom Advisor
                        </span>
                        <h3 className="font-sans font-semibold text-base text-gray-900 truncate">
                          {advisor.name}
                        </h3>
                      </div>
                      <p className="font-sans text-sm text-gray-500 line-clamp-2">
                        {advisor.description}
                      </p>
                      <p className="font-sans text-xs text-gray-400 mt-1">
                        Created: {formatTimestamp(advisor.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAdvisor(advisor.id, advisor.name);
                        }}
                        disabled={deletingAdvisorId === advisor.id}
                        className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Delete ${advisor.name}`}
                        title="Delete advisor"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="card-item"
                  onClick={() => handleViewCard(card)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {card.is_pinned && (
                          <span className="badge badge-pinned" title="Pinned">
                            📌 Pinned
                          </span>
                        )}
                        <h3 className="font-sans font-semibold text-base text-gray-900 truncate">
                          {getCardTitle(card)}
                        </h3>
                      </div>
                      <p className="font-sans text-sm text-gray-500 line-clamp-2">
                        {getCardSubtitle(card)}
                       </p>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedCard && !isCreating && (
            <button
              onClick={() => activeTab === 'advisor' ? handleCreateAdvisor() : handleStartCreate(activeTab as CardType)}
              className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
              style={{
                background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)`,
                boxShadow: `0 4px 14px rgba(0, 0, 0, 0.15), 0 0 0 4px ${counselorColor}33`
              }}
              aria-label={activeTab === 'advisor' ? 'Create new advisor' : 'Create new card'}
            >
              <Plus className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      </div>

      {showImageGenerator && selectedCard && (
        <ImageGeneratorModal
          isOpen={showImageGenerator}
          onClose={() => setShowImageGenerator(false)}
          cardType={selectedCard.card_type}
          cardId={selectedCard.id}
          onImageSaved={handleImageSaved}
          imageRemaining={imageRemaining}
          counselorColor={counselorColor}
        />
      )}
    </div>
  );
}

function CardDetailView({
  card,
  onEdit,
  onTogglePin,
  toggling,
  counselorColor,
  onOpenImageGenerator,
  imageRemaining,
}: {
  card: Card;
  onEdit: () => void;
  onTogglePin: () => void;
  toggling: boolean;
  counselorColor: string;
  onOpenImageGenerator?: () => void;
  imageRemaining?: number;
}) {
  const fields = getCardFields(card);
  const hasImage = (card.payload as any)?.image_data;
  const canGenerateImage = imageRemaining !== undefined && imageRemaining > 0;

  return (
    <div className="space-y-4">
      {hasImage && (
        <div className="card-detail-section">
          <div className="flex justify-center mb-4">
            <img 
              src={(card.payload as any).image_data} 
              alt={card.payload?.name || 'Card'}
              className="w-64 h-64 object-cover rounded-xl shadow-md"
            />
          </div>
        </div>
      )}

      <div className="card-detail-section">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📇</span>
            <span className="text-sm text-gray-500">Last updated</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {formatTimestamp(card.updated_at)}
          </span>
        </div>

        {fields.map((field) => (
          <div key={field.key} className="card-detail-field">
            <div className="card-detail-label">{field.label}</div>
            <p className="card-detail-value whitespace-pre-wrap">
              {field.value || <span className="empty">Not set</span>}
            </p>
          </div>
        ))}
      </div>

      {onOpenImageGenerator && (
        <button
          onClick={onOpenImageGenerator}
          disabled={!canGenerateImage}
          className="card-detail-section w-full text-left cursor-pointer hover:bg-gray-50 transition-colors rounded-xl -mx-2 px-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <div>
                <div className="font-medium text-gray-900">Card Image</div>
                <div className="text-sm text-gray-500">
                  {hasImage ? 'Generate a new image' : 'Generate an AI image'}
                  {imageRemaining !== undefined && ` (${imageRemaining} left today)`}
                </div>
              </div>
            </div>
            <span className="text-gray-400 text-lg">›</span>
          </div>
        </button>
      )}

      <div className="card-detail-section">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">📌</span>
            <div>
              <div className="font-medium text-gray-900">Pinned</div>
              <div className="text-sm text-gray-500">Always load in context</div>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle-switch"
            checked={card.is_pinned}
            onChange={onTogglePin}
            disabled={toggling}
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onEdit}
          disabled={toggling}
          className="pill-button pill-button-primary w-full"
          style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
        >
          <Settings className="w-5 h-5 mr-2" />
          Edit Card
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Created {formatTimestamp(card.created_at)}
      </p>
    </div>
  );
}

function CardEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  counselorColor,
}: {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  counselorColor: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-sans text-sm">
          {error}
        </div>
      )}

      <div className="card-detail-section">
        <div className="mb-4">
          <label className="card-detail-label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            maxLength={160}
            className="card-input"
            placeholder="Enter a name..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.name?.length || 0} / 160
          </div>
        </div>

        <div className="mt-4">
          <label className="card-detail-label">
            🤖 AI Notes
            <span className="text-xs text-gray-400 ml-2">(Refreshes at session end)</span>
          </label>
          <textarea
            value={form.ai_notes || ''}
            onChange={(e) => onChange('ai_notes', e.target.value)}
            maxLength={16000}
            rows={6}
            className="card-textarea"
            placeholder="AI's understanding of this entity..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.ai_notes?.length || 0} / 16000
          </div>
        </div>

        <div className="mt-4">
          <label className="card-detail-label">
            📝 Your Notes
            <span className="text-xs text-gray-400 ml-2">(Private, never touched by AI)</span>
          </label>
          <textarea
            value={form.user_notes || ''}
            onChange={(e) => onChange('user_notes', e.target.value)}
            maxLength={16000}
            rows={4}
            className="card-textarea"
            placeholder="Your personal notes..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.user_notes?.length || 0} / 16000
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="pill-button pill-button-primary flex-1"
          style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="pill-button pill-button-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CardCreateForm({
  cardType,
  setCardType,
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  counselorColor,
}: {
  cardType: CardType;
  setCardType: (type: CardType) => void;
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  counselorColor: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-sans text-sm">
          {error}
        </div>
      )}

      <div className="card-detail-section">
        <label className="card-detail-label mb-2 block">Card Type</label>
        <div className="segmented-control">
          {(['self', 'character', 'world'] as CardType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCardType(type)}
              className={`segmented-control-item ${cardType === type ? 'active' : ''}`}
              style={cardType === type ? { color: counselorColor } : { color: '#6B7280' }}
            >
              {type === 'world' ? 'Universal' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card-detail-section">
        <div className="mb-4">
          <label className="card-detail-label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            maxLength={160}
            className="card-input"
            placeholder={cardType === 'self' ? 'Your name...' : cardType === 'character' ? 'Character name...' : 'Topic title...'}
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.name?.length || 0} / 160
          </div>
        </div>

        <div className="mt-4">
          <label className="card-detail-label">🤖 AI Notes</label>
          <textarea
            value={form.ai_notes || ''}
            onChange={(e) => onChange('ai_notes', e.target.value)}
            maxLength={16000}
            rows={6}
            className="card-textarea"
            placeholder="Initial notes about this entity..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.ai_notes?.length || 0} / 16000
          </div>
        </div>

        <div className="mt-4">
          <label className="card-detail-label">📝 Your Notes</label>
          <textarea
            value={form.user_notes || ''}
            onChange={(e) => onChange('user_notes', e.target.value)}
            maxLength={16000}
            rows={4}
            className="card-textarea"
            placeholder="Your personal notes (private, never touched by AI)..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.user_notes?.length || 0} / 16000
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="pill-button pill-button-primary flex-1"
          style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
        >
          {saving ? 'Saving...' : 'Save Card'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="pill-button pill-button-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AdvisorDetailView({
  advisor,
  onEdit,
  onDelete,
  onClose,
  deleting,
  counselorColor,
}: {
  advisor: CustomAdvisor;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  deleting: boolean;
  counselorColor: string;
}) {
  const profile = advisor.profile?.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-sans">Back</span>
        </button>
        <span className="badge badge-pinned">🤖 Custom Advisor</span>
      </div>

      <div className="card-detail-section">
        <div className="card-detail-field">
          <div className="card-detail-label">Name</div>
          <p className="card-detail-value">{advisor.name}</p>
        </div>
        <div className="card-detail-field">
          <div className="card-detail-label">Specialty</div>
          <p className="card-detail-value whitespace-pre-wrap">{advisor.specialty}</p>
        </div>
        {profile?.your_vibe && (
          <div className="card-detail-field">
            <div className="card-detail-label">Vibe</div>
            <p className="card-detail-value whitespace-pre-wrap">{profile.your_vibe}</p>
          </div>
        )}
        {profile?.who_you_are && (
          <div className="card-detail-field">
            <div className="card-detail-label">Who You Are</div>
            <p className="card-detail-value whitespace-pre-wrap">{profile.who_you_are}</p>
          </div>
        )}
        {profile?.your_worldview && (
          <div className="card-detail-field">
            <div className="card-detail-label">Worldview</div>
            <p className="card-detail-value whitespace-pre-wrap">{profile.your_worldview}</p>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={onEdit}
          className="pill-button pill-button-primary w-full"
          style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
        >
          <Settings className="w-5 h-5 mr-2" />
          Edit Advisor
        </button>
      </div>

      <div className="pt-2">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="pill-button pill-button-danger w-full"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          {deleting ? 'Deleting...' : 'Delete Advisor'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Created {formatTimestamp(advisor.created_at)}
      </p>
    </div>
  );
}

function AdvisorEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  counselorColor,
}: {
  form: { name: string; specialty: string; vibe: string };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  counselorColor: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <button
          onClick={onCancel}
          disabled={saving}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-sans">Cancel</span>
        </button>
        <span className="font-sans font-semibold text-gray-900">Edit Advisor</span>
        <div className="w-16" />
      </div>

      <div className="card-detail-section">
        <div className="mb-4">
          <label className="card-detail-label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            maxLength={50}
            className="card-input"
            placeholder="e.g., Captain Wisdom"
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.name.length} / 50
          </div>
        </div>

        <div className="mb-4">
          <label className="card-detail-label">
            Specialty <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.specialty}
            onChange={(e) => onChange('specialty', e.target.value)}
            maxLength={200}
            rows={3}
            className="card-textarea"
            placeholder="e.g., Life advice with maritime metaphors and seafaring wisdom"
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.specialty.length} / 200
          </div>
        </div>

        <div>
          <label className="card-detail-label">
            Vibe <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.vibe}
            onChange={(e) => onChange('vibe', e.target.value)}
            maxLength={200}
            rows={3}
            className="card-textarea"
            placeholder="e.g., Warm, witty, uses sailing metaphors, speaks like a seasoned captain"
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {form.vibe.length} / 200
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="pill-button pill-button-primary flex-1"
          style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="pill-button pill-button-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
