import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// --- 1. LOGIN COMPONENT ---
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Bid Helper Agent</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>
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

  // KB States
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Settings States
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

  // --- API Calls ---

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
          <button onClick={() => { setActiveTab('history'); loadHistory(); }} className={`pb-4 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>History</button>
          {role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('kb')} className={`pb-4 text-sm font-medium ${activeTab === 'kb' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Knowledge Base (Admin)</button>
              <button onClick={() => setActiveTab('settings')} className={`pb-4 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Settings (Admin)</button>
            </>
          )}
        </div>

        {/* --- TAB: GENERATE BID --- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Job Lead Details</h3>
              <textarea 
                value={leadText} onChange={(e) => setLeadText(e.target.value)}
                placeholder="Paste the Upwork/Freelancer job description here..."
                className="w-full h-48 p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              />
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option>Professional</option>
                    <option>Conversational</option>
                    <option>Aggressive/Confident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length / Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long & Detailed</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleGenerate} disabled={isGenerating}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center gap-2"
              >
                {isGenerating && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isGenerating ? "Analyzing & Generating..." : "Generate Custom Bid"}
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Generated Output</h3>
                <div className="flex gap-2">