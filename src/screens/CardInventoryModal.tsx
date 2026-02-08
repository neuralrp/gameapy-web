import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { useDebounce } from '../hooks/useDebounce';
import type { Card, CardType } from '../types/card';

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

export function CardInventoryModal({ onClose }: { onClose: () => void }) {
  const { clientId } = useApp();
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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'self', label: 'Self' },
    { id: 'character', label: 'Character' },
    { id: 'world', label: 'World' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-enter">
      <div className="bg-gba-ui border-2 border-gba-border rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b-2 border-gba-border flex-shrink-0">
          <h2 className="font-retro text-2xl text-gba-text px-2">
            {selectedCard
              ? isEditing
                ? `Edit: ${getCardTitle(selectedCard)}`
                : getCardTitle(selectedCard)
              : 'Your Cards'}
          </h2>
          <button
            onClick={selectedCard ? handleCancel : onClose}
            className="p-2 border-2 border-gba-border rounded hover:bg-gba-highlight font-sans text-sm min-h-[44px] min-w-[44px]"
          >
            {selectedCard ? '←' : '✕'}
          </button>
        </div>

        {!selectedCard && (
          <div className="p-4 border-b-2 border-gba-border flex-shrink-0">
            <div className="flex gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 border-2 border-gba-border font-sans font-medium transition-colors min-h-[44px] ${
                    activeTab === tab.id
                      ? 'bg-gba-highlight text-gba-border'
                      : 'bg-gba-ui text-gba-text hover:bg-gba-highlight'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text placeholder-gba-text placeholder-opacity-50 focus:outline-none focus:border-gba-accent min-h-[44px]"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading && !selectedCard ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error && !selectedCard ? (
            <ErrorMessage message={error} onRetry={loadCards} />
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
              />
            ) : (
              <CardDetailView
                card={selectedCard}
                onEdit={() => handleEdit(selectedCard)}
                onTogglePin={() => handleTogglePin(selectedCard)}
                onToggleAutoUpdate={() => handleToggleAutoUpdate(selectedCard)}
                toggling={togglingCardId === selectedCard.id}
              />
            )
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-sans text-gba-text text-lg mb-2">{getEmptyStateMessage()}</p>
              {!debouncedSearchQuery && (
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 border-2 border-gba-border bg-gba-highlight font-sans font-medium hover:bg-gba-accent min-h-[44px]"
                >
                  Start Chatting
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gba-bg border-2 border-gba-border p-4 rounded-lg cursor-pointer hover:bg-gba-card"
                  onClick={() => handleViewCard(card)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {card.is_pinned && (
                          <span className="text-xl" title="Pinned">📌</span>
                        )}
                        <h3 className="font-retro text-xl text-gba-text">
                          {getCardTitle(card)}
                        </h3>
                      </div>
                      <p className="font-sans text-sm text-gba-text">
                        {getCardSubtitle(card)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(card)}
                      disabled={togglingCardId === card.id}
                      className="px-3 py-1 border-2 border-gba-border bg-gba-ui font-sans text-sm text-gba-text hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAutoUpdate(card)}
                      disabled={togglingCardId === card.id}
                      className={`px-3 py-1 border-2 border-gba-border font-sans text-sm hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
                        card.auto_update_enabled
                          ? 'bg-gba-accent text-gba-border'
                          : 'bg-gba-ui text-gba-text'
                      }`}
                      title={card.auto_update_enabled ? 'Auto-update enabled' : 'Auto-update disabled'}
                    >
                      🤖 {card.auto_update_enabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => handleTogglePin(card)}
                      disabled={togglingCardId === card.id}
                      className={`px-3 py-1 border-2 border-gba-border font-sans text-sm hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
                        card.is_pinned
                          ? 'bg-gba-accent text-gba-border'
                          : 'bg-gba-ui text-gba-text'
                      }`}
                      title={card.is_pinned ? 'Unpin card' : 'Pin card'}
                    >
                      {card.is_pinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
}: {
  card: Card;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleAutoUpdate: () => void;
  toggling: boolean;
}) {
  const fields = getCardFields(card);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 text-sm text-gba-text">
          {card.is_pinned && <span>📌 Pinned</span>}
          {card.auto_update_enabled && <span>🤖 Auto-update: ON</span>}
        </div>
        <span className="text-sm text-gba-text">
          Updated: {formatTimestamp(card.updated_at)}
        </span>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-sm font-semibold text-gba-text">{field.label}</label>
            <p className="font-sans text-base text-gba-text whitespace-pre-wrap">
              {field.value || <span className="italic text-gba-text opacity-50">Not set</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-gba-border">
        <p className="text-sm text-gba-text mb-2">Created: {formatTimestamp(card.created_at)}</p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onEdit}
          disabled={toggling}
          className="px-4 py-2 border-2 border-gba-border bg-gba-highlight font-sans font-medium hover:bg-gba-accent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          Edit Card
        </button>
        <button
          onClick={onToggleAutoUpdate}
          disabled={toggling}
          className={`px-4 py-2 border-2 border-gba-border font-sans font-medium hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
            card.auto_update_enabled
              ? 'bg-gba-accent text-gba-border'
              : 'bg-gba-ui text-gba-text'
          }`}
        >
          🤖 {card.auto_update_enabled ? 'Auto-update: ON' : 'Auto-update: OFF'}
        </button>
        <button
          onClick={onTogglePin}
          disabled={toggling}
          className={`px-4 py-2 border-2 border-gba-border font-sans font-medium hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
            card.is_pinned
              ? 'bg-gba-accent text-gba-border'
              : 'bg-gba-ui text-gba-text'
          }`}
        >
          {card.is_pinned ? '📌 Unpin' : '📌 Pin'}
        </button>
      </div>
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
}: {
  card: Card;
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 border-2 border-red-600 bg-red-50 rounded-lg text-red-800 font-sans text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {card.card_type === 'world' && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gba-text">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
                maxLength={160}
                className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent"
                placeholder="Event title..."
              />
              <p className="text-xs text-gba-text opacity-60 text-right">
                {form.title?.length || 0} / 160
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gba-text">Event Type</label>
              <input
                type="text"
                value={form.event_type || ''}
                onChange={(e) => onChange('event_type', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent"
                placeholder="e.g., Career, Relationship, Personal..."
              />
              <p className="text-xs text-gba-text opacity-60 text-right">
                {form.event_type?.length || 0} / 200
              </p>
            </div>
          </>
        )}

        {card.card_type === 'character' && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gba-text">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => onChange('name', e.target.value)}
                maxLength={160}
                className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent"
                placeholder="Character name..."
              />
              <p className="text-xs text-gba-text opacity-60 text-right">
                {form.name?.length || 0} / 160
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gba-text">Relationship</label>
              <input
                type="text"
                value={form.relationship_type || ''}
                onChange={(e) => onChange('relationship_type', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent"
                placeholder="e.g., Family, Friend, Colleague..."
              />
              <p className="text-xs text-gba-text opacity-60 text-right">
                {form.relationship_type?.length || 0} / 200
              </p>
            </div>
          </>
        )}

        {card.card_type === 'self' && form.name !== undefined && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gba-text">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              maxLength={160}
              className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent"
              placeholder="Your name..."
            />
            <p className="text-xs text-gba-text opacity-60 text-right">
              {form.name?.length || 0} / 160
            </p>
          </div>
        )}

        {(card.card_type === 'character' || card.card_type === 'self') && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gba-text">
              Personality {card.card_type === 'character' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={form.personality || ''}
              onChange={(e) => onChange('personality', e.target.value)}
              maxLength={8000}
              rows={4}
              className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent resize-none"
              placeholder="Describe their personality..."
            />
            <p className="text-xs text-gba-text opacity-60 text-right">
              {form.personality?.length || 0} / 8000
            </p>
          </div>
        )}

        {card.card_type === 'self' && form.background !== undefined && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gba-text">Background</label>
            <textarea
              value={form.background || ''}
              onChange={(e) => onChange('background', e.target.value)}
              maxLength={8000}
              rows={3}
              className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent resize-none"
              placeholder="Your background..."
            />
            <p className="text-xs text-gba-text opacity-60 text-right">
              {form.background?.length || 0} / 8000
            </p>
          </div>
        )}

        {(card.card_type === 'world' || card.card_type === 'self') && form.description !== undefined && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gba-text">
              Description {card.card_type === 'world' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              maxLength={8000}
              rows={6}
              className="w-full px-3 py-2 border-2 border-gba-border bg-gba-bg font-sans text-gba-text focus:outline-none focus:border-gba-accent resize-none"
              placeholder="Describe in detail..."
            />
            <p className="text-xs text-gba-text opacity-60 text-right">
              {form.description?.length || 0} / 8000
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t-2 border-gba-border flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-4 py-2 border-2 border-gba-border bg-gba-highlight font-sans font-medium hover:bg-gba-accent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border-2 border-gba-border bg-gba-ui font-sans font-medium hover:bg-gba-highlight disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
