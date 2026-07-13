import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Copy, Download, Save, Send, LogOut, 
  LayoutDashboard, History, Database, Settings as SettingsIcon, 
  CheckCircle2, AlertCircle, Zap
} from 'lucide-react';

// --- PREMIUM TOAST COMPONENT ---
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed bottom-6 right-6 ${isError ? 'bg-red-500/90 border-red-500/50' : 'bg-emerald-500/90 border-emerald-500/50'} backdrop-blur-xl border text-white px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center gap-3 z-50 animate-bounce-in`}>
      {isError ? <AlertCircle size={20} className="text-white" /> : <CheckCircle2 size={20} className="text-white" />}
      <span className="font-semibold tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-4 text-white/70 hover:text-white font-bold text-xl transition-colors">&times;</button>
    </div>
  );
}

// --- AMBIENT BACKGROUND COMPONENT ---
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[150px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
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
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-gray-100 relative selection:bg-cyan-500/30">
      <AmbientBackground />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)] w-[400px] border border-white/5 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            <Zap className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
          {isLogin ? "Welcome Back" : "Initialize Agent"}
        </h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"><AlertCircle size={18}/>{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none text-white placeholder-gray-600 shadow-inner" required minLength="3" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none text-white placeholder-gray-600 shadow-inner" required minLength="6" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none text-white shadow-inner appearance-none">
                <option value="admin">Admin</option>
                <option value="team">Team Member</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transform hover:-translate-y-1 transition-all duration-200 mt-4 text-lg">
            {isLogin ? "Access System" : "Create Profile"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between opacity-50">
          <hr className="w-full border-gray-700" />
          <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
          <hr className="w-full border-gray-700" />
        </div>
        
        <div className="mt-8 flex justify-center transform hover:-translate-y-0.5 transition-all duration-200">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="filled_black" shape="pill" size="large" text="continue_with" />
        </div>

        <div className="mt-8 text-center text-sm text-gray-400 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
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
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-gray-500 border border-transparent hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-700/50'}`}
    >
      <Icon size={18} className={activeTab === id ? 'text-cyan-400' : 'text-gray-500'} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans selection:bg-cyan-500/30">
      <AmbientBackground />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Premium Glass Navbar */}
      <nav className="bg-gray-900/40 backdrop-blur-2xl sticky top-0 z-40 border-b border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Bid Helper Agent</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-950/50 px-5 py-2.5 rounded-xl border border-gray-800 shadow-inner">
              <span className="text-sm font-medium text-gray-400">Agent: <strong className="text-gray-100">{username}</strong></span>
              {role === 'admin' && <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs px-2.5 py-1 rounded-lg font-bold tracking-widest uppercase">Admin</span>}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-400 transition-colors bg-gray-900/50 p-3 rounded-xl border border-gray-800 hover:border-red-500/30">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Futuristic Tabs */}
        <div className="flex space-x-3 mb-10 bg-gray-900/40 p-2 rounded-3xl inline-flex border border-gray-800 shadow-xl backdrop-blur-xl">
          <TabButton id="generate" icon={LayoutDashboard} label="Generate Engine" />
          <TabButton id="history" icon={History} label="Intelligence Logs" />
          {role === 'admin' && (
            <>
              <TabButton id="kb" icon={Database} label="Knowledge Base" />
              <TabButton id="settings" icon={SettingsIcon} label="System Rules" />
            </>
          )}
        </div>

        {/* --- TAB: GENERATE BID --- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
            
            {/* Left Column: Input */}
            <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-gray-700/50 flex flex-col h-full">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
                <Send className="text-cyan-400" size={24}/> Target Specifications
              </h3>
              <textarea 
                value={leadText} onChange={(e) => setLeadText(e.target.value)}
                placeholder="Paste the raw Upwork/Freelancer job description here..."
                className="w-full flex-grow p-6 bg-gray-950/50 border border-gray-800 rounded-2xl mb-8 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none text-gray-200 outline-none transition-all shadow-inner placeholder-gray-600 leading-relaxed"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Domain</label>
                  <select value={projectCategory} onChange={(e) => setProjectCategory(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium text-gray-300 appearance-none shadow-inner">
                    <option>AI / Machine Learning</option>
                    <option>Python / Backend</option>
                    <option>Frontend / Web UI</option>
                    <option>Full Stack Development</option>
                    <option>Mobile App Development</option>
                    <option>General / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Vibe</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium text-gray-300 appearance-none shadow-inner">
                    <option>Professional</option>
                    <option>Conversational</option>
                    <option>Aggressive/Confident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Output Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium text-gray-300 appearance-none shadow-inner">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long & Detailed</option>
                  </select>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] transform hover:-translate-y-1 transition-all duration-300 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-3 text-lg">
                {isGenerating ? <><Sparkles className="animate-spin" size={24}/> Processing Neural Core...</> : <><Sparkles size={24}/> Initialize AI Generation</>}
              </button>
            </div>

            {/* Right Column: Output with Markdown */}
            <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-gray-700/50 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2"><CheckCircle2 className="text-emerald-400" size={24}/> Output Matrix</h3>
                <div className="flex gap-3">
                  <button onClick={handleCopy} disabled={!generatedBid} className="flex items-center gap-2 text-sm font-bold bg-gray-950/50 border border-gray-800 hover:bg-gray-800 hover:border-gray-600 text-gray-300 px-5 py-2.5 rounded-xl disabled:opacity-30 transition-all shadow-inner"><Copy size={16}/> Copy</button>
                  <button onClick={handleDownload} disabled={!generatedBid} className="flex items-center gap-2 text-sm font-bold bg-gray-950/50 border border-gray-800 hover:bg-gray-800 hover:border-gray-600 text-gray-300 px-5 py-2.5 rounded-xl disabled:opacity-30 transition-all shadow-inner"><Download size={16}/> .txt</button>
                </div>
              </div>

              {generatedBid ? (
                /* MARKDOWN RENDERER - DARK MODE OPTIMIZED */
                <div className="w-full flex-grow p-8 bg-gray-950/50 border border-gray-800 rounded-2xl overflow-y-auto shadow-inner 
                [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full 
                [&>h1]:text-2xl [&>h1]:font-extrabold [&>h1]:mb-4 [&>h1]:text-white [&>h1]:tracking-tight
                [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:text-gray-100 
                [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:text-gray-200 
                [&>p]:mb-5 [&>p]:leading-relaxed [&>p]:text-gray-300 [&>p]:text-base
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul>li]:text-gray-300 [&>ul>li]:mb-2 
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol>li]:text-gray-300 [&>ol>li]:mb-2
                [&>strong]:font-extrabold [&>strong]:text-cyan-400">
                  <ReactMarkdown>{generatedBid}</ReactMarkdown>
                </div>
              ) : (
                <div className="w-full flex-grow border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-gray-950/30 gap-5 shadow-inner">
                  <Sparkles size={56} className="text-gray-700 opacity-50" />
                  <span className="font-semibold text-lg tracking-wide">Awaiting instructions...</span>
                </div>
              )}

              {generatedBid && (
                <div className="mt-8 space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">AI Post-Processing</span>
                    {isRevising && <span className="text-xs text-cyan-400 animate-pulse font-bold flex items-center gap-2"><Zap size={14}/> Rewriting Vectors...</span>}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => handleAiRevise("Make this much shorter and more concise.")} disabled={isRevising} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-bold py-3 px-5 rounded-xl border border-indigo-500/30 disabled:opacity-30 transition-all flex items-center gap-2 shadow-inner"><Sparkles size={16}/> Compact</button>
                    <button onClick={() => handleAiRevise("Make the tone more aggressive, confident, and persuasive.")} disabled={isRevising} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-bold py-3 px-5 rounded-xl border border-purple-500/30 disabled:opacity-30 transition-all flex items-center gap-2 shadow-inner"><Sparkles size={16}/> Aggressive</button>
                    <button onClick={() => handleAiRevise("Fix any grammar mistakes and polish the language to be perfectly professional.")} disabled={isRevising} className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-bold py-3 px-5 rounded-xl border border-cyan-500/30 disabled:opacity-30 transition-all flex items-center gap-2 shadow-inner"><Sparkles size={16}/> Polish Grammar</button>
                  </div>
                  <button onClick={handleSaveRevision} disabled={isSavingRevision} className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold py-4 px-4 rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-3 mt-4 shadow-inner text-lg tracking-wide">
                     <Save size={20}/> {isSavingRevision ? "Committing to Logs..." : "Save Configuration to Logs"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50">
            <h3 className="text-2xl font-extrabold mb-10 text-white flex items-center gap-3"><History className="text-cyan-400 w-8 h-8"/> Intelligence Logs</h3>
            {isLoadingHistory ? (
              <div className="flex justify-center py-20"><Zap className="animate-pulse text-cyan-500" size={40}/></div>
            ) : historyBids.length === 0 ? (
              <div className="text-center py-24 text-gray-500 font-medium text-lg">No tactical data found. Initialize the generate engine to begin.</div>
            ) : (
              <div className="space-y-8">
                {historyBids.map((bid) => {
                  const latestRevision = bid.revisions && bid.revisions.length > 0 ? bid.revisions[bid.revisions.length - 1] : null;
                  return (
                    <div key={bid._id} className="bg-gray-950/50 border border-gray-800 rounded-3xl p-8 shadow-inner hover:border-cyan-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-3 flex-wrap">
                          <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full border border-indigo-500/20">{bid.tone}</span>
                          <span className="bg-purple-500/10 text-purple-300 text-xs font-bold px-4 py-1.5 rounded-full border border-purple-500/20">{bid.size}</span>
                          <span className="bg-cyan-500/10 text-cyan-300 text-xs font-bold px-4 py-1.5 rounded-full border border-cyan-500/20">{bid.project_category || 'General'}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500 tracking-widest">{new Date(bid.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Target Description</h4>
                        <p className="text-sm text-gray-400 bg-gray-900/50 border border-gray-800 p-5 rounded-2xl line-clamp-3 leading-relaxed">"{bid.lead_text}"</p>
                      </div>
                      {latestRevision && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">Final Output <CheckCircle2 size={14} className="text-emerald-500"/></h4>
                          <div className="w-full text-base text-gray-300 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-64 overflow-y-auto shadow-inner 
                          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full 
                          [&>h3]:font-bold [&>h3]:text-lg [&>h3]:text-white [&>ul]:list-disc [&>ul]:pl-5 [&>strong]:text-cyan-400 [&>p]:mb-3">
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
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6"><Database className="text-cyan-400 w-10 h-10"/><h3 className="text-3xl font-extrabold text-white tracking-tight">Data Matrix</h3></div>
            <p className="text-gray-400 text-base font-medium mb-10 leading-relaxed">Upload a CSV containing your company's past successful projects. This data is securely converted into a Vector Database to teach the neural network how your company operates.</p>
            
            <div className="border-2 border-dashed border-gray-700 rounded-3xl p-12 text-center bg-gray-950/50 mb-8 hover:border-cyan-500/50 hover:bg-gray-900/80 transition-all group">
              <Database className="mx-auto text-gray-600 group-hover:text-cyan-500/50 mb-6 w-16 h-16 transition-colors" />
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-gray-400 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-500/10 file:text-cyan-400 file:border file:border-cyan-500/30 hover:file:bg-cyan-500/20 cursor-pointer transition-all" />
            </div>
            
            <button onClick={handleUpload} disabled={!file || isUploading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 transition-all flex justify-center items-center gap-3 text-lg">
              {isUploading ? <><Sparkles className="animate-spin"/> Initializing Vectors...</> : <><Database/> Train Neural Network</>}
            </button>
          </div>
        )}

        {/* --- TAB: SETTINGS (ADMIN) --- */}
        {activeTab === 'settings' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50 max-w-2xl mx-auto">
             <div className="flex items-center gap-4 mb-10"><SettingsIcon className="text-cyan-400 w-10 h-10"/><h3 className="text-3xl font-extrabold text-white tracking-tight">System Protocols</h3></div>
            
            <div className="space-y-10">
              <div>
                <label className="block text-sm font-extrabold text-gray-300 mb-3 tracking-wide">Banned Lexicon (Clichés)</label>
                <textarea value={settings.banned_phrases} onChange={(e) => setSettings({...settings, banned_phrases: e.target.value})} placeholder="e.g., hope this finds you well, delve, synergy, robust" className="w-full p-5 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-gray-200 shadow-inner resize-none placeholder-gray-600" rows="3" />
                <p className="text-xs text-red-400/80 mt-3 font-bold flex items-center gap-2 uppercase tracking-wider"><AlertCircle size={14}/> Neural net strictly blocked from these tokens.</p>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-gray-300 mb-3 tracking-wide">Restricted Entities (Alerts)</label>
                <textarea value={settings.confidential_keywords} onChange={(e) => setSettings({...settings, confidential_keywords: e.target.value})} placeholder="e.g., internal budget, stealth, confidential" className="w-full p-5 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-gray-200 shadow-inner resize-none placeholder-gray-600" rows="3" />
                <p className="text-xs text-gray-500 mt-3 font-bold flex items-center gap-2 uppercase tracking-wider"><AlertCircle size={14}/> Triggers warning if pasted in input.</p>
              </div>

              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] disabled:opacity-50 transition-all flex justify-center items-center gap-3 text-lg">
                <Save/> {isSavingSettings ? "Saving..." : "Lock Protocols"}
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