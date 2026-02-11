import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services/api';
import { Copy, RefreshCw, X, Check } from 'lucide-react';

interface RecoveryCodeModalProps {
  recoveryCode: string;
  onClose: () => void;
  onRegenerate?: () => void;
}

export function RecoveryCodeModal({ recoveryCode, onClose, onRegenerate }: RecoveryCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { clientId, showToast } = useApp();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      showToast({ message: 'Recovery code copied to clipboard', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ message: 'Failed to copy', type: 'error' });
    }
  };

  const handleRegenerate = async () => {
    if (!clientId) return;
    
    if (!confirm('Are you sure? This will invalidate your old recovery code.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await apiService.generateRecoveryCode(clientId);
      if (response.success && response.data?.recovery_code) {
        showToast({ message: 'New recovery code generated', type: 'success' });
        if (onRegenerate) {
          onRegenerate();
        }
      } else {
        showToast({ message: response.message || 'Failed to generate code', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Failed to generate code', type: 'error' });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-[#F8F0D8] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#483018]">Save Your Recovery Code</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[#E8D0A0]"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[#483018]" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Save this code somewhere safe. 
            If you lose access to this device, you can use this code to recover your account 
            and all your cards.
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 border-2 border-[#306850]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[#483018]">Your Recovery Code</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-100"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#483018]" />
                  <span className="text-[#483018]">Copy</span>
                </>
              )}
            </button>
          </div>
          <code className="block break-all rounded bg-gray-100 p-3 text-lg font-mono text-[#483018]">
            {recoveryCode}
          </code>
        </div>

        <div className="mb-4 space-y-2 text-sm text-[#483018]">
          <p className="font-semibold">How to use:</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Screenshot or write down this code</li>
            <li>Store it somewhere safe (notes app, password manager, etc.)</li>
            <li>If you lose access, click "Recover Account" and enter this code</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[#306850] py-3 font-bold text-[#F8F0D8] hover:bg-[#204030] transition-colors"
          >
            I've Saved My Code
          </button>
          
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-[#306850] py-2 font-medium text-[#306850] hover:bg-[#E8D0A0] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Generate New Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
