import { useState } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import type { CardType } from '../../types/card';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: CardType;
  cardId: number;
  onImageSaved: () => void;
  imageRemaining: number | undefined;
  counselorColor: string;
}

export function ImageGeneratorModal({
  isOpen,
  onClose,
  cardType,
  cardId,
  onImageSaved,
  imageRemaining,
  counselorColor,
}: ImageGeneratorModalProps) {
  const { showToast } = useApp();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [remaining, setRemaining] = useState(imageRemaining);

  const canGenerate = remaining !== undefined && remaining > 0;

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please describe the image you want to generate');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiService.generateImagePreview(prompt.trim());

      if (response.success && response.image_data) {
        setGeneratedImage(response.image_data);
        setRemaining(response.remaining);
      } else {
        setError(response.message || 'Failed to generate image');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = async () => {
    if (!generatedImage) return;

    setIsSaving(true);

    try {
      const response = await apiService.saveCardImage(
        cardType as 'self' | 'character' | 'world' | 'universal',
        cardId,
        generatedImage
      );

      if (response.success) {
        showToast({ message: 'Image saved to card!', type: 'success' });
        onImageSaved();
        onClose();
      } else {
        showToast({ message: response.message || 'Failed to save image', type: 'error' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save image';
      showToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl modal-enter">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Generate Card Image</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the picture you want
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError(null);
              }}
              placeholder="A peaceful garden with cherry blossoms..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isGenerating}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {remaining !== undefined && (
              <p className="mt-2 text-sm text-gray-500">
                {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isGenerating || !canGenerate}
            className="w-full py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            style={{
              background: canGenerate
                ? `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)`
                : '#E5E7EB',
              color: canGenerate ? 'white' : '#9CA3AF',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {generatedImage ? 'Regenerate' : 'Submit'}
              </>
            )}
          </button>

          {generatedImage && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="flex justify-center">
                  <img
                    src={generatedImage}
                    alt="Generated preview"
                    className="w-64 h-64 object-cover rounded-xl shadow-md"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors disabled:opacity-50 min-h-[44px]"
                  style={{
                    background: `linear-gradient(135deg, ${counselorColor} 0%, ${counselorColor}DD 100%)`,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Accept'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
