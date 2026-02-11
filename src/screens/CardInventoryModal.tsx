import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { useDebounce } from '../hooks/useDebounce';
import type { Card, CardType } from '../types/card';
import { ArrowLeft, Search, ChevronRight, Settings, Plus } from 'lucide-react';

type TabType = 'self' | 'character' | 'world';

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

  if (card.card_type === 'world') {
    fields.push({ label: 'Title', value: payload.title || '', key: 'title' });
    if (payload.event_type) fields.push({ label: 'Event Type', value: payload.event_type, key: 'event_type' });
    if (payload.key_array && payload.key_array.length > 0) {
      fields.push({ label: 'Key Points', value: payload.key_array.join(', '), key: 'key_array' });
    }
    if (payload.is_canon_law !== undefined) fields.push({ label: 'Canon Law', value: payload.is_canon_law ? 'Yes' : 'No', key: 'is_canon_law' });
    if (payload.resolved !== undefined) fields.push({ label: 'Resolved', value: payload.resolved ? 'Yes' : 'No', key: 'resolved' });
  } else if (card.card_type === 'character') {
    fields.push({ label: 'Name', value: payload.name || '', key: 'name' });
    if (payload.relationship_type) fields.push({ label: 'Relationship', value: payload.relationship_type, key: 'relationship_type' });
    if (payload.relationship_label) fields.push({ label: 'Custom Label', value: payload.relationship_label, key: 'relationship_label' });
    if (payload.personality) fields.push({ label: 'Personality', value: payload.personality, key: 'personality' });
  } else {
    if (payload.name) fields.push({ label: 'Name', value: payload.name, key: 'name' });
    if (payload.personality) fields.push({ label: 'Personality', value: payload.personality, key: 'personality' });
    if (payload.background) fields.push({ label: 'Background', value: payload.background, key: 'background' });
  }

  if (payload.description) {
    fields.push({ label: 'Description', value: payload.description, key: 'description' });
  }

  return fields;
}

export function CardInventoryModal({ onClose, isFullScreen = false }: { onClose: () => void; isFullScreen?: boolean }) {
  const { clientId, showToast, counselor } = useApp();
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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const counselorColor = counselor?.visuals.selectionCard.backgroundColor || '#78C0D8';

  useEffect(() => {
    loadCards();
  }, [clientId]);

  const loadCards = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getCards(clientId);
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

  const handleTogglePin = async (card: Card) => {
    setTogglingCardId(card.id);

    try {
      if (card.is_pinned) {
        await apiService.unpinCard(card.card_type, card.id);
      } else {
        await apiService.pinCard(card.card_type, card.id);
      }
      await loadCards();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to update pin status');
    } finally {
      setTogglingCardId(null);
    }
  };

  const handleToggleAutoUpdate = async (card: Card) => {
    setTogglingCardId(card.id);

    try {
      await apiService.toggleAutoUpdate(card.card_type, card.id);
      await loadCards();
    } catch (err) {
      console.error('Failed to toggle auto-update:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auto-update');
    } finally {
      setTogglingCardId(null);
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
    if (card.card_type === 'world') {
      return {
        title: payload.title || '',
        description: payload.description || '',
        event_type: payload.event_type || '',
      };
    } else if (card.card_type === 'character') {
      return {
        name: payload.name || '',
        relationship_type: payload.relationship_type || '',
        relationship_label: payload.relationship_label || '',
        personality: payload.personality || '',
      };
    } else {
      return {
        name: payload.name || '',
        personality: payload.personality || '',
        background: payload.background || '',
        description: payload.description || '',
      };
    }
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

  const validateForm = (cardType: CardType, form: Record<string, string>): string[] => {
    const errors: string[] = [];

    if (cardType === 'world') {
      if (!form.title.trim()) errors.push('Title is required');
      if (form.title.length > 160) errors.push('Title must be 160 characters or less');
      if (form.event_type.length > 200) errors.push('Event type must be 200 characters or less');
      if (!form.description.trim()) errors.push('Description is required');
      if (form.description.length > 8000) errors.push('Description must be 8000 characters or less');
    } else if (cardType === 'character') {
      if (!form.name.trim()) errors.push('Name is required');
      if (form.name.length > 160) errors.push('Name must be 160 characters or less');
      if (form.relationship_type.length > 200) errors.push('Relationship type must be 200 characters or less');
      if (form.relationship_label && form.relationship_label.length > 200) errors.push('Custom label must be 200 characters or less');
      if (!form.personality.trim()) errors.push('Personality is required');
      if (form.personality.length > 8000) errors.push('Personality must be 8000 characters or less');
    } else {
      if (form.name && form.name.length > 160) errors.push('Name must be 160 characters or less');
      if (form.personality && form.personality.length > 8000) errors.push('Personality must be 8000 characters or less');
      if (form.background && form.background.length > 8000) errors.push('Background must be 8000 characters or less');
      if (form.description && form.description.length > 8000) errors.push('Description must be 8000 characters or less');
    }

    return errors;
  };

  const handleCreateCard = async () => {
    if (!clientId) return;

    const errors = validateForm(createCardType, createForm);
    if (errors.length > 0) {
      setCreateError(errors.join(', '));
      return;
    }

    setSaving(true);
    setCreateError(null);

    try {
      const cardData = { ...createForm, auto_update_enabled: true, is_pinned: false };
      const response = await apiService.saveCard(clientId, createCardType, cardData);

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

  const getInitialCreateForm = (cardType: CardType): Record<string, string> => {
    if (cardType === 'world') {
      return { title: '', description: '', event_type: '' };
    } else if (cardType === 'character') {
      return { name: '', relationship_type: '', relationship_label: '', personality: '' };
    } else {
      return { name: '', personality: '', background: '', description: '' };
    }
  };

  const handleStartCreate = (cardType: CardType) => {
    setCreateCardType(cardType);
    setCreateForm(getInitialCreateForm(cardType));
    setCreateError(null);
    setIsCreating(true);
  };

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    setCreateError(null);
  };

  const filteredCards = cards
    .filter((card) => card.card_type === activeTab)
    .filter((card) => {
      if (!debouncedSearchQuery) return true;

      const name = card.card_type === 'world' ? card.payload?.title : (card.payload?.name || '');
      const description = card.payload?.description || card.payload?.personality || '';

      const query = debouncedSearchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });

  const getCardTitle = (card: Card): string => {
    if (card.card_type === 'world') return card.payload?.title || 'Untitled Event';
    if (card.card_type === 'character') return card.payload?.name || 'Unnamed Character';
    return card.payload?.name || 'Self Card';
  };

  const getCardSubtitle = (card: Card): string => {
    if (card.card_type === 'character') return card.payload?.relationship_type || 'Relationship';
    if (card.card_type === 'world') {
      const desc = card.payload?.description || '';
      return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
    }
    const desc = card.payload?.description || card.payload?.personality || '';
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  };

  const getEmptyStateMessage = (): string => {
    if (debouncedSearchQuery) {
      return 'No cards match your search.';
    }
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
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
              {(['self', 'character', 'world'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`segmented-control-item ${activeTab === tab ? 'active' : ''}`}
                  style={activeTab === tab ? { color: counselorColor } : { color: '#6B7280' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          {loading && !selectedCard && !isCreating ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error && !selectedCard && !isCreating ? (
            <ErrorMessage message={error} onRetry={loadCards} />
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
                card={selectedCard}
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
                onToggleAutoUpdate={() => handleToggleAutoUpdate(selectedCard)}
                toggling={togglingCardId === selectedCard.id}
                counselorColor={counselorColor}
              />
            )
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-sans text-gray-600 text-base mb-6">{getEmptyStateMessage()}</p>
              {!debouncedSearchQuery && (
                <button
                  onClick={() => handleStartCreate(activeTab)}
                  className="pill-button pill-button-primary"
                  style={{ background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)` }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Card
                </button>
              )}
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
                      {card.auto_update_enabled && (
                        <span className="badge badge-auto mt-2" title="Auto-update enabled">
                          🤖 Auto-update
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedCard && !isCreating && filteredCards.length > 0 && (
            <button
              onClick={() => handleStartCreate(activeTab)}
              className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
              style={{
                background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)`,
                boxShadow: `0 4px 14px rgba(0, 0, 0, 0.15), 0 0 0 4px ${counselorColor}33`
              }}
              aria-label="Create new card"
            >
              <Plus className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardDetailView({
  card,
  onEdit,
  onTogglePin,
  onToggleAutoUpdate,
  toggling,
  counselorColor,
}: {
  card: Card;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleAutoUpdate: () => void;
  toggling: boolean;
  counselorColor: string;
}) {
  const fields = getCardFields(card);

  return (
    <div className="space-y-4">
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

      <div className="card-detail-section">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">📌</span>
            <div>
              <div className="font-medium text-gray-900">Pin this card</div>
              <div className="text-sm text-gray-500">Always load in conversation context</div>
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

      <div className="card-detail-section">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <div className="font-medium text-gray-900">Auto-update</div>
              <div className="text-sm text-gray-500">Let AI update this card</div>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle-switch"
            checked={card.auto_update_enabled}
            onChange={onToggleAutoUpdate}
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
  card,
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  counselorColor,
}: {
  card: Card;
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
        {card.card_type === 'world' && (
          <>
            <div className="mb-4">
              <label className="card-detail-label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
                maxLength={160}
                className="card-input"
                placeholder="Event title..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.title?.length || 0} / 160
              </div>
            </div>

            <div>
              <label className="card-detail-label">Event Type</label>
              <input
                type="text"
                value={form.event_type || ''}
                onChange={(e) => onChange('event_type', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Career, Relationship, Personal..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.event_type?.length || 0} / 200
              </div>
            </div>
          </>
        )}

        {card.card_type === 'character' && (
          <>
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
                placeholder="Character name..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.name?.length || 0} / 160
              </div>
            </div>

            <div>
              <label className="card-detail-label">Relationship</label>
              <input
                type="text"
                value={form.relationship_type || ''}
                onChange={(e) => onChange('relationship_type', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Family, Friend, Colleague..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.relationship_type?.length || 0} / 200
              </div>
            </div>

            <div>
              <label className="card-detail-label">Custom Label (Optional)</label>
              <input
                type="text"
                value={form.relationship_label || ''}
                onChange={(e) => onChange('relationship_label', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Sister, Mother, Best Friend..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.relationship_label?.length || 0} / 200
              </div>
            </div>
          </>
        )}

        {card.card_type === 'self' && form.name !== undefined && (
          <div>
            <label className="card-detail-label">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              maxLength={160}
              className="card-input"
              placeholder="Your name..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.name?.length || 0} / 160
            </div>
          </div>
        )}

        {(card.card_type === 'character' || card.card_type === 'self') && (
          <div className="mt-4">
            <label className="card-detail-label">
              Personality {card.card_type === 'character' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.personality || ''}
              onChange={(e) => onChange('personality', e.target.value)}
              maxLength={8000}
              rows={4}
              className="card-textarea"
              placeholder="Describe their personality..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.personality?.length || 0} / 8000
            </div>
          </div>
        )}

        {card.card_type === 'self' && form.background !== undefined && (
          <div className="mt-4">
            <label className="card-detail-label">Background</label>
            <textarea
              value={form.background || ''}
              onChange={(e) => onChange('background', e.target.value)}
              maxLength={8000}
              rows={3}
              className="card-textarea"
              placeholder="Your background..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.background?.length || 0} / 8000
            </div>
          </div>
        )}

        {(card.card_type === 'world' || card.card_type === 'self') && form.description !== undefined && (
          <div className="mt-4">
            <label className="card-detail-label">
              Description {card.card_type === 'world' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              maxLength={8000}
              rows={6}
              className="card-textarea"
              placeholder="Describe in detail..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.description?.length || 0} / 8000
            </div>
          </div>
        )}
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
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card-detail-section">
        {cardType === 'world' && (
          <>
            <div className="mb-4">
              <label className="card-detail-label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
                maxLength={160}
                className="card-input"
                placeholder="Event title..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.title?.length || 0} / 160
              </div>
            </div>

            <div>
              <label className="card-detail-label">Event Type</label>
              <input
                type="text"
                value={form.event_type || ''}
                onChange={(e) => onChange('event_type', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Career, Relationship, Personal..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.event_type?.length || 0} / 200
              </div>
            </div>
          </>
        )}

        {cardType === 'character' && (
          <>
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
                placeholder="Character name..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.name?.length || 0} / 160
              </div>
            </div>

            <div>
              <label className="card-detail-label">Relationship</label>
              <input
                type="text"
                value={form.relationship_type || ''}
                onChange={(e) => onChange('relationship_type', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Family, Friend, Colleague..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.relationship_type?.length || 0} / 200
              </div>
            </div>

            <div>
              <label className="card-detail-label">Custom Label (Optional)</label>
              <input
                type="text"
                value={form.relationship_label || ''}
                onChange={(e) => onChange('relationship_label', e.target.value)}
                maxLength={200}
                className="card-input"
                placeholder="e.g., Sister, Mother, Best Friend..."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {form.relationship_label?.length || 0} / 200
              </div>
            </div>
          </>
        )}

        {cardType === 'self' && (
          <div>
            <label className="card-detail-label">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              maxLength={160}
              className="card-input"
              placeholder="Your name..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.name?.length || 0} / 160
            </div>
          </div>
        )}

        {(cardType === 'character' || cardType === 'self') && (
          <div className="mt-4">
            <label className="card-detail-label">
              Personality {cardType === 'character' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.personality || ''}
              onChange={(e) => onChange('personality', e.target.value)}
              maxLength={8000}
              rows={4}
              className="card-textarea"
              placeholder="Describe their personality..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.personality?.length || 0} / 8000
            </div>
          </div>
        )}

        {cardType === 'self' && (
          <div className="mt-4">
            <label className="card-detail-label">Background</label>
            <textarea
              value={form.background || ''}
              onChange={(e) => onChange('background', e.target.value)}
              maxLength={8000}
              rows={3}
              className="card-textarea"
              placeholder="Your background..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.background?.length || 0} / 8000
            </div>
          </div>
        )}

        {(cardType === 'world' || cardType === 'self') && (
          <div className="mt-4">
            <label className="card-detail-label">
              Description {cardType === 'world' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              maxLength={8000}
              rows={6}
              className="card-textarea"
              placeholder="Describe in detail..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {form.description?.length || 0} / 8000
            </div>
          </div>
        )}
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
