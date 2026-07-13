import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Copy, Download, Save, Send, LogOut, 
  LayoutDashboard, History, Database, Settings as SettingsIcon, 
  CheckCircle2, AlertCircle, Zap, Printer, Clock, FileText,
  Eye, EyeOff, Users, UserCheck, UserX,
  Target, Trophy, XCircle, TrendingUp // <-- THESE WERE MISSING!
} from 'lucide-react';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .click-flash { position: relative; overflow: hidden; }
    .click-flash::after {
      content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.4); opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .click-flash:active::after { opacity: 1; transition: opacity 0s; }
  `}</style>
);

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

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', response.data.username);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.detail || "Google Login failed."); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      try {
        const params = new URLSearchParams(); params.append('username', username); params.append('password', password);
        const response = await axios.post('https://bid-helper-agent.onrender.com/auth/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        localStorage.setItem('token', response.data.access_token); localStorage.setItem('role', response.data.role); localStorage.setItem('username', response.data.username);
        navigate('/dashboard');
      } catch (err) { setError(err.response?.data?.detail || "Login failed."); }
    } else {
      try {
        await axios.post('https://bid-helper-agent.onrender.com/auth/signup', { username, password, role });
        setToast({ message: "Account created! Please log in.", type: "success" });
        setIsLogin(true); setPassword(''); 
      } catch (err) { setError(err.response?.data?.detail || "Sign up failed."); }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-gray-100 relative">
      <GlobalStyles /><AmbientBackground /><Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)] w-[400px] border border-white/5 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)]"><Zap className="text-white w-8 h-8" /></div>
        </div>
        <h2 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          {isLogin ? "Welcome Back" : "Initialize Agent"}
        </h2>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"><AlertCircle size={18}/>{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none text-white placeholder-gray-600 shadow-inner" required />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 pr-12 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none text-white placeholder-gray-600 shadow-inner" 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
          
          <button type="submit" className="click-flash active:scale-[0.98] w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all mt-4 text-lg">
            {isLogin ? "Access System" : "Create Profile"}
          </button>
        </form>
        
        <div className="mt-8 flex items-center justify-between opacity-50"><hr className="w-full border-gray-700" /><span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span><hr className="w-full border-gray-700" /></div>
        <div className="mt-8 flex justify-center click-flash active:scale-[0.98] rounded-full transition-transform"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="filled_black" shape="pill" size="large" text="continue_with" /></div>
        <div className="mt-8 text-center text-sm text-gray-400 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">{isLogin ? "Sign Up" : "Log In"}</button>
        </div>
      </div>
    </div>
  );
}

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

  // Generation States
  const [leadText, setLeadText] = useState('');
  const [tone, setTone] = useState('Professional');
  const [size, setSize] = useState('Medium');
  const [projectCategory, setProjectCategory] = useState('General / Other');
  const [wordCountTarget, setWordCountTarget] = useState(''); 
  const [generatedBid, setGeneratedBid] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  // History States
  const [historyBids, setHistoryBids] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Settings & KB States
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState({ banned_phrases: '', confidential_keywords: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Users States
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);
  
  useEffect(() => {
    if (activeTab === 'settings' && role === 'admin') loadSettings();
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'users' && role === 'admin') loadUsers(); 
  }, [activeTab]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const handleGenerate = async () => {
    if (!leadText.trim()) return showToast("Please enter a job lead!", "error");
    setIsGenerating(true); setGeneratedBid(''); setCurrentGenerationId(null); 
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/bid', 
        { lead_text: leadText, tone, size, project_category: projectCategory, word_count_target: wordCountTarget },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      setGeneratedBid(response.data.content); setCurrentGenerationId(response.data.generation_id); 
      showToast("Bid generated successfully!", "success");
    } catch (error) { showToast("Error generating bid.", "error"); } finally { setIsGenerating(false); }
  };

  const handleAiRevise = async (instruction) => {
    if (!currentGenerationId || !generatedBid) return;
    setIsRevising(true);
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/ai-revise',
        { generation_id: currentGenerationId, current_content: generatedBid, instruction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedBid(response.data.content); showToast(`AI Magic applied: ${instruction}`, "success");
    } catch (error) { showToast("Error revising.", "error"); } finally { setIsRevising(false); }
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
    } catch (error) { showToast("Failed to save revision.", "error"); } finally { setIsSavingRevision(false); }
  };

  // NEW: Microsoft Word Export
  const handleWordExport = () => {
    if (!generatedBid) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Proposal</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + document.getElementById('markdown-render-content').innerHTML + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Proposal_${new Date().toISOString().split('T')[0]}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    showToast("Word Document downloaded!", "success");
  };

  const handleCopy = () => { if (!generatedBid) return; navigator.clipboard.writeText(generatedBid); showToast("Copied to clipboard!", "success"); };

  // UPGRADED: PDF Export with Company Logo Header
  const handlePdfExport = () => {
    if (!generatedBid) return;
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Generated Proposal</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 50px; height: 50px; background: #0ea5e9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 15px; }
            h1, h2, h3 { color: #111; margin-top: 24px; }
            p { margin-bottom: 16px; }
            ul { margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🚀</div>
            <div>
              <h1 style="margin:0; font-size: 24px; color: #0ea5e9;">Your Company Name</h1>
              <p style="margin:0; color: #666; font-weight: bold;">Official Project Proposal</p>
            </div>
          </div>
          ${document.getElementById('markdown-render-content').innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close(); printWindow.focus(); setTimeout(() => { printWindow.print(); }, 250);
  };

  const handleUpload = async () => {
    if (!file) return; setIsUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      await axios.post('https://bid-helper-agent.onrender.com/kb/upload', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      showToast("Success! Projects added.", "success"); setFile(null); 
    } catch (error) { showToast("Upload failed.", "error"); } finally { setIsUploading(false); }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/history/my-bids', { headers: { Authorization: `Bearer ${token}` } });
      setHistoryBids(response.data.bids);
    } catch (error) { showToast("Failed to load history.", "error"); } finally { setIsLoadingHistory(false); }
  };

  // <-- NEW OUTCOME FUNCTION FOR WIN/LOSS TRACKING -->
  const handleSetOutcome = async (bidId, outcome) => {
    try {
      await axios.put(`https://bid-helper-agent.onrender.com/history/${bidId}/outcome`, 
        { outcome: outcome },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Project marked as ${outcome}!`, "success");
      loadHistory(); // Refresh the list to update analytics
    } catch (error) {
      showToast("Failed to update project outcome.", "error");
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/settings/', { headers: { Authorization: `Bearer ${token}` } });
      setSettings({ banned_phrases: response.data.banned_phrases?.join(', ') || '', confidential_keywords: response.data.confidential_keywords?.join(', ') || '' });
    } catch (error) {}
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
    } catch (error) { showToast("Error saving settings.", "error"); } finally { setIsSavingSettings(false); }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsersList(response.data.users);
    } catch (error) { showToast("Failed to load users.", "error"); } finally { setIsLoadingUsers(false); }
  };

  const handleToggleUserStatus = async (targetUsername, currentStatus) => {
    try {
      await axios.put(`https://bid-helper-agent.onrender.com/auth/users/${targetUsername}/status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`User ${targetUsername} status updated.`, "success");
      loadUsers(); 
    } catch (error) { showToast(error.response?.data?.detail || "Failed to update user status.", "error"); }
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`click-flash active:scale-[0.95] flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-gray-500 border border-transparent hover:bg-gray-800/50 hover:text-gray-300'}`}>
      <Icon size={18} className={activeTab === id ? 'text-cyan-400' : 'text-gray-500'} /> {label}
    </button>
  );

  const wordCount = generatedBid ? generatedBid.split(/\s+/).filter(word => word.length > 0).length : 0;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans">
      <GlobalStyles /><AmbientBackground /><Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <nav className="bg-gray-900/40 backdrop-blur-2xl sticky top-0 z-40 border-b border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4"><div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)]"><Zap className="text-white w-6 h-6" /></div><h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Bid Helper Agent</h1></div>
          <div className="flex items-center gap-6"><div className="flex items-center gap-3 bg-gray-950/50 px-5 py-2.5 rounded-xl border border-gray-800 shadow-inner"><span className="text-sm font-medium text-gray-400">Agent: <strong className="text-gray-100">{username}</strong></span>{role === 'admin' && <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs px-2.5 py-1 rounded-lg font-bold">Admin</span>}</div><button onClick={handleLogout} className="click-flash active:scale-95 text-gray-500 hover:text-red-400 transition-colors bg-gray-900/50 p-3 rounded-xl border border-gray-800"><LogOut size={18} /></button></div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex space-x-3 mb-10 bg-gray-900/40 p-2 rounded-3xl inline-flex border border-gray-800 shadow-xl backdrop-blur-xl">
          <TabButton id="generate" icon={LayoutDashboard} label="Generate Engine" />
          <TabButton id="history" icon={History} label="Intelligence Logs" />
          {role === 'admin' && (
            <>
              <TabButton id="users" icon={Users} label="Team Access" />
              <TabButton id="kb" icon={Database} label="Knowledge Base" />
              <TabButton id="settings" icon={SettingsIcon} label="System Rules" />
            </>
          )}
        </div>

        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
            
            {/* Left Column */}
            <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-gray-700/50 flex flex-col h-full min-h-0">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3"><Send className="text-cyan-400" size={24}/> Target Specifications</h3>
              <textarea value={leadText} onChange={(e) => setLeadText(e.target.value)} placeholder="Paste the raw Upwork/Freelancer job description here..." className="w-full flex-grow min-h-0 p-6 bg-gray-950/50 border border-gray-800 rounded-2xl mb-6 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none text-gray-200 outline-none transition-all shadow-inner placeholder-gray-600 font-medium" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Domain</label>
                  <select value={projectCategory} onChange={(e) => setProjectCategory(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-xs font-medium text-gray-300 appearance-none shadow-inner">
                    <option>AI / Machine Learning</option><option>Python / Backend</option><option>Frontend / Web UI</option><option>Full Stack Development</option><option>Mobile App</option><option>General / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Vibe</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-xs font-medium text-gray-300 appearance-none shadow-inner">
                    <option>Professional</option><option>Conversational</option><option>Aggressive/Confident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Output Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-xs font-medium text-gray-300 appearance-none shadow-inner">
                    <option>Short</option><option>Medium</option><option>Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Custom Words</label>
                  <input type="number" placeholder="e.g. 150" value={wordCountTarget} onChange={(e) => setWordCountTarget(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-xs font-medium text-cyan-400 placeholder-gray-600 shadow-inner" />
                </div>
              </div>
              
              <button onClick={handleGenerate} disabled={isGenerating} className="click-flash active:scale-[0.98] w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] transition-all disabled:opacity-50 flex justify-center items-center gap-3 text-lg">
                {isGenerating ? <><Sparkles className="animate-spin" size={24}/> Processing...</> : <><Sparkles size={24}/> Initialize AI Generation</>}
              </button>
            </div>

            {/* Right Column */}
            <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-gray-700/50 flex flex-col h-full min-h-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2"><CheckCircle2 className="text-emerald-400" size={24}/> Output Matrix</h3>
                <div className="flex gap-2">
                  <button onClick={handlePdfExport} disabled={!generatedBid} className="click-flash active:scale-95 flex items-center gap-2 text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 px-3 py-2 rounded-xl disabled:opacity-30"><Printer size={16}/> PDF</button>
                  <button onClick={handleWordExport} disabled={!generatedBid} className="click-flash active:scale-95 flex items-center gap-2 text-xs font-bold bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl disabled:opacity-30"><Download size={16}/> Word (.doc)</button>
                  <button onClick={handleCopy} disabled={!generatedBid} className="click-flash active:scale-95 flex items-center gap-2 text-xs font-bold bg-gray-950/50 border border-gray-800 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-xl disabled:opacity-30"><Copy size={16}/> Copy</button>
                </div>
              </div>

              {generatedBid ? (
                <>
                  <div id="markdown-render-content" className="w-full flex-1 min-h-0 p-6 bg-gray-950/50 border border-gray-800 rounded-2xl overflow-y-auto shadow-inner break-words whitespace-pre-wrap
                  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full 
                  [&>h1]:text-2xl [&>h1]:font-extrabold [&>h1]:mb-4 [&>h1]:text-white [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:text-gray-100 
                  [&>p]:mb-5 [&>p]:leading-relaxed [&>p]:text-gray-300 [&>p]:text-base [&>p]:font-medium
                  [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul>li]:text-gray-300 [&>ul>li]:mb-2 [&>ul>li]:font-medium [&>strong]:font-extrabold [&>strong]:text-cyan-400">
                    <ReactMarkdown>{generatedBid}</ReactMarkdown>
                  </div>
                  <div className="flex gap-6 mt-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">
                    <div className="flex items-center gap-2"><FileText size={14} className="text-cyan-500/70" /> {wordCount} Words</div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-indigo-500/70" /> ~{readTime} Min Read</div>
                  </div>
                </>
              ) : (
                <div className="w-full flex-1 min-h-0 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-gray-950/30 gap-5 shadow-inner">
                  <Sparkles size={56} className="text-gray-700 opacity-50" />
                  <span className="font-semibold text-lg tracking-wide">Awaiting instructions...</span>
                </div>
              )}

              {generatedBid && (
                <div className="mt-6 space-y-4 shrink-0">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleAiRevise("Make this much shorter and more concise.")} disabled={isRevising} className="click-flash active:scale-95 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold py-2 px-4 rounded-xl border border-indigo-500/30 disabled:opacity-30"><Sparkles size={14}/> Compact</button>
                    <button onClick={() => handleAiRevise("Make the tone more aggressive, confident, and persuasive.")} disabled={isRevising} className="click-flash active:scale-95 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold py-2 px-4 rounded-xl border border-purple-500/30 disabled:opacity-30"><Sparkles size={14}/> Aggressive</button>
                    <button onClick={() => handleAiRevise("Fix any grammar mistakes and polish the language to be perfectly professional.")} disabled={isRevising} className="click-flash active:scale-95 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold py-2 px-4 rounded-xl border border-cyan-500/30 disabled:opacity-30"><Sparkles size={14}/> Polish</button>
                  </div>
                  <button onClick={handleSaveRevision} disabled={isSavingRevision} className="click-flash active:scale-[0.98] w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold py-3 px-4 rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-3">
                     <Save size={18}/> {isSavingRevision ? "Committing..." : "Save Configuration to Logs"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50">
            <div className="flex items-center gap-4 mb-10"><History className="text-cyan-400 w-10 h-10"/><h3 className="text-3xl font-extrabold text-white tracking-tight">Intelligence Logs & Analytics</h3></div>
            
            {/* ANALYTICS DASHBOARD */}
            {!isLoadingHistory && historyBids.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-gray-950/50 border border-gray-800 p-5 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                  <Target className="text-indigo-400 mb-2" size={28}/>
                  <span className="text-3xl font-extrabold text-white">{historyBids.length}</span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Total Bids</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                  <Trophy className="text-emerald-400 mb-2" size={28}/>
                  <span className="text-3xl font-extrabold text-emerald-400">{historyBids.filter(b => b.outcome_tag === 'Won').length}</span>
                  <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Projects Won</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                  <XCircle className="text-red-400 mb-2" size={28}/>
                  <span className="text-3xl font-extrabold text-red-400">{historyBids.filter(b => b.outcome_tag === 'Lost').length}</span>
                  <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest mt-1">Projects Lost</span>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-5 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                  <TrendingUp className="text-cyan-400 mb-2" size={28}/>
                  <span className="text-3xl font-extrabold text-cyan-400">
                    {historyBids.filter(b => b.outcome_tag === 'Won').length + historyBids.filter(b => b.outcome_tag === 'Lost').length > 0 
                      ? Math.round((historyBids.filter(b => b.outcome_tag === 'Won').length / (historyBids.filter(b => b.outcome_tag === 'Won').length + historyBids.filter(b => b.outcome_tag === 'Lost').length)) * 100) 
                      : 0}%
                  </span>
                  <span className="text-xs font-bold text-cyan-500/70 uppercase tracking-widest mt-1">Win Rate</span>
                </div>
              </div>
            )}

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
                        <p className="text-sm text-gray-400 bg-gray-900/50 border border-gray-800 p-5 rounded-2xl line-clamp-3 leading-relaxed font-medium">"{bid.lead_text}"</p>
                      </div>
                      {latestRevision && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">Final Output <CheckCircle2 size={14} className="text-emerald-500"/></h4>
                          <div className="w-full text-sm text-gray-300 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-64 overflow-y-auto shadow-inner [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                             <ReactMarkdown>{latestRevision.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      {/* WIN/LOSS BUTTONS */}
                      <div className="mt-6 pt-6 border-t border-gray-800 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Outcome:</span>
                        <div className="flex gap-3">
                          {bid.outcome_tag === 'Won' ? (
                            <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-bold text-sm border border-emerald-500/40"><Trophy size={16}/> Deal Won</span>
                          ) : bid.outcome_tag === 'Lost' ? (
                            <span className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-xl font-bold text-sm border border-red-500/40"><XCircle size={16}/> Deal Lost</span>
                          ) : (
                            <>
                              <button onClick={() => handleSetOutcome(bid._id, 'Won')} className="click-flash active:scale-95 flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-400 transition-all px-4 py-2 rounded-xl font-bold text-sm">
                                <Trophy size={16}/> Mark as Won
                              </button>
                              <button onClick={() => handleSetOutcome(bid._id, 'Lost')} className="click-flash active:scale-95 flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all px-4 py-2 rounded-xl font-bold text-sm">
                                <XCircle size={16}/> Mark as Lost
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: USERS (ADMIN) --- */}
        {activeTab === 'users' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50 max-w-4xl mx-auto">
             <div className="flex items-center gap-4 mb-10"><Users className="text-cyan-400 w-10 h-10"/><h3 className="text-3xl font-extrabold text-white tracking-tight">Team Access Matrix</h3></div>
             {isLoadingUsers ? (
               <div className="flex justify-center py-20"><Zap className="animate-pulse text-cyan-500" size={40}/></div>
             ) : (
               <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/30">
                  <table className="w-full text-left text-sm text-gray-400">
                     <thead className="bg-gray-900/80 text-xs uppercase text-gray-500 border-b border-gray-800 font-extrabold tracking-widest">
                        <tr>
                           <th className="px-6 py-5">Username</th>
                           <th className="px-6 py-5">Role</th>
                           <th className="px-6 py-5">Join Date</th>
                           <th className="px-6 py-5 text-center">System Access</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 font-medium">
                        {usersList.map((u) => (
                           <tr key={u.id} className="hover:bg-gray-900/30 transition-colors">
                              <td className="px-6 py-5 text-gray-200">{u.username}</td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
                                  {u.role.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-5">{new Date(u.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-5 text-center">
                                {u.username === username ? (
                                  <span className="text-xs text-gray-600 font-bold uppercase">Current User</span>
                                ) : (
                                  <button 
                                    onClick={() => handleToggleUserStatus(u.username, u.is_active)}
                                    className={`click-flash active:scale-95 flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-bold transition-all border ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'}`}
                                  >
                                    {u.is_active ? <><UserCheck size={16}/> Active</> : <><UserX size={16}/> Locked Out</>}
                                  </button>
                                )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             )}
          </div>
        )}

        {/* --- TAB: KNOWLEDGE BASE (ADMIN) --- */}
        {activeTab === 'kb' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-gray-700/50 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6"><Database className="text-cyan-400 w-10 h-10"/><h3 className="text-3xl font-extrabold text-white tracking-tight">Data Matrix</h3></div>
            <p className="text-gray-400 text-base font-medium mb-10 leading-relaxed">Upload a CSV containing your company's past successful projects.</p>
            <div className="border-2 border-dashed border-gray-700 rounded-3xl p-12 text-center bg-gray-950/50 mb-8 hover:border-cyan-500/50 hover:bg-gray-900/80 transition-all group">
              <Database className="mx-auto text-gray-600 group-hover:text-cyan-500/50 mb-6 w-16 h-16 transition-colors" />
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-gray-400 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-500/10 file:text-cyan-400 file:border file:border-cyan-500/30 hover:file:bg-cyan-500/20 cursor-pointer" />
            </div>
            <button onClick={handleUpload} disabled={!file || isUploading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 flex justify-center items-center gap-3 text-lg">
              {isUploading ? <><Sparkles className="animate-spin"/> Initializing...</> : <><Database/> Train Neural Network</>}
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
                <textarea value={settings.banned_phrases} onChange={(e) => setSettings({...settings, banned_phrases: e.target.value})} placeholder="e.g., hope this finds you well, delve, synergy, robust" className="w-full p-5 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-gray-200 shadow-inner resize-none font-medium" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-gray-300 mb-3 tracking-wide">Restricted Entities (Alerts)</label>
                <textarea value={settings.confidential_keywords} onChange={(e) => setSettings({...settings, confidential_keywords: e.target.value})} placeholder="e.g., internal budget, stealth, confidential" className="w-full p-5 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-gray-200 shadow-inner resize-none font-medium" rows="3" />
              </div>
              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] disabled:opacity-50 flex justify-center items-center gap-3 text-lg">
                <Save/> {isSavingSettings ? "Saving..." : "Lock Protocols"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

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