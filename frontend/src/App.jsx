import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Copy, Download, Save, Send, LogOut, 
  LayoutDashboard, History, Database, Settings as SettingsIcon, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';

// --- PREMIUM TOAST COMPONENT ---
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed bottom-6 right-6 ${isError ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce-in`}>
      {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span className="font-semibold tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 font-bold text-xl">&times;</button>
    </div>
  );
}

// --- 1. AUTH COMPONENT ---
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/auth/google', {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', response.data.username);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Google Login failed.");
    }
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
        setError(err.response?.data?.detail || "Login failed.");
      }
    } else {
      try {
        await axios.post('https://bid-helper-agent.onrender.com/auth/signup', { username, password, role });
        showToast("Account created! Please log in.", "success");
        setIsLogin(true); setPassword(''); 
      } catch (err) {
        setError(err.response?.data?.detail || "Sign up failed.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-[400px] border border-white">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Sparkles className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800 tracking-tight">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-6 text-sm flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" required minLength="3" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" required minLength="6" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="admin">Admin</option>
                <option value="team">Team Member</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <hr className="w-full border-gray-200" />
          <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">OR</span>
          <hr className="w-full border-gray-200" />
        </div>
        
        <div className="mt-6 flex justify-center transform hover:-translate-y-0.5 transition-all duration-200">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} shape="rectangular" theme="filled_blue" size="large" text="continue_with" />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">
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

  const [activeTab, setActiveTab] = useState('generate');
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const [leadText, setLeadText] = useState('');
  const [tone, setTone] = useState('Professional');
  const [size, setSize] = useState('Medium');
  const [projectCategory, setProjectCategory] = useState('General / Other');
  const [generatedBid, setGeneratedBid] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  const [historyBids, setHistoryBids] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState({ banned_phrases: '', confidential_keywords: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  useEffect(() => {
    if (activeTab === 'settings' && role === 'admin') loadSettings();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const handleGenerate = async () => {
    if (!leadText.trim()) return showToast("Please enter a job lead!", "error");
    setIsGenerating(true); setGeneratedBid(''); setCurrentGenerationId(null); 
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/bid', 
        { lead_text: leadText, tone, size, project_category: projectCategory },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      setGeneratedBid(response.data.content);
      setCurrentGenerationId(response.data.generation_id); 
      showToast("Bid generated successfully!", "success");
    } catch (error) {
      showToast(error.response?.data?.detail || "Error generating bid.", "error");
    } finally { setIsGenerating(false); }
  };

  const handleAiRevise = async (instruction) => {
    if (!currentGenerationId || !generatedBid) return;
    setIsRevising(true);
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/ai-revise',
        { generation_id: currentGenerationId, current_content: generatedBid, instruction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedBid(response.data.content);
      showToast(`AI Magic applied: ${instruction}`, "success");
    } catch (error) { showToast("Error revising.", "error");
    } finally { setIsRevising(false); }
  };

  const handleSaveRevision = async () => {
    if (!currentGenerationId) return;
    setIsSavingRevision(true);
    try {
      await axios.post(`https://bid-helper-agent.onrender.com/history/${currentGenerationId}/revise`,
        { content: generatedBid, action_type: 'manual_edit' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Manual edit saved to History!", "success");
    } catch (error) { showToast("Failed to save revision.", "error");
    } finally { setIsSavingRevision(false); }
  };

  const handleDownload = () => {
    if (!generatedBid) return;
    const blob = new Blob([generatedBid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Bid_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast("File downloaded!", "success");
  };

  const handleCopy = () => {
    if (!generatedBid) return;
    navigator.clipboard.writeText(generatedBid);
    showToast("Copied to clipboard!", "success");
  };

  const handleUpload = async () => {
    if (!file) return showToast("Please select a CSV file.", "error");
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/kb/upload', formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      showToast(`Success! ${response.data.total_projects_found} projects added.`, "success");
      setFile(null); 
    } catch (error) { showToast(error.response?.data?.detail || "Upload failed.", "error");
    } finally { setIsUploading(false); }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/history/my-bids', { headers: { Authorization: `Bearer ${token}` } });
      setHistoryBids(response.data.bids);
    } catch (error) { showToast("Failed to load history.", "error");
    } finally { setIsLoadingHistory(false); }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/settings/', { headers: { Authorization: `Bearer ${token}` } });
      setSettings({ banned_phrases: response.data.banned_phrases?.join(', ') || '', confidential_keywords: response.data.confidential_keywords?.join(', ') || '' });
    } catch (error) { showToast("Failed to load settings.", "error"); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const formatted = {
        active_llm_provider: "openai", daily_generation_limit_per_user: 50,
        banned_phrases: settings.banned_phrases.split(',').map(s => s.trim()).filter(Boolean),
        confidential_keywords: settings.confidential_keywords.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.put('https://bid-helper-agent.onrender.com/settings/', formatted, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Settings saved!", "success");
    } catch (error) { showToast("Error saving settings.", "error");
    } finally { setIsSavingSettings(false); }
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/50">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Premium Glass Navbar */}
      <nav className="bg-white/70 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-800 tracking-tight">Bid Helper Agent</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <span className="text-sm font-medium text-gray-500">Hi, <strong className="text-gray-800">{username}</strong></span>
              {role === 'admin' && <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">Admin</span>}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Pill Tabs */}
        <div className="flex space-x-2 mb-8 bg-white/50 p-1.5 rounded-full inline-flex border border-gray-200/50 shadow-sm backdrop-blur-sm">
          <TabButton id="generate" icon={LayoutDashboard} label="Generate Bid" />
          <TabButton id="history" icon={History} label="History" />
          {role === 'admin' && (
            <>
              <TabButton id="kb" icon={Database} label="Knowledge Base" />
              <TabButton id="settings" icon={SettingsIcon} label="Settings" />
            </>
          )}
        </div>

        {/* --- TAB: GENERATE BID --- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
            
            {/* Left Column: Input */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white flex flex-col h-full">
              <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                <Send className="text-indigo-500" size={24}/> Lead Details
              </h3>
              <textarea 
                value={leadText} onChange={(e) => setLeadText(e.target.value)}
                placeholder="Paste the Upwork/Freelancer job description here... Make it detailed!"
                className="w-full flex-grow p-5 bg-gray-50/50 border border-gray-200 rounded-2xl mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-base outline-none transition-all shadow-inner"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={projectCategory} onChange={(e) => setProjectCategory(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
                    <option>AI / Machine Learning</option>
                    <option>Python / Backend</option>
                    <option>Frontend / Web UI</option>
                    <option>Full Stack Development</option>
                    <option>Mobile App Development</option>
                    <option>General / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
                    <option>Professional</option>
                    <option>Conversational</option>
                    <option>Aggressive/Confident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Length</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long & Detailed</option>
                  </select>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-3 text-lg">
                {isGenerating ? <><Sparkles className="animate-spin" size={24}/> Generating Magic...</> : <><Sparkles size={24}/> Generate Custom Bid</>}
              </button>
            </div>

            {/* Right Column: Output with Markdown */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-800">Generated Output</h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} disabled={!generatedBid} className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 px-4 py-2 rounded-xl disabled:opacity-50 transition-all shadow-sm"><Copy size={16}/> Copy</button>
                  <button onClick={handleDownload} disabled={!generatedBid} className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 px-4 py-2 rounded-xl disabled:opacity-50 transition-all shadow-sm"><Download size={16}/> Save .txt</button>
                </div>
              </div>

              {generatedBid ? (
                /* Feature 5: MARKDOWN RENDERER ENABLED HERE */
                <div className="w-full flex-grow p-6 bg-gray-50/50 border border-gray-200 rounded-2xl overflow-y-auto shadow-inner [&>h1]:text-2xl [&>h1]:font-extrabold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>strong]:font-bold [&>strong]:text-indigo-900">
                  <ReactMarkdown>{generatedBid}</ReactMarkdown>
                </div>
              ) : (
                <div className="w-full flex-grow border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 gap-4">
                  <Sparkles size={48} className="text-gray-300 opacity-50" />
                  <span className="font-medium">Your AI-formatted bid will appear here.</span>
                </div>
              )}

              {generatedBid && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Revisions</span>
                    {isRevising && <span className="text-xs text-indigo-600 animate-pulse font-bold flex items-center gap-1"><Sparkles size={12}/> AI is rewriting...</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleAiRevise("Make this much shorter and more concise.")} disabled={isRevising} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold py-2.5 px-4 rounded-xl border border-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"><Sparkles size={16}/> Make Shorter</button>
                    <button onClick={() => handleAiRevise("Make the tone more aggressive, confident, and persuasive.")} disabled={isRevising} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold py-2.5 px-4 rounded-xl border border-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"><Sparkles size={16}/> Make Aggressive</button>
                    <button onClick={() => handleAiRevise("Fix any grammar mistakes and polish the language to be perfectly professional.")} disabled={isRevising} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold py-2.5 px-4 rounded-xl border border-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"><Sparkles size={16}/> Fix Grammar</button>
                  </div>
                  <button onClick={handleSaveRevision} disabled={isSavingRevision} className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 px-4 rounded-xl hover:bg-green-100 hover:border-green-300 disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-2 shadow-sm">
                     <Save size={18}/> {isSavingRevision ? "Saving..." : "Save Edit to History"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white">
            <h3 className="text-2xl font-extrabold mb-8 text-gray-800 flex items-center gap-3"><History className="text-indigo-500"/> Your Past Generated Bids</h3>
            {isLoadingHistory ? (
              <div className="flex justify-center py-10"><Sparkles className="animate-spin text-indigo-500" size={32}/></div>
            ) : historyBids.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-medium">No bids generated yet. Time to win some projects!</div>
            ) : (
              <div className="space-y-6">
                {historyBids.map((bid) => {
                  const latestRevision = bid.revisions && bid.revisions.length > 0 ? bid.revisions[bid.revisions.length - 1] : null;
                  return (
                    <div key={bid._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 flex-wrap">
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">{bid.tone}</span>
                          <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-100">{bid.size}</span>
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">{bid.project_category || 'General'}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{new Date(bid.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Original Lead</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 p-4 rounded-xl line-clamp-2">"{bid.lead_text}"</p>
                      </div>
                      {latestRevision && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">Final Bid Output <CheckCircle2 size={14} className="text-green-500"/></h4>
                          {/* MARKDOWN IN HISTORY TOO! */}
                          <div className="w-full text-sm text-gray-800 bg-white border border-gray-100 rounded-xl p-5 h-48 overflow-y-auto prose prose-sm max-w-none shadow-inner [&>h3]:font-bold [&>h3]:text-base [&>ul]:list-disc [&>ul]:pl-5 [&>strong]:text-indigo-900">
                             <ReactMarkdown>{latestRevision.content}</ReactMarkdown>
                          </div>
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
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4"><Database className="text-indigo-500 w-8 h-8"/><h3 className="text-2xl font-extrabold text-gray-800">Knowledge Base Training</h3></div>
            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">Upload a CSV containing your company's past successful projects. This data is securely converted into a Vector Database to teach the AI how your company solves problems.</p>
            
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center bg-indigo-50/30 mb-6 hover:bg-indigo-50/50 transition-colors">
              <Database className="mx-auto text-indigo-300 mb-4 w-12 h-12" />
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer transition-colors" />
            </div>
            
            <button onClick={handleUpload} disabled={!file || isUploading} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex justify-center items-center gap-3 text-lg">
              {isUploading ? <><Sparkles className="animate-spin"/> Processing Vectors...</> : <><Database/> Upload & Train AI Vector DB</>}
            </button>
          </div>
        )}

        {/* --- TAB: SETTINGS (ADMIN) --- */}
        {activeTab === 'settings' && role === 'admin' && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white max-w-2xl mx-auto">
             <div className="flex items-center gap-3 mb-8"><SettingsIcon className="text-indigo-500 w-8 h-8"/><h3 className="text-2xl font-extrabold text-gray-800">Global AI Rules</h3></div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-extrabold text-gray-700 mb-2">Banned Phrases (Clichés)</label>
                <textarea value={settings.banned_phrases} onChange={(e) => setSettings({...settings, banned_phrases: e.target.value})} placeholder="e.g., hope this finds you well, delve, synergy, robust" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-inner resize-none" rows="3" />
                <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1"><AlertCircle size={12}/> The AI will be strictly blocked from using these words.</p>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-gray-700 mb-2">Confidential Keywords (Alerts)</label>
                <textarea value={settings.confidential_keywords} onChange={(e) => setSettings({...settings, confidential_keywords: e.target.value})} placeholder="e.g., internal budget, stealth, confidential" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-inner resize-none" rows="3" />
                <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1"><AlertCircle size={12}/> Future feature: Warns users if they paste these words.</p>
              </div>

              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex justify-center items-center gap-2 text-lg">
                <Save/> {isSavingSettings ? "Saving..." : "Save Global Settings"}
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
  const clientId = "742455468037-15nrh5etl1r764tu66958coe6437rs4m.apps.googleusercontent.com";
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}