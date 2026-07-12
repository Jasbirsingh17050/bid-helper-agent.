import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- PREMIUM TOAST COMPONENT ---
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 transition-all duration-300 transform translate-y-0`}>
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 font-bold text-xl leading-none">&times;</button>
    </div>
  );
}

// --- 1. AUTH COMPONENT (SIGN IN & SIGN UP) ---
function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleGoogleSuccess = () => {
    console.log("Google User mock login initiated");
    showToast(`Google Auth simulated successfully!`, "success");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      // Handle Sign In
      try {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await axios.post('https://bid-helper-agent.onrender.com/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.username);

        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      }
    } else {
      // Handle Sign Up
      try {
        await axios.post('https://bid-helper-agent.onrender.com/auth/signup', {
          username: username,
          password: password,
          role: role
        });
        showToast("Account created successfully! Please log in.", "success");
        setIsLogin(true);
        setPassword('');
      } catch (err) {
        setError(err.response?.data?.detail || 'Sign up failed.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
          {isLogin ? "Bid Helper Agent" : "Create Account"}
        </h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required minLength="3" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required minLength="6" />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="admin">Admin</option>
                <option value="team">Team Member</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <hr className="w-full border-gray-300" />
          <span className="p-2 text-sm text-gray-400 mb-1">OR</span>
          <hr className="w-full border-gray-300" />
        </div>
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleGoogleSuccess}
            type="button"
            className="flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-blue-600 font-bold hover:underline">
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. DASHBOARD COMPONENT ---
function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  // UI States
  const [activeTab, setActiveTab] = useState('generate');
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Generation States
  const [leadText, setLeadText] = useState('');
  const [tone, setTone] = useState('Professional');
  const [size, setSize] = useState('Medium');
  const [generatedBid, setGeneratedBid] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  // History States
  const [historyBids, setHistoryBids] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // KB & Settings States
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState({ banned_phrases: '', confidential_keywords: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Security Check
  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  // Load Settings if Admin
  useEffect(() => {
    if (activeTab === 'settings' && role === 'admin') {
      loadSettings();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleGenerate = async () => {
    if (!leadText.trim()) return showToast("Please enter a job lead!", "error");
    setIsGenerating(true);
    setGeneratedBid('');
    setCurrentGenerationId(null); 

    try {
      const response = await axios.post(
        'https://bid-helper-agent.onrender.com/generate/bid', 
        { lead_text: leadText, tone: tone, size: size },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      setGeneratedBid(response.data.content);
      setCurrentGenerationId(response.data.generation_id); 
      showToast("Bid generated successfully!", "success");
    } catch (error) {
      showToast(error.response?.data?.detail || "Error generating bid.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiRevise = async (instruction) => {
    if (!currentGenerationId || !generatedBid) return;
    setIsRevising(true);
    try {
      const response = await axios.post(
        'https://bid-helper-agent.onrender.com/generate/ai-revise',
        {
          generation_id: currentGenerationId,
          current_content: generatedBid,
          instruction: instruction
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedBid(response.data.content);
      showToast(`AI successfully applied: ${instruction}`, "success");
    } catch (error) {
      showToast(error.response?.data?.detail || "Error revising.", "error");
    } finally {
      setIsRevising(false);
    }
  };

  const handleSaveRevision = async () => {
    if (!currentGenerationId) return;
    setIsSavingRevision(true);
    try {
      await axios.post(
        `https://bid-helper-agent.onrender.com/history/${currentGenerationId}/revise`,
        { content: generatedBid, action_type: 'manual_edit' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Manual edit saved successfully to History!", "success");
    } catch (error) {
      showToast("Failed to save revision.", "error");
    } finally {
      setIsSavingRevision(false);
    }
  };

  const handleDownload = () => {
    if (!generatedBid) return;
    const blob = new Blob([generatedBid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Custom_Bid_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("File downloaded successfully!", "success");
  };

  const handleCopy = () => {
    if (!generatedBid) return;
    navigator.clipboard.writeText(generatedBid);
    showToast("Copied to clipboard!", "success");
  };

  const handleUpload = async () => {
    if (!file) return showToast("Please select a CSV file.", "error");
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'https://bid-helper-agent.onrender.com/kb/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      showToast(`Success! ${response.data.total_projects_found} projects added.`, "success");
      setFile(null); 
    } catch (error) {
      showToast(error.response?.data?.detail || "Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/history/my-bids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryBids(response.data.bids);
    } catch (error) {
      showToast("Failed to load history.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/settings/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({
        banned_phrases: response.data.banned_phrases?.join(', ') || '',
        confidential_keywords: response.data.confidential_keywords?.join(', ') || ''
      });
    } catch (error) {
      showToast("Failed to load settings.", "error");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const formattedSettings = {
        active_llm_provider: "openai",
        daily_generation_limit_per_user: 50,
        banned_phrases: settings.banned_phrases.split(',').map(s => s.trim()).filter(Boolean),
        confidential_keywords: settings.confidential_keywords.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.put('https://bid-helper-agent.onrender.com/settings/', formattedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      showToast("Error saving settings. Are you an Admin?", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Bid Helper Agent</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Welcome, <strong className="text-gray-900">{username}</strong></span>
              {role === 'admin' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">ADMIN</span>}
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-6 border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab('generate')} className={`pb-4 text-sm font-medium ${activeTab === 'generate' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Generate Bid</button>
          <button onClick={() => { setActiveTab('history'); loadHistory(); }} className={`pb-4 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>History</button