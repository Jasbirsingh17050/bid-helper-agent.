import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import MDEditor from '@uiw/react-md-editor';
import { 
  Eye, EyeOff, Users, UserCheck, UserX, Trophy, XCircle, TrendingUp, Target, Award,
  CheckCircle2, Copy, FileText, Download, Wand2, Sparkles, Send, BookOpen, Settings, 
  Zap, Activity, LogOut, Mail, UserCircle, Globe, Plus, Mic, MicOff
} from 'lucide-react';

// --- PREMIUM NEON GLOBAL STYLES ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  body { background-color: #020617; color: #f8fafc; font-family: 'Inter', sans-serif; }
  .glow-hover { transition: all 0.3s ease; }
  .glow-hover:hover { box-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }
  .btn-press:active { transform: scale(0.96); }
`;

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-4`}>
      <span className="font-bold">{message}</span>
      <button onClick={onClose} className="font-bold text-xl">&times;</button>
    </div>
  );
}

// --- PUBLIC CLIENT WEBPAGE ---
function PublicProposal() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await axios.get(`https://bid-helper-agent.onrender.com/history/public/${id}`);
        setProposal(res.data);
      } catch (err) {
        setError("Proposal not found or link has expired.");
      }
    };
    fetchProposal();
  }, [id]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white"><h1 className="text-2xl font-bold">{error}</h1></div>;
  if (!proposal) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading secure proposal...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-2xl">
        <div className="border-b-2 border-blue-600 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Strategic Proposal</h1>
            <p className="text-gray-500 mt-2 font-medium">Prepared specifically for your project.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Confidential</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(proposal.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="prose max-w-none" data-color-mode="light">
          <MDEditor.Markdown source={proposal.content} />
        </div>
      </div>
    </div>
  );
}

// --- AUTH COMPONENT ---
function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        const res = await axios.post('https://bid-helper-agent.onrender.com/auth/login', params);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('username', res.data.username);
        navigate('/dashboard');
      } else {
        await axios.post('https://bid-helper-agent.onrender.com/auth/signup', { username, password, role: 'team' });
        alert("Account created! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Authentication failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.1)] border border-gray-800 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLogin ? "System Access" : "Create Agent"}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">{isLogin ? "Authenticate" : "Register"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 cursor-pointer hover:text-white" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account?" : "Back to login"}
        </p>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD ---
function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  const [activeTab, setActiveTab] = useState('generate');
  const [toast, setToast] = useState({ message: '', type: '' });
  
  const [leadText, setLeadText] = useState('');
  const [tone, setTone] = useState('Professional');
  const [size, setSize] = useState('Medium');
  const [audience, setAudience] = useState('General Manager / CEO');
  const [objection, setObjection] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [generatedBid, setGeneratedBid] = useState('');
  const [manualAddition, setManualAddition] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);
  
  const [historyBids, setHistoryBids] = useState([]);
  const [agencyName, setAgencyName] = useState(localStorage.getItem('agencyName') || 'Acme Agency');

  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const insertSnippet = (text) => setLeadText(prev => prev + text);

  const handleGenerate = async () => {
    if (!leadText) return showToast("Enter a job lead first!", "error");
    setIsGenerating(true);
    try {
      const res = await axios.post('https://bid-helper-agent.onrender.com/generate/bid', {
        lead_text: leadText, tone, size, target_audience: audience, client_objection: objection, word_count_target: customWords
      }, { headers: { Authorization: `Bearer ${token}` } });
      setGeneratedBid(res.data.content);
      setCurrentGenerationId(res.data.generation_id);
      showToast("Proposal Synthesized!", "success");
    } catch (err) {
      showToast("Generation failed. Check server logs.", "error");
    }
    setIsGenerating(false);
  };

  const handleAiRevise = async (instruction) => {
    if (!generatedBid || !currentGenerationId) return;
    try {
      const res = await axios.post('https://bid-helper-agent.onrender.com/generate/ai-revise', {
        generation_id: currentGenerationId, current_content: generatedBid, instruction
      }, { headers: { Authorization: `Bearer ${token}` } });
      setGeneratedBid(res.data.content);
      showToast("Revision applied!", "success");
    } catch (err) {
      showToast("Revision failed.", "error");
    }
  };

  const handleManualAppend = () => {
    if (!manualAddition) return;
    setGeneratedBid(prev => prev + '\n\n' + manualAddition);
    setManualAddition('');
    showToast("Text appended successfully!", "success");
  };

  const generateShareLink = () => {
    if (!currentGenerationId) return showToast("Generate a proposal first!", "error");
    const url = `${window.location.origin}/proposal/${currentGenerationId}`;
    navigator.clipboard.writeText(url);
    showToast("Secure Link Copied to Clipboard!", "success");
  };

  const exportPDF = () => {
    localStorage.setItem('agencyName', agencyName);
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 40px;">
        <h1 style="color: #1e3a8a; font-size: 32px; margin-bottom: 5px;">${agencyName}</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 0; text-transform: uppercase; letter-spacing: 2px;">Strategic Proposal</p>
        <hr style="border: none; border-bottom: 2px solid #e5e7eb; margin-bottom: 30px;" />
        <div style="font-size: 14px; line-height: 1.8;">${ReactMarkdown({children: generatedBid})}</div>
      </div>
    `;
    html2pdf().from(element).set({
      margin: 10, filename: 'Premium_Proposal.pdf', image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get('https://bid-helper-agent.onrender.com/history/my-bids', { headers: { Authorization: `Bearer ${token}` } });
      setHistoryBids(res.data.bids);
    } catch (err) { showToast("Failed to load history.", "error"); }
  };

  // Recharts Data Prep
  const chartData = historyBids.map(bid => ({
    date: new Date(bid.created_at).toLocaleDateString(),
    Won: bid.outcome_tag === 'Won' ? 1 : 0,
    Total: 1
  })).reverse();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      <style>{globalStyles}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* NAVBAR */}
      <nav className="bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 glow-hover cursor-default">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl"><Zap className="text-white" size={24} /></div>
            <h1 className="text-2xl font-extrabold text-white">Bid Helper Agent</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-gray-900/80 px-4 py-2 rounded-full border border-gray-800">
              <UserCircle className="text-blue-400" size={20} />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Authorized Agent</span>
                <span className="text-sm font-bold leading-none">{username}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all">
              <LogOut size={16} /> Disconnect
            </button>
          </div>
        </div>
      </nav>

      {/* DASHBOARD TABS */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex gap-4 border-b border-gray-800/60 pb-4 mb-8">
          <button onClick={() => setActiveTab('generate')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'generate' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Generate Engine</button>
          <button onClick={() => { setActiveTab('history'); loadHistory(); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Intelligence Logs</button>
        </div>

        {/* --- GENERATE TAB --- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Send className="text-blue-500"/> Target Specifications</h2>
                  <div className="flex gap-2">
                    <button onClick={() => insertSnippet("\n[Client Name: ]\n")} className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded hover:bg-blue-900/50">+ Name</button>
                    <button onClick={() => insertSnippet("\n[Budget: $]\n")} className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded hover:bg-blue-900/50">+ Budget</button>
                    <button onClick={() => insertSnippet("\n[Timeline: ]\n")} className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded hover:bg-blue-900/50">+ Timeline</button>
                  </div>
                </div>
                
                <textarea 
                  value={leadText} onChange={e => setLeadText(e.target.value)}
                  placeholder="Paste client request here..."
                  className="w-full h-40 bg-gray-950/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none mb-4"
                />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Tone Vibe</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-gray-300">
                      <option>Professional</option><option>Aggressive / Confident</option><option>Friendly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Audience Persona</label>
                    <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-gray-950 border border-blue-900/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] rounded-lg p-2 text-sm text-gray-300">
                      <option>General Manager / CEO</option><option>CTO / Engineering Lead</option><option>Non-Technical Founder</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 block flex items-center gap-1"><Target size={12}/> Known Client Objection (Optional)</label>
                  <input type="text" value={objection} onChange={e => setObjection(e.target.value)} placeholder="e.g. 'They think we are too expensive'" className="w-full bg-purple-950/10 border border-purple-900/30 rounded-lg p-2 text-sm text-purple-200 focus:border-purple-500/50" />
                </div>

                <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex justify-center items-center gap-2">
                  {isGenerating ? "Synthesizing..." : <><Sparkles size={18}/> Initialize AI Generation</>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6 shadow-2xl flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Output Matrix</h2>
                  <div className="flex items-center gap-2">
                    <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Agency Name" className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs w-32" />
                    <button onClick={exportPDF} className="bg-gray-800 hover:bg-gray-700 text-xs font-bold py-1 px-3 rounded flex items-center gap-1"><FileText size={12}/> PDF</button>
                    <button onClick={generateShareLink} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold py-1 px-3 rounded flex items-center gap-1"><Globe size={12}/> Link</button>
                  </div>
                </div>

                <div className="flex-grow bg-gray-950/50 border border-gray-800 rounded-xl overflow-hidden" data-color-mode="dark">
                  <MDEditor value={generatedBid} onChange={setGeneratedBid} height={400} preview="edit" className="border-none" />
                </div>
              </div>

              {generatedBid && (
                <>
                  <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 flex gap-2 overflow-x-auto">
                    <button onClick={() => handleAiRevise("Make this much shorter.")} className="bg-purple-900/20 hover:bg-purple-800/40 text-purple-300 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap"><Wand2 size={12}/> Compact</button>
                    <button onClick={() => handleAiRevise("Summarize this entire proposal into a short, punchy, 3-sentence email cover letter.")} className="bg-blue-900/20 hover:bg-blue-800/40 text-blue-300 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap"><Mail size={12}/> Draft Email</button>
                  </div>
                  
                  <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Plus size={14}/> Manual Override</h4>
                    <div className="flex gap-2">
                      <input type="text" value={manualAddition} onChange={e => setManualAddition(e.target.value)} placeholder="Type custom note to append..." className="flex-grow bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm" />
                      <button onClick={handleManualAppend} className="bg-gray-800 hover:bg-gray-700 text-xs font-bold px-4 rounded-lg">Append</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- HISTORY TAB & CHARTS --- */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-6">Win Rate Analytics</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="Total" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} />
                    <Area type="monotone" dataKey="Won" stroke="#10b981" fillOpacity={1} fill="url(#colorWon)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyBids.map(bid => (
                <div key={bid._id} className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-5 hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-gray-500">{new Date(bid.created_at).toLocaleDateString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${bid.outcome_tag === 'Won' ? 'bg-emerald-500/10 text-emerald-400' : bid.outcome_tag === 'Lost' ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                      {bid.outcome_tag || 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">"{bid.lead_text}"</p>
                  <div className="flex gap-2">
                     <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-1 rounded border border-blue-800/30">{bid.target_audience}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- APP ROUTER ---
export default function App() {
  return (
    <GoogleOAuthProvider clientId="742455468037-15nrh5etl1r764tu66958coe6437rs4m.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proposal/:id" element={<PublicProposal />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}