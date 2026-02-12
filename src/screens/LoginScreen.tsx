import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

type Tab = 'login' | 'register';

export function LoginScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setClientId, setAuthToken, showToast } = useApp();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }
    
    if (activeTab === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = activeTab === 'login'
        ? await apiService.login(username, password)
        : await apiService.register(username, password, name || 'Gameapy User');
      
      if (response.success && response.data?.access_token) {
        const { access_token, user_id, username: returnedUsername } = response.data;
        
        localStorage.setItem('gameapy_auth_token', access_token);
        localStorage.setItem('gameapy_client_id_int', user_id.toString());
        
        setAuthToken(access_token);
        setClientId(user_id);
        
        showToast({
          message: activeTab === 'login' 
            ? `Welcome back, ${returnedUsername || username}!`
            : 'Account created successfully!',
          type: 'success'
        });
        
        navigate('/');
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#E8D0A0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#F8F0D8] rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-retro text-center text-[#483018] mb-8">
          Gameapy
        </h1>
        
        <div className="flex mb-6 border-b-2 border-[#D8D0B8]">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 font-retro text-lg ${
              activeTab === 'login'
                ? 'text-[#306850] border-b-4 border-[#306850]'
                : 'text-[#483018]/60'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 font-retro text-lg ${
              activeTab === 'register'
                ? 'text-[#306850] border-b-4 border-[#306850]'
                : 'text-[#483018]/60'
            }`}
          >
            Register
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-[#483018] mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
                className="w-full px-4 py-3 rounded border-2 border-[#D8D0B8] bg-white text-[#483018] focus:border-[#306850] focus:outline-none"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#483018] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#483018]/50" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full pl-10 pr-4 py-3 rounded border-2 border-[#D8D0B8] bg-white text-[#483018] focus:border-[#306850] focus:outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#483018] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#483018]/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'register' ? 'Min 6 characters' : 'Enter password'}
                className="w-full pl-10 pr-12 py-3 rounded border-2 border-[#D8D0B8] bg-white text-[#483018] focus:border-[#306850] focus:outline-none"
                required
                minLength={activeTab === 'register' ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#483018]/50 hover:text-[#483018]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#306850] text-[#F8F0D8] font-retro text-lg rounded hover:bg-[#204030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading 
              ? (activeTab === 'login' ? 'Logging in...' : 'Creating account...')
              : (activeTab === 'login' ? 'Login' : 'Create Account')
            }
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-[#483018]/70">
          {activeTab === 'login' 
            ? "Don't have an account? Switch to Register."
            : "Already have an account? Switch to Login."
          }
        </p>
      </div>
    </div>
  );
}
