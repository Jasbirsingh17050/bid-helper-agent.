import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './index.css';
import { marked } from 'marked';

// Safely imported icons
import { 
  Eye, EyeOff, Users, UserCheck, UserX, 
  Trophy, XCircle, TrendingUp, Target, Award,
  CheckCircle, Copy, FileText, Download, Wand2, Sparkles, Send, BookOpen, Settings, Zap, Activity, LogOut, Mail, User, Mic, MicOff, Globe, Plus, Image as ImageIcon
} from 'lucide-react';

// --- PREMIUM NEON GLOBAL STYLES ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  body {
    background-color: #020617; 
    color: #f8fafc;
    font-family: 'Inter', sans-serif;
    background-image: radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.04), transparent 25%),
                      radial-gradient(circle at 85% 30%, rgba(99, 102, 241, 0.04), transparent 25%);
  }

  .glow-hover { transition: all 0.3s ease; }
  .glow-hover:hover {
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
  }
  
  .btn-press { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
  .btn-press:active { transform: scale(0.96); background-color: rgba(255,255,255,0.1); }

  .prose h1, .prose h2, .prose h3 { color: #f8fafc; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; letter-spacing: -0.02em; }
  .prose p { margin-bottom: 1.2em; line-height: 1.7; color: #cbd5e1; }
  .prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.2em; color: #cbd5e1; }
  .prose li { margin-bottom: 0.5em; }
  .prose strong { color: #38bdf8; font-weight: 700; }
  
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0f172a; border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }

  .quill { display: flex; flex-direction: column; height: 100%; border-radius: 1rem; }
  .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid rgba(31, 41, 55, 1) !important; background-color: rgba(17, 24, 39, 0.8) !important; border-radius: 1rem 1rem 0 0; padding: 12px 20px !important; }
  .ql-container.ql-snow { border: none !important; flex-grow: 1; font-size: 14px; font-family: 'Inter', sans-serif; color: #cbd5e1; background-color: rgba(3, 7, 18, 0.3) !important; border-radius: 0 0 1rem 1rem; }
  .ql-editor { min-height: 300px; padding: 24px; }
  .ql-snow .ql-stroke { stroke: #94a3b8 !important; }
  .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill { fill: #94a3b8 !important; }
  .ql-snow .ql-picker { color: #94a3b8 !important; }
  .ql-snow .ql-picker-options { background-color: #1f2937 !important; border-color: #374151 !important; }
  .ql-editor.ql-blank::before { color: #475569 !important; font-style: normal !important; }
  .ql-editor p { margin-bottom: 1rem; }
  .ql-editor strong { color: #38bdf8; font-weight: bold; }
`;

// --- PREMIUM TOAST COMPONENT ---
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed bottom-6 right-6 ${isError ? 'bg-red-500/90' : 'bg-emerald-500/90'} backdrop-blur-md border ${isError ? 'border-red-400' : 'border-emerald-400'} text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] flex items-center gap-4 z-50 transition-all duration-300 transform translate-y-0`}>
      <span className="font-bold tracking-wide">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 font-bold text-xl leading-none">&times;</button>
    </div>
  );
}

// --- PUBLIC CLIENT PROPOSAL VIEWER ---
function PublicProposal() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await axios.get(`https://bid-helper-agent.onrender.com/history/public/${id}`);
        setProposal(response.data);
      } catch (err) {
        setError("Proposal not found or access has expired.");
      }
    };
    fetchProposal();
  }, [id]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white"><p className="text-red-400 font-bold">{error}</p></div>;
  if (!proposal) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white"><Sparkles className="animate-spin text-blue-500 mr-3" size={24}/> <span className="font-bold tracking-widest uppercase text-sm text-gray-400">Loading Strategic Proposal...</span></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 py-12 px-6 font-sans bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <style>{globalStyles}</style>
      <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-2xl border border-gray-800 p-12 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

        <div className="flex justify-between items-end mb-10 border-b border-gray-800/50 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight mb-2">Strategic Proposal</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-blue-500"/> {proposal.project_category || 'Custom Solution'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prepared On</span>
            <p className="text-sm font-medium text-gray-300">{new Date(proposal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        
        <div className="prose prose-invert max-w-none text-sm leading-loose prose-headings:text-blue-50 prose-a:text-blue-400 prose-strong:text-blue-300" dangerouslySetInnerHTML={{ __html: proposal.content }} />
      </div>
    </div>
  );
}

// --- 1. AUTH COMPONENT (SIGN IN & SIGN UP & FORGOT PASSWORD) ---
function Auth() {
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    
    if (authMode === 'login') {
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
        setError(err.response?.data?.detail || "Network Error. Please try again.");
      }
    } else if (authMode === 'signup') {
      try {
        await axios.post('https://bid-helper-agent.onrender.com/auth/signup', { username, password, role });
        showToast("Account created successfully! Please log in.", "success");
        setAuthMode('login');
        setPassword('');
      } catch (err) {
        setError(err.response?.data?.detail || "Registration failed.");
      }
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('https://bid-helper-agent.onrender.com/auth/forgot-password', { username });
      showToast("If the account exists, an OTP was sent to your email!", "success");
      setAuthMode('forgot_verify');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('https://bid-helper-agent.onrender.com/auth/reset-password', {
        username: username,
        otp: otp,
        new_password: newPassword
      });
      showToast("Password reset successfully! You can now log in.", "success");
      setAuthMode('login');
      setOtp('');
      setNewPassword('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    }
  };

  const getTitle = () => {
    if (authMode === 'login') return "Welcome Back";
    if (authMode === 'signup') return "Create Account";
    if (authMode === 'forgot_request') return "Reset Password";
    if (authMode === 'forgot_verify') return "Verify OTP";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <style>{globalStyles}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      <div className="bg-gray-900/60 backdrop-blur-2xl p-10 rounded-3xl shadow-[0_0_40px_rgba(56,189,248,0.1)] border border-gray-800 w-96 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
            <Zap className="text-white" size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          {getTitle()}
        </h2>
        
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}
        
        {/* --- LOGIN & SIGNUP FORMS --- */}
        {(authMode === 'login' || authMode === 'signup') && (
          <form onSubmit={handleAuth} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username / Email</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
                     className="w-full p-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all outline-none" required minLength="3" />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                Password
                {authMode === 'login' && (
                  <button type="button" onClick={() => setAuthMode('forgot_request')} className="text-blue-400 hover:text-blue-300 transition-colors">Forgot?</button>
                )}
              </label>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} 
                     className="w-full p-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all outline-none pr-10" required minLength="6" />
              
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-9 text-gray-500 hover:text-blue-400 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-700 rounded-xl text-white outline-none">
                  <option value="admin">Admin</option>
                  <option value="team">Team Member</option>
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-[1.02] transition-all duration-200 mt-4">
              {authMode === 'login' ? "Access System" : "Initialize Account"}
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD REQUEST FORM --- */}
        {authMode === 'forgot_request' && (
          <form onSubmit={handleSendOTP} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username / Email</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your email or username"
                     className="w-full p-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all outline-none" required />
            </div>
            
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-[1.02] transition-all duration-200 mt-4">
              Send 6-Digit OTP
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setAuthMode('login')} className="text-gray-400 font-bold hover:text-gray-200 text-sm transition-colors">Back to Login</button>
            </div>
          </form>
        )}

        {/* --- FORGOT PASSWORD VERIFY OTP FORM --- */}
        {authMode === 'forgot_verify' && (
          <form onSubmit={handleResetPassword} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">6-Digit OTP Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="e.g. 123456" maxLength="6"
                     className="w-full p-3 text-center tracking-[0.5em] font-bold text-xl bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-emerald-400 transition-all outline-none" required />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
                     className="w-full p-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all outline-none" required minLength="6" />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-[1.02] transition-all duration-200 mt-4">
              Reset Password
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setAuthMode('login')} className="text-gray-400 font-bold hover:text-gray-200 text-sm transition-colors">Back to Login</button>
            </div>
          </form>
        )}

        {(authMode === 'login' || authMode === 'signup') && (
          <>
            <div className="mt-8 flex items-center justify-between opacity-50">
              <hr className="w-full border-gray-700" />
              <span className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">OR</span>
              <hr className="w-full border-gray-700" />
            </div>
            
            <div className="mt-6 flex justify-center hover:scale-[1.02] transition-transform">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="filled_black" shape="pill" />
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }} type="button" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all">
                {authMode === 'login' ? "Sign Up" : "Log In"}
              </button>
            </div>
          </>
        )}
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
  const [customWords, setCustomWords] = useState('');
  const [projectCategory, setProjectCategory] = useState('General / Other');
  const [targetAudience, setTargetAudience] = useState('General Manager / CEO');
  const [clientObjection, setClientObjection] = useState('');
  
  const [generatedBid, setGeneratedBid] = useState(''); 
  const [manualAddition, setManualAddition] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [currentGenerationId, setCurrentGenerationId] = useState(null);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  
  // Voice Input States
  const [isListening, setIsListening] = useState(false);
  
  // Profile States
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Custom Company Name
  const [companyName, setCompanyName] = useState(localStorage.getItem('companyName') || 'Acme Agency');

  // History & Analytics States
  const [historyBids, setHistoryBids] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // User Management States
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // KB & Settings States
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState({ banned_phrases: '', confidential_keywords: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const quillRef = useRef(null);

  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);
  useEffect(() => { 
    if (activeTab === 'settings' && role === 'admin') loadSettings();
    if (activeTab === 'profile') loadProfile();
  }, [activeTab]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const loadProfile = async () => {
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileFullName(response.data.full_name || '');
      setProfilePicture(response.data.profile_picture || '');
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        return showToast("Image is too large. Please select an image under 1MB.", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await axios.put('https://bid-helper-agent.onrender.com/auth/profile', 
        { full_name: profileFullName, profile_picture: profilePicture },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const insertSnippet = (text) => setLeadText(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + text);

  const toggleListening = () => {
    if (isListening) {
      if (window.speechRecognitionInstance) {
        window.speechRecognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech-to-Text is only supported in Chrome/Edge browsers.", "error");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    window.speechRecognitionInstance = recognition;
    
    recognition.onstart = () => {
      setIsListening(true);
      showToast("Microphone active! Start speaking...", "success");
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
         setLeadText((prev) => prev + finalTranscript);
      }
    };
    
    recognition.start();
  };

  const handleGenerate = async () => {
    if (!leadText.trim()) return showToast("Please enter a job lead!", "error");
    setIsGenerating(true); 
    setGeneratedBid(''); 
    setCurrentGenerationId(null); 
    setConfidenceScore(null);
    try {
      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/bid', 
        { 
          lead_text: leadText, 
          tone: tone, 
          size: size, 
          project_category: projectCategory, 
          word_count_target: customWords, 
          target_audience: targetAudience, 
          client_objection: clientObjection 
        },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      
      const htmlFormattedText = marked.parse(response.data.content);
      setGeneratedBid(htmlFormattedText); 
      
      const score = response.data.confidence_score;
      setConfidenceScore(score !== undefined && score !== null ? score : 85); 
      
      setCurrentGenerationId(response.data.generation_id); 
      showToast("Bid generated successfully!", "success");
    } catch (error) { 
      showToast("Error generating bid.", "error"); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleAiRevise = async (instruction) => {
    if (!currentGenerationId || !generatedBid) return;
    setIsRevising(true);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generatedBid;
      const plainTextContent = tempDiv.innerText || tempDiv.textContent || "";

      const response = await axios.post('https://bid-helper-agent.onrender.com/generate/ai-revise',
        { generation_id: currentGenerationId, current_content: plainTextContent, instruction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const htmlFormattedText = marked.parse(response.data.content);
      setGeneratedBid(htmlFormattedText);
      showToast(`AI Magic Applied!`, "success");
    } catch (error) { showToast("Error applying AI revision.", "error"); } finally { setIsRevising(false); }
  };

  const handleManualAppend = () => {
    if (!manualAddition) return;
    setGeneratedBid(prev => prev + '<br/><br/><p>' + manualAddition + '</p>');
    setManualAddition('');
    showToast("Custom note appended successfully!", "success");
  };

  const handleSaveRevision = async () => {
    if (!currentGenerationId) return;
    setIsSavingRevision(true);
    try {
      await axios.post(`https://bid-helper-agent.onrender.com/history/${currentGenerationId}/revise`,
        { content: generatedBid, action_type: 'manual_edit' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Configuration saved to logs!", "success");
    } catch (error) { showToast("Failed to save.", "error"); } finally { setIsSavingRevision(false); }
  };

  const handleCompanyNameChange = (e) => {
    setCompanyName(e.target.value);
    localStorage.setItem('companyName', e.target.value);
  };

  const handleCopyLink = () => {
    if (!currentGenerationId) {
      return showToast("Please save the configuration to logs first to generate a link!", "error");
    }
    const link = `${window.location.origin}/proposal/${currentGenerationId}`;
    navigator.clipboard.writeText(link);
    showToast("Client Link Copied!", "success");
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handlePdfExport = async () => {
    if (!generatedBid) return;
    showToast("Preparing PDF Export...", "success");
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      const printElement = document.createElement('div');
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      printElement.innerHTML = `
        <style>
          h1, h2, h3 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; }
          p { margin-bottom: 1.2em; line-height: 1.7; }
          ul { padding-left: 20px; margin-bottom: 1.2em; }
          li { margin-bottom: 0.5em; }
          strong { color: #1e293b; font-weight: bold; }
        </style>
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; padding: 40px; font-size: 14px;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">${companyName}</h1>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Strategic Proposal</p>
            </div>
            <div style="text-align: right; color: #64748b; font-size: 12px;">
              <p style="margin: 0; font-weight: 500;">Prepared: ${dateStr}</p>
            </div>
          </div>
          <div>${generatedBid}</div>
        </div>
      `;
      
      window.html2pdf().set({
        margin: [10, 0, 10, 0], 
        filename: `${companyName.replace(/\s+/g, '_')}_Proposal.pdf`, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(printElement).save().then(() => {
        showToast("Premium PDF Exported!", "success");
      });
    } catch (error) {
      showToast("Error loading PDF Library.", "error");
    }
  };

  const handleWordExport = async () => {
    if (!generatedBid) return;
    showToast("Preparing Word Export...", "success");
    try {
      await loadScript('https://unpkg.com/docx@8.5.0/build/index.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generatedBid;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";
      
      const doc = new window.docx.Document({
        sections: [{
          properties: {},
          children: plainText.split('\n').map(line => new window.docx.Paragraph({
            children: [new window.docx.TextRun({ text: line })]
          }))
        }]
      });
      
      const blob = await window.docx.Packer.toBlob(doc);
      window.saveAs(blob, "Proposal.docx");
      showToast("Word Document Exported!", "success");
    } catch (error) {
      showToast("Error creating Word document.", "error");
    }
  };

  const handleCopy = () => {
    if (!generatedBid) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedBid;
    const plainText = tempDiv.innerText || tempDiv.textContent || "";
    navigator.clipboard.writeText(plainText);
    showToast("Copied to clipboard!", "success");
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/history/my-bids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryBids(response.data.bids);
    } catch (error) { showToast("Failed to load history.", "error"); } finally { setIsLoadingHistory(false); }
  };

  const handleSetOutcome = async (generationId, outcome) => {
    try {
      await axios.put(`https://bid-helper-agent.onrender.com/history/${generationId}/outcome`, 
        { outcome },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Marked as ${outcome}!`, "success");
      loadHistory(); 
    } catch (error) { showToast("Failed to update outcome", "error"); }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get('https://bid-helper-agent.onrender.com/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(response.data.users);
    } catch (error) { showToast("Failed to load team members.", "error"); } finally { setIsLoadingUsers(false); }
  };

  const handleToggleUserStatus = async (username, currentStatus) => {
    try {
      await axios.put(`https://bid-helper-agent.onrender.com/auth/users/${username}/status`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`User ${username} status updated!`, "success");
      loadUsers();
    } catch (error) { showToast(error.response?.data?.detail || "Failed to update user.", "error"); }
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
    } catch (error) { showToast("Failed to load settings.", "error"); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const formattedSettings = {
        active_llm_provider: "openai", daily_generation_limit_per_user: 50,
        banned_phrases: settings.banned_phrases.split(',').map(s => s.trim()).filter(Boolean),
        confidential_keywords: settings.confidential_keywords.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.put('https://bid-helper-agent.onrender.com/settings/', formattedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Settings saved successfully!", "success");
    } catch (error) { showToast("Error saving settings.", "error"); } finally { setIsSavingSettings(false); }
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
    } catch (error) { showToast(error.response?.data?.detail || "Upload failed.", "error"); } finally { setIsUploading(false); }
  };

  const wordCount = generatedBid ? generatedBid.replace(/<[^>]+>/g, '').trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  const totalBids = historyBids.length;
  const wonBids = historyBids.filter(b => b.outcome_tag === 'Won').length;
  const lostBids = historyBids.filter(b => b.outcome_tag === 'Lost').length;
  const winRate = totalBids > 0 && (wonBids + lostBids) > 0 ? Math.round((wonBids / (wonBids + lostBids)) * 100) : 0;

  const chartDataMap = {};
  [...historyBids].reverse().forEach(bid => {
      const date = new Date(bid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!chartDataMap[date]) chartDataMap[date] = { date, Total: 0, Won: 0 };
      chartDataMap[date].Total += 1;
      if (bid.outcome_tag === 'Won') chartDataMap[date].Won += 1;
  });
  const chartData = Object.values(chartDataMap);

  const getTabClass = (tabName) => `
    flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-300 glow-hover btn-press
    ${activeTab === tabName 
      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'}
  `;

  return (
    <div className="min-h-screen bg-[#020617] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <style>{globalStyles}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Top Navbar */}
      <nav className="bg-gray-950/80 backdrop-blur-2xl border-b border-gray-800/60 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 glow-hover cursor-default">
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <Zap className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Bid Helper Agent</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800 shadow-inner glow-hover cursor-pointer" onClick={() => setActiveTab('profile')}>
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-700" />
              ) : (
                <User className="text-gray-400" size={24} />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-0.5">Authorized Agent</span>
                <span className="text-sm text-gray-200 font-bold leading-none">{profileFullName || username}</span>
              </div>
              {role === 'admin' && <span className="ml-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">Admin</span>}
            </div>
            <button onClick={handleLogout} title="Secure Logout" className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full border border-transparent hover:border-red-500/20 transition-all btn-press">
              <LogOut size={16} /> Disconnect
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-gray-800/50 pb-6">
          <button onClick={() => setActiveTab('generate')} className={getTabClass('generate')}><Wand2 size={18}/> Generate Engine</button>
          <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}><User size={18}/> My Profile</button>
          <button onClick={() => { setActiveTab('history'); loadHistory(); }} className={getTabClass('history')}><Activity size={18}/> Intelligence Logs</button>
          {role === 'admin' && (
            <>
              <button onClick={() => { setActiveTab('users'); loadUsers(); }} className={getTabClass('users')}><Users size={18}/> Team Access</button>
              <button onClick={() => setActiveTab('kb')} className={getTabClass('kb')}><BookOpen size={18}/> Knowledge Base</button>
              <button onClick={() => setActiveTab('settings')} className={getTabClass('settings')}><Settings size={18}/> System Rules</button>
            </>
          )}
        </div>

        {/* --- TAB: MY PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-2xl">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-8"><User className="text-blue-400"/> My Profile</h3>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-950 border-2 border-gray-800 flex items-center justify-center overflow-hidden shadow-inner">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-600" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Profile Picture (Max 1MB)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-900/20 file:text-blue-400 hover:file:bg-blue-800/30 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Full Name</label>
                <input 
                  type="text" 
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  placeholder="e.g., Jasbir Singh"
                  className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-gray-300 text-sm outline-none transition-all glow-hover shadow-inner"
                />
              </div>

              <button 
                onClick={handleSaveProfile} disabled={isSavingProfile}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 btn-press"
              >
                <CheckCircle size={18}/> {isSavingProfile ? "Saving..." : "Save Profile Data"}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: GENERATE ENGINE --- */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
            {/* Left Panel: Inputs */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl flex flex-col min-h-0 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3"><Send className="text-blue-400" size={24}/> Target Specifications</h3>
              
              {/* SMART SNIPPETS */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center mr-1">Smart Snippets:</span>
                {['[Client Name: ]', '[Budget: $]', '[Deadline: ]', '[Tech Stack: ]', '[Competitor: ]'].map((snippet, idx) => (
                  <button 
                    key={idx}
                    onClick={() => insertSnippet(snippet)}
                    className="text-[10px] font-bold bg-blue-900/20 text-blue-300 border border-blue-800/50 px-2.5 py-1 rounded-full hover:bg-blue-800/40 hover:text-blue-200 transition-all btn-press flex items-center gap-1"
                    title={`Inject ${snippet}`}
                  >
                    <Zap size={10} /> {snippet}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <textarea 
                  value={leadText} onChange={(e) => setLeadText(e.target.value)}
                  placeholder="Paste the raw client request, job description, or RFP here..."
                  className="w-full h-56 p-5 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-200 resize-none text-sm leading-relaxed outline-none shadow-inner transition-all glow-hover pr-14 custom-scrollbar"
                />
                
                {/* MICROPHONE BUTTON */}
                <button 
                  onClick={toggleListening}
                  title="Speak your prompt"
                  className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
                      : 'bg-gray-800/80 text-gray-400 hover:text-blue-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Domain</label>
                  <select value={projectCategory} onChange={(e) => setProjectCategory(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all glow-hover">
                    <option>General / Other</option>
                    <option>Web Development</option>
                    <option>Mobile App Dev</option>
                    <option>UI/UX Design</option>
                    <option>Data Science / AI</option>
                    <option>Marketing / SEO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Vibe</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all glow-hover">
                    <option>Professional</option>
                    <option>Conversational</option>
                    <option>Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Output Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all glow-hover">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Audience Persona</label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all glow-hover">
                    <option>General Manager / CEO</option>
                    <option>CTO / Engineering Lead</option>
                    <option>Non-Technical Founder</option>
                    <option>HR / Recruitment</option>
                  </select>
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">Custom Words limit</label>
                  <input type="text" value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="e.g. 150"
                    className="w-full p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-sm text-blue-200 outline-none focus:ring-1 focus:ring-blue-400 transition-all glow-hover placeholder-blue-700"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-extrabold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Target size={14} /> Known Client Objection / Worry (Optional)
                </label>
                <input type="text" value={clientObjection} onChange={(e) => setClientObjection(e.target.value)} placeholder="e.g., 'They think our price is too high' or 'They have a tight 2-week deadline'"
                  className="w-full p-4 bg-purple-950/10 border border-purple-500/30 rounded-xl text-sm text-purple-200 outline-none focus:ring-1 focus:ring-purple-400 transition-all glow-hover placeholder-purple-800/60 shadow-inner"
                />
              </div>

              <button 
                onClick={handleGenerate} disabled={isGenerating}
                className="w-full mt-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] disabled:opacity-50 transition-all duration-300 flex justify-center items-center gap-3 btn-press group"
              >
                {isGenerating ? (
                  <Sparkles className="animate-spin text-white" size={22} />
                ) : (
                  <Sparkles className="text-white group-hover:scale-110 transition-transform" size={22} />
                )}
                {isGenerating ? "Synthesizing Data..." : "Initialize AI Generation"}
              </button>
            </div>

            {/* Right Panel: Output */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl flex flex-col min-h-0 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-3"><CheckCircle className="text-emerald-400" size={24}/> Output Matrix</h3>
                  
                  {/* --- CONFIDENCE SCORE UI --- */}
                  {confidenceScore !== null && !isNaN(confidenceScore) && (
                    <div className="flex items-center gap-2 bg-gray-950/80 px-3 py-1.5 rounded-2xl border border-gray-800 shadow-inner">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="16" cy="16" r="14" stroke="#1f2937" strokeWidth="3" fill="none" />
                          <circle cx="16" cy="16" r="14" stroke={confidenceScore > 85 ? '#10b981' : confidenceScore > 65 ? '#f59e0b' : '#ef4444'} strokeWidth="3" fill="none" 
                                  strokeDasharray="88" strokeDashoffset={88 - (confidenceScore / 100) * 88} 
                                  className="transition-all duration-1000 ease-out" />
                        </svg>
                        <span className="absolute text-[10px] font-bold" style={{color: confidenceScore > 85 ? '#10b981' : confidenceScore > 65 ? '#f59e0b' : '#ef4444'}}>{confidenceScore}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">AI<br/>Score</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 items-center flex-wrap justify-end">
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={handleCompanyNameChange}
                    placeholder="Your Agency Name"
                    className="w-32 bg-gray-950/50 border border-gray-800 rounded-xl text-xs px-3 py-2 text-gray-300 outline-none focus:border-blue-500 transition-all shadow-inner"
                    title="This name will appear on your exported PDF"
                  />
                  <button onClick={handleCopyLink} disabled={!generatedBid || !currentGenerationId} className="flex items-center gap-2 text-xs font-bold bg-purple-900/20 hover:bg-purple-800/30 text-purple-300 border border-purple-800/50 px-3 py-2 rounded-xl disabled:opacity-30 transition-all btn-press glow-hover">
                    <Globe size={14}/> Share Link
                  </button>
                  <button onClick={handlePdfExport} disabled={!generatedBid} className="flex items-center gap-2 text-xs font-bold bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 px-3 py-2 rounded-xl disabled:opacity-30 transition-all btn-press glow-hover">
                    <FileText size={14}/> PDF
                  </button>
                  <button onClick={handleWordExport} disabled={!generatedBid} className="flex items-center gap-2 text-xs font-bold bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 border border-blue-800/50 px-3 py-2 rounded-xl disabled:opacity-30 transition-all btn-press glow-hover">
                    <Download size={14}/> Word (.doc)
                  </button>
                  <button onClick={handleCopy} disabled={!generatedBid} className="flex items-center gap-2 text-xs font-bold bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700 px-3 py-2 rounded-xl disabled:opacity-30 transition-all btn-press glow-hover">
                    <Copy size={14}/> Copy
                  </button>
                </div>
              </div>

              {generatedBid ? (
                <div className="flex-grow bg-gray-950/50 border border-gray-800 rounded-2xl overflow-hidden mb-4 shadow-inner custom-quill-container">
                  <ReactQuill ref={quillRef} theme="snow" value={generatedBid} onChange={setGeneratedBid} className="h-full min-h-[300px]" />
                </div>
              ) : (
                <div className="w-full flex-grow border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-gray-950/20 min-h-[300px] mb-4">
                  <Wand2 size={48} className="mb-4 opacity-20" />
                  <p className="font-medium tracking-wide">Awaiting generation command...</p>
                </div>
              )}

              {generatedBid && (
                <div className="mt-auto space-y-4">
                  <div className="flex gap-6 items-center px-2">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> {wordCount} Words</span>
                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12}/> ~{readTime} Min Read</span>
                  </div>

                  <div className="p-5 bg-gray-950/50 border border-gray-800 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">AI Post-Processing & Overrides</span>
                      {isRevising && <span className="text-[10px] text-purple-400 animate-pulse font-bold tracking-widest uppercase">Processing...</span>}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap mb-4">
                      <button onClick={() => handleAiRevise("Make this much shorter and more concise.")} disabled={isRevising} className="bg-purple-900/20 hover:bg-purple-800/30 border border-purple-800/50 text-purple-300 text-xs font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition-all btn-press flex items-center gap-2"><Wand2 size={12}/> Compact</button>
                      <button onClick={() => handleAiRevise("Make the tone more aggressive, confident, and persuasive.")} disabled={isRevising} className="bg-purple-900/20 hover:bg-purple-800/30 border border-purple-800/50 text-purple-300 text-xs font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition-all btn-press flex items-center gap-2"><Wand2 size={12}/> Aggressive</button>
                      <button onClick={() => handleAiRevise("Fix any grammar mistakes and polish the language.")} disabled={isRevising} className="bg-emerald-900/20 hover:bg-emerald-800/30 border border-emerald-800/50 text-emerald-300 text-xs font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition-all btn-press flex items-center gap-2"><Wand2 size={12}/> Polish</button>
                      <button onClick={() => handleAiRevise("Summarize this entire proposal into a short, punchy, 3-sentence email cover letter that I can send to the client with the PDF attached.")} disabled={isRevising} className="bg-blue-900/20 hover:bg-blue-800/30 border border-blue-800/50 text-blue-300 text-xs font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition-all btn-press flex items-center gap-2"><Mail size={12}/> Draft Email</button>
                    </div>

                    <hr className="border-gray-800/50 mb-4" />
                    
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Manual Override</h4>
                      <div className="flex gap-2">
                        <input type="text" value={manualAddition} onChange={e => setManualAddition(e.target.value)} placeholder="Type custom note, links, or tables to append..." className="flex-grow bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-gray-300 outline-none focus:border-blue-500 transition-colors shadow-inner" />
                        <button onClick={handleManualAppend} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold px-5 rounded-xl transition-all btn-press text-gray-200">Append</button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveRevision} disabled={isSavingRevision}
                    className="w-full bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 font-extrabold py-3.5 px-4 rounded-xl hover:bg-emerald-800/30 hover:border-emerald-500/50 disabled:opacity-50 transition-all flex justify-center items-center gap-2 btn-press"
                  >
                    <BookOpen size={16}/> {isSavingRevision ? "Logging..." : "Save Configuration to Logs"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: INTELLIGENCE LOGS (HISTORY & ANALYTICS) --- */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-8"><Activity className="text-blue-400"/> Intelligence Logs & Analytics</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center glow-hover">
                <Target className="text-blue-500 mb-2" size={28}/>
                <span className="text-3xl font-extrabold text-white">{totalBids}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Bids</span>
              </div>
              <div className="bg-emerald-900/10 backdrop-blur-md border border-emerald-900/50 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center glow-hover">
                <Trophy className="text-emerald-500 mb-2" size={28}/>
                <span className="text-3xl font-extrabold text-emerald-400">{wonBids}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Projects Won</span>
              </div>
              <div className="bg-red-900/10 backdrop-blur-md border border-red-900/50 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center glow-hover">
                <XCircle className="text-red-500 mb-2" size={28}/>
                <span className="text-3xl font-extrabold text-red-400">{lostBids}</span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Projects Lost</span>
              </div>
              <div className="bg-blue-900/10 backdrop-blur-md border border-blue-900/50 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center glow-hover">
                <TrendingUp className="text-blue-500 mb-2" size={28}/>
                <span className="text-3xl font-extrabold text-blue-400">{winRate}%</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Win Rate</span>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-72 w-full bg-gray-900/50 backdrop-blur-md border border-gray-800 p-6 rounded-2xl shadow-lg mb-10">
                <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14}/> Proposal Velocity & Conversions</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#030712', borderColor: '#1f2937', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    <Area type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="Won" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {isLoadingHistory ? (
              <div className="text-center py-10 text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Retrieving Logs...</div>
            ) : historyBids.length === 0 ? (
              <div className="text-center py-10 text-gray-600 font-medium">No intelligence logs found. Initialize a generation.</div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {historyBids.map((bid) => {
                  const latestRevision = bid.revisions && bid.revisions.length > 0 ? bid.revisions[bid.revisions.length - 1] : null;
                  return (
                    <div key={bid._id} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-8 shadow-xl hover:border-blue-500/30 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-3">
                          <span className="bg-blue-900/20 text-blue-400 border border-blue-800/50 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{bid.tone}</span>
                          <span className="bg-purple-900/20 text-purple-400 border border-purple-800/50 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{bid.size}</span>
                          <span className="bg-teal-900/20 text-teal-400 border border-teal-800/50 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{bid.project_category || 'General'}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500 tracking-wider">
                          {new Date(bid.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Target Description</h4>
                        <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-4 py-1 italic">"{bid.lead_text}"</p>
                      </div>

                      {latestRevision && (
                        <div className="mb-6">
                          <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Final Output</h4>
                          <div className="w-full text-sm text-gray-300 bg-gray-950/50 border border-gray-800 rounded-xl p-5 max-h-48 overflow-y-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: latestRevision.content }} />
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-800/50">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mr-auto">Project Outcome</span>
                        
                        {bid.outcome_tag === 'Won' ? (
                          <span className="flex items-center gap-2 text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"><Trophy size={14}/> Won Project</span>
                        ) : bid.outcome_tag === 'Lost' ? (
                          <span className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"><XCircle size={14}/> Lost Project</span>
                        ) : (
                          <>
                            <button onClick={() => handleSetOutcome(bid._id, 'Won')} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-300 hover:bg-emerald-900/20 border border-transparent hover:border-emerald-800/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all btn-press"><Trophy size={14}/> Mark as Won</button>
                            <button onClick={() => handleSetOutcome(bid._id, 'Lost')} className="flex items-center gap-2 text-red-500 hover:text-red-300 hover:bg-red-900/20 border border-transparent hover:border-red-800/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all btn-press"><XCircle size={14}/> Mark as Lost</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: TEAM ACCESS (ADMIN ONLY) --- */}
        {activeTab === 'users' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-5xl">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2"><Users className="text-blue-400"/> Team Access Matrix</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">Manage system access and roles for all registered personnel.</p>
            
            {isLoadingUsers ? (
              <div className="text-center py-10 text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Fetching Matrix Data...</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/80 border-b border-gray-800">
                      <th className="p-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest w-1/3">Username</th>
                      <th className="p-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest w-1/4">Role</th>
                      <th className="p-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest w-1/4">Join Date</th>
                      <th className="p-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">System Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="p-4 font-bold text-gray-200">{u.username}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${u.role === 'admin' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-800/50' : 'bg-indigo-900/20 text-indigo-400 border-indigo-800/50'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400 font-medium">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          {u.username !== username ? (
                            <button 
                              onClick={() => handleToggleUserStatus(u.username, u.is_active)}
                              className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all btn-press border ${
                                u.is_active 
                                  ? 'bg-emerald-900/10 text-emerald-500 border-emerald-900/50 hover:bg-emerald-900/30' 
                                  : 'bg-red-900/10 text-red-500 border-red-900/50 hover:bg-red-900/30'
                              }`}
                            >
                              {u.is_active ? <><UserCheck size={14}/> Active</> : <><UserX size={14}/> Locked</>}
                            </button>
                          ) : (
                            <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest px-4 py-2">Current User</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No personnel found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: KNOWLEDGE BASE (ADMIN ONLY) --- */}
        {activeTab === 'kb' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-2xl">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2"><BookOpen className="text-blue-400"/> Knowledge Base Upload</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">Upload historical success data (CSV) to train the intelligence matrix.</p>
            
            <div className="border-2 border-dashed border-gray-700 hover:border-blue-500/50 transition-colors rounded-2xl p-10 text-center bg-gray-950/30 mb-6 group cursor-pointer relative">
              <input 
                type="file" accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="bg-blue-900/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Download className="text-blue-400" size={28}/>
                </div>
                <span className="text-sm font-bold text-gray-300">
                  {file ? file.name : "Drag & Drop CSV or Click to Browse"}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleUpload} disabled={!file || isUploading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 btn-press"
            >
              <Zap size={18}/> {isUploading ? "Injecting Data to Vector Matrix..." : "Upload & Train Intelligence"}
            </button>
          </div>
        )}

        {/* --- TAB: SYSTEM RULES (ADMIN ONLY) --- */}
        {activeTab === 'settings' && role === 'admin' && (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-2xl">
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-8"><Settings className="text-blue-400"/> Global System Rules</h3>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Banned Phrase List (Comma Separated)</label>
                <textarea 
                  value={settings.banned_phrases}
                  onChange={(e) => setSettings({...settings, banned_phrases: e.target.value})}
                  placeholder="e.g., hope this finds you well, delve, synergy, robust"
                  className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-gray-300 text-sm outline-none transition-all glow-hover resize-none h-24 custom-scrollbar"
                />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Matrix will strictly block these phrases.</p>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Confidential Keywords (Comma Separated)</label>
                <textarea 
                  value={settings.confidential_keywords}
                  onChange={(e) => setSettings({...settings, confidential_keywords: e.target.value})}
                  placeholder="e.g., stealth project, internal budget, $"
                  className="w-full p-4 bg-gray-950/50 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-gray-300 text-sm outline-none transition-all glow-hover resize-none h-24 custom-scrollbar"
                />
              </div>

              <button 
                onClick={handleSaveSettings} disabled={isSavingSettings}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 btn-press"
              >
                <CheckCircle size={18}/> {isSavingSettings ? "Syncing..." : "Sync Rules to Database"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white p-10 font-mono">
          <h1 className="text-3xl font-bold mb-4">React App Crashed</h1>
          <p className="mb-4 font-bold text-lg">Please screenshot this entire red screen and send it to Sahil so he can fix it instantly:</p>
          <div className="bg-black p-6 rounded-lg text-red-400 overflow-auto border border-red-500">
            <strong className="text-xl">{this.state.error && this.state.error.toString()}</strong>
            <br /><br />
            <pre className="text-sm opacity-80">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeApp() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId="742455468037-15nrh5etl1r764tu66958coe6437rs4m.apps.googleusercontent.com">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/proposal/:id" element={<PublicProposal />} />
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}