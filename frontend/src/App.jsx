import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- PREMIUM TOAST COMPONENT ---
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  return (
    // ... existing code ...
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 transition-all duration-300 transform translate-y-0`}>
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 font-bold text-xl leading-none">&times;</button>
    </div>
  );
}

// --- 1. AUTH COMPONENT (LOGIN & SIGNUP) ---
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
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

        <div className="mt-4 text-center text-sm text-gray-600">
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
// ... existing code ...
// --- 3. MAIN APP ROUTER ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

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
                  <button onClick={handleDownload} disabled={!generatedBid} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded disabled:opacity-50 transition">Download .txt</button>
                  <button onClick={handleCopy} disabled={!generatedBid} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded disabled:opacity-50 transition">Copy</button>
                </div>
              </div>

              {generatedBid ? (
                <textarea 
                  value={generatedBid}
                  onChange={(e) => setGeneratedBid(e.target.value)}
                  className="w-full flex-grow p-4 border rounded-lg text-sm text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 min-h-[300px]"
                />
              ) : (
                <div className="w-full flex-grow border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 bg-gray-50 min-h-[300px]">
                  Your AI-generated bid will appear here.
                </div>
              )}

              {generatedBid && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Revisions</span>
                    {isRevising && <span className="text-xs text-purple-600 animate-pulse font-medium">AI is rewriting...</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleAiRevise("Make this much shorter and more concise.")} disabled={isRevising} className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium py-2 px-3 rounded shadow-sm disabled:opacity-50 transition">🪄 Make Shorter</button>
                    <button onClick={() => handleAiRevise("Make the tone more aggressive, confident, and persuasive.")} disabled={isRevising} className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium py-2 px-3 rounded shadow-sm disabled:opacity-50 transition">🪄 Make Aggressive</button>
                    <button onClick={() => handleAiRevise("Fix any grammar mistakes and polish the language to be perfectly professional.")} disabled={isRevising} className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium py-2 px-3 rounded shadow-sm disabled:opacity-50 transition">🪄 Fix Grammar</button>
                  </div>
                  <hr className="my-2 border-gray-100"/>
                  <button 
                    onClick={handleSaveRevision} disabled={isSavingRevision}
                    className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-2 px-4 rounded hover:bg-green-100 disabled:opacity-50 transition flex justify-center items-center gap-2"
                  >
                    {isSavingRevision ? "Saving Edit..." : "Save Manual Edit to History"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6">Your Past Generated Bids</h3>
            {isLoadingHistory ? (
              <p className="text-gray-500">Loading history...</p>
            ) : historyBids.length === 0 ? (
              <p className="text-gray-500">No bids generated yet.</p>
            ) : (
              <div className="space-y-6">
                {historyBids.map((bid) => {
                  const latestRevision = bid.revisions && bid.revisions.length > 0 
                    ? bid.revisions[bid.revisions.length - 1] 
                    : null;
                  return (
                    <div key={bid._id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Tone: {bid.tone}</span>
                          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">Size: {bid.size}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(bid.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-1">Original Lead:</h4>
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded line-clamp-2">"{bid.lead_text}"</p>
                      </div>
                      {latestRevision && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-1">Generated Bid (Latest Revision):</h4>
                          <textarea 
                            readOnly 
                            value={latestRevision.content}
                            className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded p-3 h-32 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: KNOWLEDGE BASE (ADMIN) --- */}
        {activeTab === 'kb' && role === 'admin' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="text-xl font-bold mb-2">Upload Past Projects (CSV)</h3>
            <p className="text-gray-500 text-sm mb-6">Upload a CSV containing your company's past successful projects. This trains the AI on your history.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 mb-4">
              <input 
                type="file" accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
              />
            </div>
            
            <button 
              onClick={handleUpload} disabled={!file || isUploading}
              className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isUploading ? "Processing & Training AI..." : "Upload & Train AI"}
            </button>
          </div>
        )}

        {/* --- TAB: SETTINGS (ADMIN) --- */}
        {activeTab === 'settings' && role === 'admin' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Global AI Instructions</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Banned Phrases (Comma Separated)</label>
                <textarea 
                  value={settings.banned_phrases}
                  onChange={(e) => setSettings({...settings, banned_phrases: e.target.value})}
                  placeholder="e.g., hope this finds you well, delve, synergy, robust"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">The AI will be strictly instructed to avoid using these cliché phrases.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confidential Keywords (Comma Separated)</label>
                <textarea 
                  value={settings.confidential_keywords}
                  onChange={(e) => setSettings({...settings, confidential_keywords: e.target.value})}
                  placeholder="e.g., budget, project stealth, $"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">Keywords that should trigger a privacy warning.</p>
              </div>

              <button 
                onClick={handleSaveSettings} disabled={isSavingSettings}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSavingSettings ? "Saving..." : "Save Settings to Database"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// --- 3. MAIN APP ROUTER ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}