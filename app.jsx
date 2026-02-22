import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, 
  VolumeX, 
  Lightbulb, 
  Scaling, 
  Brain, 
  Leaf, 
  Info,
  ChevronRight,
  ArrowRight,
  Sparkles, 
  Loader2, 
  FileText, 
  AlertCircle, 
  Camera, 
  Search, 
  CheckCircle2, 
  Tag, 
  History, 
  Trash2, 
  Clock, 
  Filter, 
  PieChart, 
  Target, 
  ExternalLink, 
  BookOpen, 
  Scale,
  MessageSquare,
  Layout,
  Users,
  UserPlus,
  Lock,
  Key,
  X,
  CheckCircle,
  Wifi,
  Settings
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Environment Variables
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'neurodiversity-archivist';

// Initialize Firebase services with safe checks
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
}

const App = () => {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [structuredPractical, setStructuredPractical] = useState(null);
  const [sources, setSources] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('Frameworks for adjustments');
  
  // BYOK State
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'error' | null
  const platformApiKey = ""; // Environment placeholder

  // Sensory Audit State
  const [auditImage, setAuditImage] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const fileInputRef = useRef(null);

  // UI State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [filterPillar, setFilterPillar] = useState('All');

  const activeApiKey = userApiKey.trim() || platformApiKey;

  const pillarsList = [
    { name: 'Deep dive', description: 'Drill down into legislation.', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500' },
    { name: 'Frameworks for adjustments', description: 'Improving sensory safety.', color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' },
    { name: 'Lived Experience', description: 'Narrative success stories.', color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-500' }
  ];

  const primaryPillars = [
    { id: 'legal', title: 'The Legal Mandate', icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-blue-600', text: 'Under the Equality Act 2010, the duty to make reasonable adjustments is a proactive legal requirement.', stats: 'Statutory Obligation' },
    { id: 'practical', title: 'Practical Adjustments', icon: <Scaling className="w-6 h-6" />, color: 'bg-emerald-600', text: 'Environmental changes should follow a "Difference, not Deficit" framework.', stats: 'ROI: High Productivity' },
    { id: 'values', title: 'Individual Liberty', icon: <Leaf className="w-6 h-6" />, color: 'bg-amber-600', text: 'Protecting Individual Liberty means ensuring every professional has the environment they need.', stats: 'British Values' }
  ];

  const secondaryPillars = [
    { id: 'respect', title: 'Mutual Respect', icon: <Users className="w-6 h-6" />, color: 'bg-indigo-600', text: 'Promoting mutual respect involves valuing different cognitive processing styles without social conformity.', stats: 'British Values' },
    { id: 'recruitment', title: 'Inclusive Recruitment', icon: <UserPlus className="w-6 h-6" />, color: 'bg-rose-600', text: 'Moving toward skills-based assessments ensures candidates are evaluated on role performance.', stats: 'Equitable Growth' },
    { id: 'safety', title: 'Psychological Safety', icon: <Lock className="w-6 h-6" />, color: 'bg-slate-700', text: 'A safe environment reduces cognitive load, allowing for professional innovation and well-being.', stats: 'Culture Standard' }
  ];

  const sensoryZones = [
    { title: "Auditory Environment", icon: <VolumeX className="text-blue-500" />, action: "Implement 'Quiet Zones' and normalize noise-canceling tech.", impact: "Reduces cognitive drain from ambient noise." },
    { title: "Visual Environment", icon: <Lightbulb className="text-amber-500" />, action: "Utilize non-linear lighting and provide adjustable blinds.", impact: "Prevents overload from fluorescent flickering." },
    { title: "Communication Style", icon: <Brain className="text-emerald-500" />, action: "Clear, written instructions over ambiguous verbal requests.", impact: "Enhances clarity and reduces processing lag." }
  ];

  const statutes = [
    { name: '#EqualityAct2010', url: 'https://www.legislation.gov.uk/ukpga/2010/15/contents' },
    { name: '#AutismAct2009', url: 'https://www.legislation.gov.uk/ukpga/2009/15/contents' },
    { name: '#SENDCode2015', url: 'https://www.gov.uk/government/publications/send-code-of-practice-0-to-25' },
    { name: '#InclusiveLeadership' },
    { name: '#RuleOfLaw' },
    { name: '#NeurodiversityRights' }
  ];

  const pillarStats = useMemo(() => {
    if (history.length === 0) return null;
    const counts = history.reduce((acc, item) => {
      const p = item.pillar || 'Uncategorized';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const total = history.length;
    const stats = pillarsList.map(p => ({
      ...p,
      count: counts[p.name] || 0,
      percentage: Math.round(((counts[p.name] || 0) / total) * 100)
    }));
    const dominant = [...stats].sort((a, b) => b.count - a.count)[0];
    return { stats, total, dominant };
  }, [history]);

  const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }
      return await response.json();
    } catch (err) {
      if (retries > 0 && !err.message.includes('API key')) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  const testConnection = async () => {
    if (!userApiKey.trim()) return;
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025?key=${userApiKey.trim()}`);
      if (result.ok) setTestResult('success');
      else setTestResult('error');
    } catch (e) {
      setTestResult('error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAuditImage(reader.result); setAuditResult(null); };
      reader.readAsDataURL(file);
    }
  };

  const saveToHistory = async (type, originalInput, result, pillar, sourcesList = null) => {
    if (!user || !result || !db) return;
    try {
      const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'draft_history');
      await addDoc(historyRef, {
        type,
        input: String(originalInput),
        content: typeof result === 'string' ? result : JSON.stringify(result),
        pillar: pillar || 'Frameworks for adjustments',
        sources: sourcesList || [],
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const deleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'draft_history', id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const generatePolicyInsight = async (forcedPrompt = null) => {
    const queryToUse = forcedPrompt || prompt;
    if (!queryToUse.trim()) return;
    
    setLoading(true);
    setError(null);
    setAiResult(null);
    setStructuredPractical(null);
    setSuggestedQuestions([]);

    const isDeepDive = selectedPillar === 'Deep dive';
    const isPractical = selectedPillar === 'Frameworks for adjustments';
    
    let systemPrompt = `You are the Academic Archivist. Pillar: ${selectedPillar}. Use academic tone. Difference, not Deficit. Cite Equality Act 2010 and Autism Act 2009.`;

    if (isDeepDive) {
      systemPrompt += ` CRITICAL: Use search tool. Offer 3-4 probing questions at end with delimiter "---QUESTIONS---".`;
    }

    if (isPractical) {
      systemPrompt += ` CRITICAL: Provide EXACTLY ONE cohesive paragraph. MUST return JSON: { "paragraph": "string", "concise_action": "string", "impact_statement": "string", "title": "string" }`;
    }

    const payload = {
      contents: [{ parts: [{ text: isDeepDive ? `Research latest legal standards for: ${queryToUse}` : `Provide guidance for: ${queryToUse}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: isPractical ? { responseMimeType: "application/json" } : {}
    };

    if (isDeepDive) payload.tools = [{ "google_search": {} }];

    try {
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const fullContent = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (isPractical) {
        const jsonData = JSON.parse(fullContent);
        setStructuredPractical(jsonData);
        setAiResult(jsonData.paragraph);
        saveToHistory('Policy', queryToUse, jsonData, selectedPillar);
      } else {
        let mainContent = fullContent;
        let questions = [];
        if (fullContent.includes("---QUESTIONS---")) {
          const parts = fullContent.split("---QUESTIONS---");
          mainContent = parts[0].trim();
          questions = parts[1].split('\n').map(q => q.replace(/^\d+\.\s*/, '').replace(/^- \s*/, '').trim()).filter(q => q.length > 5);
        }
        setAiResult(mainContent);
        setSuggestedQuestions(questions);
        const attributions = result.candidates?.[0]?.groundingMetadata?.groundingAttributions || [];
        const groundingSources = attributions.map(a => ({ uri: a.web?.uri, title: a.web?.title })).filter(s => s.uri);
        setSources(groundingSources);
        saveToHistory('Policy', queryToUse, mainContent, selectedPillar, groundingSources);
      }
    } catch (err) {
      setError(err.message || "Archivist engine error.");
    } finally {
      setLoading(false);
    }
  };

  const runSensoryAudit = async () => {
    if (!auditImage) return;
    setAuditLoading(true);
    setError(null);
    const base64Data = auditImage.split(',')[1];
    const visionPrompt = `You are a Sensory Design Consultant. Analyze workplace image for barriers. 1 formal paragraph. Reasonable adjustments per Equality Act 2010.`;
    try {
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [ { text: visionPrompt }, { inlineData: { mimeType: "image/png", data: base64Data } } ] }] })
      });
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { setAuditResult(text); saveToHistory('Audit', 'Visual Analysis', text, 'Frameworks for adjustments'); }
    } catch (err) { setError("Audit engine error."); } finally { setAuditLoading(false); }
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {}
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'draft_history');
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setHistory(docs);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredHistory = history.filter(item => filterPillar === 'All' || item.pillar === filterPillar);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 text-sm md:text-base overflow-x-hidden">
      
      {/* BYOK Settings Modal */}
      {showApiKeySettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full border border-slate-100 relative">
            <button onClick={() => { setShowApiKeySettings(false); setTestResult(null); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Key className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-none">Quota Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Personal Gemini API Access</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Your API Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={userApiKey}
                    onChange={(e) => { setUserApiKey(e.target.value); setTestResult(null); }}
                    placeholder="Enter Google Gemini Key..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm pr-12"
                  />
                  {testResult === 'success' && <CheckCircle className="absolute right-4 top-4 text-emerald-500 w-6 h-6" />}
                  {testResult === 'error' && <AlertCircle className="absolute right-4 top-4 text-rose-500 w-6 h-6" />}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Wifi className="w-3 h-3" /> Connectivity Check
                </div>
                <button 
                  onClick={testConnection}
                  disabled={isTestingKey || !userApiKey.trim()}
                  className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTestingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate Personal Connection'}
                </button>
                {testResult === 'success' && <p className="text-[10px] text-emerald-600 font-bold text-center">✓ API Connection Verified. Quota redirected.</p>}
                {testResult === 'error' && <p className="text-[10px] text-rose-600 font-bold text-center">✕ Invalid Key. Re-check Google settings.</p>}
              </div>

              <button 
                onClick={() => setShowApiKeySettings(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-bold tracking-widest text-blue-700 uppercase bg-blue-100 rounded-full">Academic Archivist Series</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">Sensory Safety: The Blueprint for <span className="text-blue-600 italic">Neuro-Affirming</span> Workplaces</h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto md:mx-0">Integrating visual AI and legal frameworks to transform the professional environment.</p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          <button onClick={() => setShowApiKeySettings(true)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm border text-xs ${userApiKey ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-500 border-slate-200'}`}>
            <Settings className="w-4 h-4" />
            {userApiKey ? 'Personal Key Active' : 'Set Personal Key'}
          </button>
          <button onClick={() => {setShowSummary(!showSummary); setShowHistory(false);}} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border text-xs ${showSummary ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}><PieChart className="w-4 h-4" />Summary</button>
          <button onClick={() => {setShowHistory(!showHistory); setShowSummary(false);}} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border text-xs ${showHistory ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}><History className="w-4 h-4" />History {history.length > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-[9px] rounded-full">{history.length}</span>}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-16 pb-24">
        
        {showSummary && pillarStats && (
          <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-indigo-100 animate-in slide-in-from-top-4 relative overflow-hidden w-[95%] md:w-[90%] mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-0"></div>
            <div className="relative z-10 flex flex-col lg:flex-row gap-12">
              <div className="flex-1">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-8"><Target className="w-8 h-8 text-indigo-600" />Strategic Distribution</h2>
                {pillarStats.stats.map((stat) => (
                  <div key={stat.name} className="mb-6">
                    <div className="flex justify-between text-[11px] font-black uppercase mb-2 tracking-widest"><span>{stat.name}</span><span>{stat.percentage}%</span></div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${stat.barColor} transition-all duration-1000 ease-out`} style={{ width: `${stat.percentage}%` }}></div></div>
                  </div>
                ))}
              </div>
              <div className="lg:w-1/3 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-bold mb-3 text-slate-900">Dominant Focus</h3>
                <p className="text-sm text-slate-600 italic leading-relaxed">"Your advocacy is currently centered on {pillarStats.dominant.name.toLowerCase()}."</p>
              </div>
            </div>
          </section>
        )}

        {showHistory && (
          <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-blue-100 animate-in slide-in-from-top-4 w-[95%] md:w-[90%] mx-auto">
            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
              {['All', ...pillarsList.map(p => p.name)].map(p => (
                <button key={p} onClick={() => setFilterPillar(p)} className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest transition-all ${filterPillar === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{p}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
              {filteredHistory.map((item) => (
                <div key={item.id} onClick={() => { if(item.type === 'Policy') { 
                  try { const p = JSON.parse(item.content); setStructuredPractical(p); setAiResult(p.paragraph); } catch { setAiResult(item.content); setStructuredPractical(null); }
                  setPrompt(item.input); setSelectedPillar(item.pillar); } else { setAuditResult(item.content); } 
                  setShowHistory(false); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
                  className="p-6 rounded-3xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between mb-4"><span className="text-[9px] font-black px-2.5 py-1 rounded bg-blue-50 text-blue-700 uppercase tracking-widest">{item.pillar}</span><Trash2 onClick={(e) => deleteHistoryItem(e, item.id)} className="w-5 h-5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all" /></div>
                  <h4 className="font-bold text-sm line-clamp-2 text-slate-800">{item.input}</h4>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- VERTICAL STACKED FLOW (CENTERED 90%) --- */}
        <div className="flex flex-col gap-16 items-center">
          
          {/* Layer 1: Policy Architect */}
          <section className="w-[95%] md:w-[90%] bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl flex flex-col transition-all">
            <div className="flex items-center gap-3 mb-8"><Sparkles className="w-8 h-8 text-blue-200" /><h2 className="text-3xl font-bold tracking-tight">Policy Architect</h2></div>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {pillarsList.map((p) => (
                <button key={p.name} onClick={() => setSelectedPillar(p.name)} className={`flex-1 p-5 rounded-3xl border text-left transition-all ${selectedPillar === p.name ? 'bg-white text-blue-700 border-white shadow-xl scale-[1.03]' : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/10'}`}>
                  <div className="text-[11px] font-black uppercase mb-2 tracking-[0.1em]">{p.name}</div>
                  <div className="text-[10px] opacity-70 leading-relaxed">{p.description}</div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex items-center gap-4">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="flex-1">{error}</p>
                <button onClick={() => setShowApiKeySettings(true)} className="px-3 py-1 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition-all underline">Edit Key</button>
              </div>
            )}

            <div className="space-y-6 mb-10">
              <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter workplace scenario or legislative query..." className="w-full px-7 py-5 rounded-[2rem] bg-white/10 border border-white/20 text-white placeholder:text-blue-200 text-base focus:outline-none focus:ring-4 focus:ring-blue-400/30 transition-all shadow-inner" />
              <button onClick={() => generatePolicyInsight()} disabled={loading || !prompt} className="w-full py-5 bg-white text-blue-700 font-black rounded-[2rem] hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-xl shadow-2xl active:scale-[0.98]">{loading ? <Loader2 className="w-7 h-7 animate-spin" /> : 'Generate Neuro-Affirming Protocol'}</button>
            </div>

            {aiResult && (
              <div className="bg-white text-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-inner animate-in fade-in slide-in-from-bottom-8 max-h-[700px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3 text-blue-600 font-black text-xs uppercase tracking-widest"><FileText className="w-5 h-5" />Archivist Record</div>
                  <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-widest">{selectedPillar}</span>
                </div>
                
                {selectedPillar === 'Frameworks for adjustments' && structuredPractical ? (
                  <div className="mb-10 rounded-3xl bg-emerald-50 border border-emerald-100 overflow-hidden shadow-sm">
                    <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Layout className="w-6 h-6" />
                        <h4 className="font-bold text-sm uppercase tracking-[0.1em]">{structuredPractical.title}</h4>
                      </div>
                      <span className="hidden sm:inline-block text-[9px] font-black opacity-80 bg-white/20 px-3 py-1 rounded-full uppercase tracking-tighter">Neuro-Affirming Standard</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-emerald-100">
                      <div className="p-8">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 tracking-widest">Strategic Impact</p>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{structuredPractical.impact_statement}</p>
                      </div>
                      <div className="p-8 bg-emerald-50/40">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-3 tracking-widest">Policy Action</p>
                        <p className="text-sm font-bold text-emerald-900 leading-relaxed">{structuredPractical.concise_action}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="text-base md:text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">{aiResult}</div>

                {suggestedQuestions.length > 0 && (
                  <div className="mt-12 pt-10 border-t bg-slate-50/50 -mx-8 md:-mx-12 px-8 md:px-12 -mb-8 md:-mb-12 pb-12 rounded-b-[2.5rem]">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-8 flex items-center gap-3"><MessageSquare className="w-6 h-6 text-indigo-500" /> Legislative Deep-Dive</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{suggestedQuestions.map((q, idx) => <button key={idx} onClick={() => { setPrompt(q); generatePolicyInsight(q); }} className="w-full text-left p-5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all text-sm font-medium text-slate-700 flex items-center gap-5 group"><div className="shrink-0 w-8 h-8 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">{idx + 1}</div><span className="line-clamp-2">{q}</span></button>)}</div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Layer 2: Primary Informational Trinity */}
          <div className="w-[95%] md:w-[90%] grid grid-cols-1 md:grid-cols-3 gap-8">
            {primaryPillars.map((pillar) => (
              <div key={pillar.id} className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200 flex flex-col h-full hover:shadow-2xl transition-all hover:-translate-y-2 group">
                <div className={`${pillar.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform`}>{pillar.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 leading-tight">{pillar.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">{pillar.text}</p>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Pillar Standard</span>
                  <span className="text-slate-900">{pillar.stats}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Layer 3: Difference, Not Deficit / Key Adjustments */}
          <section className="w-[95%] md:w-[90%] bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-[35%] bg-slate-900 p-10 md:p-14 text-white relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 italic text-balance leading-tight">Difference, Not Deficit.</h2>
                <p className="text-slate-400 leading-relaxed mb-10 text-sm md:text-base">
                  Reasonable adjustments are not favors. They are essential architectural considerations for cognitive diversity.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 shadow-inner"><ShieldCheck className="w-5 h-5 text-blue-400" /><span className="text-[11px] font-black text-blue-100 uppercase tracking-widest">Equality Act 2010</span></div>
                  <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 shadow-inner"><Brain className="w-5 h-5 text-emerald-400" /><span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">Neuro-Affirming Protocol</span></div>
                </div>
                <div className="mt-12 pt-10 border-t border-slate-800">
                  <div className="flex items-center gap-3 mb-6 text-blue-400/80 text-[10px] uppercase font-black tracking-[0.3em]"><Scale className="w-4 h-4" />Statutory Trinity</div>
                  <div className="flex flex-wrap gap-3">{statutes.map((tag) => tag.url ? <a key={tag.name} href={tag.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-blue-300/70 hover:text-white flex items-center gap-2 transition-all">{tag.name}<ExternalLink className="w-3 h-3" /></a> : <span key={tag.name} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-blue-300/70">{tag.name}</span>)}</div>
                </div>
              </div>
              <div className="md:w-[65%] p-8 md:p-16 flex flex-col justify-center">
                <h3 className="text-2xl md:text-3xl font-bold mb-10 flex items-center gap-4 text-slate-900"><Info className="w-8 h-8 text-blue-600" />Strategic Adjustments</h3>
                <div className="grid grid-cols-1 gap-8">
                  {sensoryZones.map((zone, idx) => (
                    <div key={idx} className="flex gap-6 p-8 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white transition-all shadow-sm">
                      <div className="shrink-0 w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center border border-slate-100">{zone.icon}</div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-slate-900">{zone.title}</h4>
                        <p className="text-slate-700 font-semibold text-sm mb-3">{zone.action}</p>
                        <p className="text-slate-400 text-[11px] font-bold italic flex items-center gap-2 uppercase tracking-wider"><ArrowRight className="w-3 h-3 text-blue-500" /> Impact: {zone.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Layer 4: Secondary Informational Trinity */}
          <div className="w-[95%] md:w-[90%] grid grid-cols-1 md:grid-cols-3 gap-8">
            {secondaryPillars.map((pillar) => (
              <div key={pillar.id} className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-200 flex flex-col h-full hover:shadow-2xl transition-all hover:-translate-y-2 group">
                <div className={`${pillar.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform`}>{pillar.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 leading-tight">{pillar.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">{pillar.text}</p>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Advocacy Theme</span>
                  <span className="text-slate-900">{pillar.stats}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Layer 5: Sensory Audit (Bottom) */}
          <section className="w-[95%] md:w-[90%] bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl border border-slate-200 flex flex-col transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div>
                <div className="flex items-center gap-3 text-slate-900 mb-2"><Search className="w-8 h-8 text-emerald-600" /><h2 className="text-3xl font-bold tracking-tight">Sensory Audit</h2></div>
                <p className="text-slate-500 text-base md:text-lg max-w-2xl font-medium">Identify environmental barriers using <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-2 py-1 rounded ml-1">Vision AI</span> Analysis.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 rounded-full border border-slate-200 bg-slate-50">v2.5 Vision Engine</span>
              </div>
            </div>
            
            {!auditImage ? (
              <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-16 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group min-h-[350px] shadow-inner bg-slate-50/50">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all"><Camera className="w-12 h-12 text-slate-400 group-hover:text-emerald-600" /></div>
                <p className="font-black text-slate-700 text-xl tracking-tight">Select Workplace Perspective</p>
                <p className="text-slate-400 text-sm mt-3 font-medium">Acoustic Shielding • Lighting Flux • Visual Clutter</p>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
              </div>
            ) : (
              <div className="flex-1 space-y-10">
                <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden group border shadow-2xl mx-auto w-full"><img src={auditImage} className="w-full h-full object-cover" alt="Perspective Target" /><button onClick={() => {setAuditImage(null); setAuditResult(null);}} className="absolute top-6 right-6 p-4 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-lg"><X className="w-6 h-6" /></button></div>
                {!auditResult && <button onClick={runSensoryAudit} disabled={auditLoading} className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 text-xl shadow-[0_20px_50px_rgba(5,150,105,0.3)] active:scale-[0.98]">{auditLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Search className="w-7 h-7" /> Execute Sensory Analysis</>}</button>}
                {auditResult && <div className="bg-emerald-50 border border-emerald-100 p-10 md:p-14 rounded-[2.5rem] animate-in fade-in slide-in-from-top-8 max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner"><div className="text-lg italic text-slate-700 leading-relaxed font-semibold">{auditResult}</div></div>}
              </div>
            )}
          </section>

        </div>

        <footer className="text-center pb-16 px-6">
          <div className="max-w-3xl mx-auto p-8 bg-blue-50 border border-blue-100 rounded-[2rem] mb-12 shadow-sm"><p className="text-blue-800 text-xs md:text-sm font-bold italic leading-relaxed text-balance">"The duty to make reasonable adjustments is a proactive obligation on employers to remove barriers that disadvantage neurodivergent professionals."</p><p className="text-blue-600 text-[10px] font-black mt-4 uppercase tracking-[0.3em]">(Equality Act 2010 Compliance Standard)</p></div>
          <div className="text-slate-400 text-[10px] flex flex-col sm:flex-row justify-center items-center gap-4 tracking-[0.4em] font-black uppercase"><span>Academic Archivist</span><span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300"></span><span>Neurodiversity Insight Series</span></div>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
};

export default App;