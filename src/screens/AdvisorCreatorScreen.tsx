import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { ArrowLeft, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

type CreationStep = 'questions' | 'generating' | 'success';

interface FormData {
  name: string;
  specialty: string;
  vibe: string;
}

interface FormErrors {
  name?: string;
  specialty?: string;
  vibe?: string;
}

export function AdvisorCreatorScreen() {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<CreationStep>('questions');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    specialty: '',
    vibe: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Specialty is required';
    } else if (formData.specialty.length > 200) {
      newErrors.specialty = 'Specialty must be 200 characters or less';
    } else if (formData.specialty.trim().length < 5) {
      newErrors.specialty = 'Please provide more detail about the specialty';
    }

    if (!formData.vibe.trim()) {
      newErrors.vibe = 'Vibe is required';
    } else if (formData.vibe.length > 200) {
      newErrors.vibe = 'Vibe must be 200 characters or less';
    } else if (formData.vibe.trim().length < 5) {
      newErrors.vibe = 'Please provide more detail about the vibe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearNameError = () => {
    setErrors({ ...errors, name: undefined });
  };

  const clearSpecialtyError = () => {
    setErrors({ ...errors, specialty: undefined });
  };

  const clearVibeError = () => {
    setErrors({ ...errors, vibe: undefined });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({ message: 'Please fix the errors above', type: 'error' });
      return;
    }

    setApiError(null);
    setStep('generating');

    try {
      const response = await apiService.createCustomAdvisor(
        formData.name.trim(),
        formData.specialty.trim(),
        formData.vibe.trim()
      );

      if (response.success) {
        setStep('success');
        showToast({ message: 'Advisor created successfully!', type: 'success' });
      } else {
        setApiError(response.message || 'Failed to create advisor');
        setStep('questions');
        showToast({ message: response.message || 'Failed to create advisor', type: 'error' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create advisor';
      setApiError(message);
      setStep('questions');
      showToast({ message, type: 'error' });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSuccessContinue = () => {
    navigate('/');
  };

  if (step === 'generating') {
    return (
      <div className="h-screen bg-gba-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <LoadingSpinner message="Creating your advisor..." />
          <p className="mt-4 text-gba-text">
            We're generating a complete persona based on your description.
            This may take a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="h-screen bg-gba-bg flex items-center justify-center p-4">
        <div className="bg-gba-ui border-2 border-gba-border rounded-lg p-8 max-w-md w-full text-center fade-in">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gba-border" />

          <h2 className="text-2xl font-bold text-gba-text mb-2">
            Advisor Created!
          </h2>

          <p className="text-gba-text mb-2">
            <strong>{formData.name}</strong> is ready to chat.
          </p>

          <p className="text-gba-text/70 mb-6">
            Your new advisor will appear alongside the other counselors.
            You can chat with them or delete them anytime.
          </p>

          <button
            onClick={handleSuccessContinue}
            className="w-full py-3 bg-gba-grass border-2 border-gba-border rounded-lg text-gba-text font-bold hover:bg-gba-grass/90 transition-colors"
          >
            Back to Counselors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gba-bg flex flex-col fade-in">
      <header className="flex-shrink-0 p-4">
        <button
          onClick={handleBack}
          className="min-h-[44px] px-3 py-2 flex items-center gap-2 text-gba-text hover:text-gba-border transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gba-ui border-2 border-gba-border rounded-lg p-6 w-full max-w-lg">
          <h1 className="text-2xl font-bold text-gba-text mb-2 text-center">
            Create Your Advisor
          </h1>

          <p className="text-gba-text/70 text-center mb-6">
            Answer 3 questions to create a unique AI advisor
          </p>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="advisor-name"
                className="block text-gba-text font-bold mb-2"
              >
                What is the name of your new advisor?
              </label>
              <input
                id="advisor-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearNameError();
                }}
                placeholder="e.g., Captain Wisdom"
                className={`w-full px-4 py-3 bg-gba-bg border-2 rounded-lg text-gba-text placeholder:text-gba-text/50 focus:outline-none focus:border-gba-grass transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gba-border'
                }`}
                maxLength={50}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gba-text/50 text-right">
                {formData.name.length}/50
              </p>
            </div>

            <div>
              <label
                htmlFor="advisor-specialty"
                className="block text-gba-text font-bold mb-2"
              >
                What is their specialty?
              </label>
              <textarea
                id="advisor-specialty"
                value={formData.specialty}
                onChange={(e) => {
                  setFormData({ ...formData, specialty: e.target.value });
                  clearSpecialtyError();
                }}
                placeholder="e.g., Life advice with maritime metaphors and seafaring wisdom"
                className={`w-full px-4 py-3 bg-gba-bg border-2 rounded-lg text-gba-text placeholder:text-gba-text/50 focus:outline-none focus:border-gba-grass resize-none transition-colors ${
                  errors.specialty ? 'border-red-500' : 'border-gba-border'
                }`}
                rows={3}
                maxLength={200}
                aria-invalid={!!errors.specialty}
                aria-describedby={errors.specialty ? 'specialty-error' : undefined}
              />
              {errors.specialty && (
                <p id="specialty-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.specialty}
                </p>
              )}
              <p className="mt-1 text-xs text-gba-text/50 text-right">
                {formData.specialty.length}/200
              </p>
            </div>

            <div>
              <label
                htmlFor="advisor-vibe"
                className="block text-gba-text font-bold mb-2"
              >
                What is their vibe?
              </label>
              <textarea
                id="advisor-vibe"
                value={formData.vibe}
                onChange={(e) => {
                  setFormData({ ...formData, vibe: e.target.value });
                  clearVibeError();
                }}
                placeholder="e.g., Gruff but caring old sea captain who speaks in weather metaphors"
                className={`w-full px-4 py-3 bg-gba-bg border-2 rounded-lg text-gba-text placeholder:text-gba-text/50 focus:outline-none focus:border-gba-grass resize-none transition-colors ${
                  errors.vibe ? 'border-red-500' : 'border-gba-border'
                }`}
                rows={3}
                maxLength={200}
                aria-invalid={!!errors.vibe}
                aria-describedby={errors.vibe ? 'vibe-error' : undefined}
              />
              {errors.vibe && (
                <p id="vibe-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.vibe}
                </p>
              )}
              <p className="mt-1 text-xs text-gba-text/50 text-right">
                {formData.vibe.length}/200
              </p>
            </div>

            {apiError && (
              <ErrorMessage
                message={apiError}
                onRetry={() => setApiError(null)}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={step !== 'questions'}
              className="w-full py-3 bg-gba-grass border-2 border-gba-border rounded-lg text-gba-text font-bold hover:bg-gba-grass/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Create Advisor</span>
              </div>
            </button>

            <p className="text-xs text-gba-text/50 text-center">
              You can create up to 5 custom advisors
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}