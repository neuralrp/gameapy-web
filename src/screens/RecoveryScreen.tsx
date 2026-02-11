import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

export function RecoveryScreen() {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setClientId, showToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryCode.trim()) {
      setError('Please enter your recovery code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await apiService.validateRecoveryCode(recoveryCode.trim());
      
      if (response.success && response.data?.client_id) {
        const clientId = response.data.client_id;
        
        // Store in localStorage
        localStorage.setItem('gameapy_client_id_int', clientId.toString());
        
        // Update state
        setClientId(clientId);
        
        showToast({ 
          message: 'Account recovered successfully!', 
          type: 'success' 
        });
        
        // Navigate to counselor selection
        navigate('/');
      } else {
        setError(response.message || 'Invalid recovery code');
      }
    } catch (err) {
      setError('Failed to validate code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8D0A0] p-4">
      <div className="mx-auto max-w-md pt-12">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-[#483018] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </button>

        <div className="rounded-lg bg-[#F8F0D8] p-6 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#306850] bg-opacity-10">
              <KeyRound className="h-8 w-8 text-[#306850]" />
            </div>
            <h1 className="text-2xl font-bold text-[#483018]">Recover Your Account</h1>
            <p className="mt-2 text-[#483018]">
              Enter your recovery code to restore access to your cards and conversations.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="recovery-code" 
                className="mb-1 block text-sm font-medium text-[#483018]"
              >
                Recovery Code
              </label>
              <input
                id="recovery-code"
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full rounded-lg border-2 border-[#D8D0B8] bg-white p-3 font-mono text-lg tracking-wider text-[#483018] placeholder:text-[#483018]/50 focus:border-[#306850] focus:outline-none"
                disabled={isValidating}
              />
              <p className="mt-1 text-xs text-[#483018]/60">
                Enter the code you saved when you first created your account
              </p>
            </div>

            <button
              type="submit"
              disabled={isValidating || !recoveryCode.trim()}
              className="w-full rounded-lg bg-[#306850] py-3 font-bold text-[#F8F0D8] transition-colors hover:bg-[#204030] disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Recover Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#D8D0B8] pt-4">
            <p className="text-sm text-[#483018]">
              <strong>Don't have a recovery code?</strong>
            </p>
            <p className="mt-1 text-sm text-[#483018]/70">
              Unfortunately, without your recovery code or access to your original device, 
              we cannot restore your account. This is by design to protect your privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
