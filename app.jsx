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
  Ear,
  Eye,
  ArrowRight,
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  Tag,
  History,
  Trash2,
  Clock,
  Filter,
  UserCircle,
  PieChart,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';

// Environment Variables
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'neurodiversity-archivist';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('Practical Pillar');
  
  // Sensory Audit State
  const [auditImage, setAuditImage] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const fileInputRef = useRef(null);

  // History State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [filterPillar, setFilterPillar] = useState('All');

  const apiKey = ""; // Provided by environment

  const pillarsList = [
    { name: 'Advocacy Pillar', description: 'Deep dives into legislation.', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500' },
    { name: 'Practical Pillar', description: 'Frameworks for adjustments.', color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' },
    { name: 'Lived Experience', description: 'Narrative Success stories.', color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-500' }
  ];

  // Pillar Analysis Logic
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

  // Helper Functions
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuditImage(reader.result);
        setAuditResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToHistory = async (type, originalInput, result, pillar) => {
    if (!user || !result) return;
    try {
      const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'draft_history');
      await addDoc(historyRef, {
        type,
        input: String(originalInput),
        content: String(result),
        pillar: pillar || 'Practical Pillar',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving history:", err);
    }
  };

  const deleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'draft_history', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // Policy Architect Logic
  const generatePolicyInsight = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setAiResult(null);

    const systemPrompt = `You are the Academic Archivist for Neurodiversity. 
    Content Pillar: ${selectedPillar}. 
    Your goal is to translate workplace scenarios into neuro-affirming policy recommendations based on the Equality Act 2010 and the Autism Act 2009.
    Follow the Paragraph Protocol: use cohesive paragraphs, no bullet points, and high-authority academic tone.
    Focus on "Difference, not Deficit". 
    Include a mention of one British Value (Rule of Law, Individual Liberty, Mutual Respect, or Democracy).
    Cite both the Equality Act 2010 and the Autism Act 2009 using Harvard style.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Scenario: ${prompt}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      if (!response.ok) throw new Error('Failed to reach the Archivist engine.');
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setAiResult(text);
        saveToHistory('Policy', prompt, text, selectedPillar);
      }
    } catch (err) {
      setError("The Archivist is currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  // Sensory Audit Logic (Vision API)
  const runSensoryAudit = async () => {
    if (!auditImage) return;
    setAuditLoading(true);
    setError(null);

    const base64Data = auditImage.split(',')[1];
    const visionPrompt = `You are a Sensory Design Consultant specializing in Neurodiversity.
    Focus: Practical Pillar.
    Analyze this workplace image for potential sensory barriers.
    Structure your response in 2-3 formal paragraphs. No bullet points.
    Identify risks and suggest reasonable adjustments in line with the Equality Act 2010 and the Autism Act 2009.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: visionPrompt },
              { inlineData: { mimeType: "image/png", data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error('Vision analysis failed.');
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAuditResult(text);
        saveToHistory('Audit', 'Visual Environment Analysis', text, 'Practical Pillar');
      }
    } catch (err) {
      setError("The Sensory Audit engine encountered an error.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Auth & Data Listeners
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'draft_history');
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setHistory(docs);
    }, (err) => {
      console.error("Firestore error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredHistory = history.filter(item => filterPillar === 'All' || item.pillar === filterPillar);

  const pillars = [
    {
      id: 'legal',
      title: 'The Legal Mandate',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'bg-blue-600',
      text: 'Under the Equality Act 2010, the duty to make reasonable adjustments is a proactive legal requirement. Failure to address sensory barriers is often an overlooked form of discrimination.',
      stats: 'Statutory Obligation'
    },
    {
      id: 'practical',
      title: 'Practical Adjustments',
      icon: <Scaling className="w-6 h-6" />,
      color: 'bg-emerald-600',
      text: 'Environmental changes should follow a "Difference, not Deficit" framework. Focus on removing barriers rather than expecting the individual to adapt.',
      stats: 'ROI: High Productivity'
    },
    {
      id: 'values',
      title: 'Individual Liberty',
      icon: <Leaf className="w-6 h-6" />,
      color: 'bg-amber-600',
      text: 'Protecting Individual Liberty means ensuring every professional has the environment they need to exercise their unique talents and contribute to society.',
      stats: 'British Values'
    }
  ];

  const sensoryZones = [
    {
      title: "Auditory Environment",
      icon: <VolumeX className="text-blue-500" />,
      action: "Implement 'Quiet Zones' and normalize noise-canceling technology.",
      impact: "Reduces cognitive drain from filtering background noise."
    },
    {
      title: "Visual Environment",
      icon: <Lightbulb className="text-amber-500" />,
      action: "Utilize non-linear lighting and provide adjustable window blinds.",
      impact: "Prevents sensory overload from fluorescent flickering."
    },
    {
      title: "Communication Style",
      icon: <Brain className="text-emerald-500" />,
      action: "Clear, written instructions over ambiguous verbal requests.",
      impact: "Enhances psychological safety and clarity of expectations."
    }
  ];

  const statutes = [
    '#EqualityAct2010',
    '#AutismAct2009',
    '#SENDCode2015',
    '#InclusiveLeadership',
    '#RuleOfLaw',
    '#NeurodiversityRights'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 text-sm md:text-base overflow-x-hidden">
      {/* Header Section */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-left">
          <div className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-blue-700 uppercase bg-blue-100 rounded-full">
            Academic Archivist Series
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Sensory Safety: The Blueprint for <span className="text-blue-600 italic">Neuro-Affirming</span> Workplaces
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            Integrating visual AI and legal frameworks to transform the professional environment.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {setShowSummary(!showSummary); setShowHistory(false);}}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm border whitespace-nowrap ${showSummary ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <PieChart className="w-5 h-5" />
            Pillar Summary
          </button>
          <button 
            onClick={() => {setShowHistory(!showHistory); setShowSummary(false);}}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm border whitespace-nowrap ${showHistory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <History className="w-5 h-5" />
            History
            {history.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">{history.length}</span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12 pb-24">
        
        {/* Pillar Summary View */}
        {showSummary && pillarStats && (
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-indigo-100 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-0"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                    <Target className="w-7 h-7 text-indigo-600" />
                    Strategic Pillar Distribution
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Analyzing your {pillarStats.total} archived professional insights.</p>
                </div>
                <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-slate-600">
                  <ArrowRight className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                  {pillarStats.stats.map((stat) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stat.barColor}`}></div>
                          <span className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">{stat.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{stat.percentage}% <span className="text-slate-400 font-normal ml-1">({stat.count})</span></span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full ${stat.barColor} transition-all duration-1000 ease-out`}
                          style={{ width: `${stat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dominant Pillar Highlight */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
                      <TrendingUp className="w-4 h-4" />
                      Dominant Focus
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{pillarStats.dominant.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "Your advocacy is currently centered on {pillarStats.dominant.name.toLowerCase()}. This focus ensures deep expertise in {pillarStats.dominant.description.toLowerCase()}."
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Archivist Recommendation</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {pillarStats.dominant.name === 'Practical Pillar' 
                        ? 'To strengthen your professional authority, consider integrating more Advocacy Pillar content to leverage the Equality Act 2010 framework.'
                        : pillarStats.dominant.name === 'Advocacy Pillar'
                        ? 'Your legal foundations are strong. Consider adding more Practical Pillar frameworks to demonstrate "Show, Don\'t Just Tell" adjustments.'
                        : 'Balance your lived experience narratives with Practical Pillar sensory audits to provide actionable value to employers.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* History Drawer */}
        {showHistory && (
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-100 animate-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Archived Drafts
                </h2>
                <div className="flex flex-wrap gap-2">
                  {['All', ...pillarsList.map(p => p.name)].map(p => (
                    <button 
                      key={p}
                      onClick={() => setFilterPillar(p)}
                      className={`text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-all ${filterPillar === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="self-end md:self-auto text-slate-400 hover:text-slate-600">
                <ArrowRight className="w-6 h-6 rotate-180" />
              </button>
            </div>
            
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-400 italic text-sm">No drafts found in the {filterPillar} category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if(item.type === 'Policy') { 
                        setAiResult(String(item.content)); 
                        setPrompt(String(item.input)); 
                        setSelectedPillar(String(item.pillar)); 
                      } else { 
                        setAuditResult(String(item.content)); 
                      }
                      setShowHistory(false);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="p-5 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className={`text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'Policy' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {String(item.type)}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {String(item.pillar || 'General')}
                        </span>
                      </div>
                      <button onClick={(e) => deleteHistoryItem(e, item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-800 line-clamp-1 mb-1 text-sm">{String(item.input)}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3 italic mb-4 leading-relaxed flex-grow">{String(item.content)}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Gemini Grid: Architect & Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Policy Architect */}
          <section className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-blue-200" />
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Policy Architect</h2>
              </div>
              <p className="text-blue-100 mb-6 leading-relaxed text-sm md:text-base">
                Draft neuro-affirming policy responses. Select a strategy pillar to align with your organizational goals.
              </p>

              {/* Pillar Selector */}
              <div className="flex flex-wrap md:flex-nowrap gap-2 mb-6">
                {pillarsList.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPillar(p.name)}
                    className={`flex-1 min-w-[120px] p-3 rounded-xl border text-left transition-all ${selectedPillar === p.name ? 'bg-white text-blue-700 border-white shadow-lg' : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/10'}`}
                  >
                    <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1">{p.name}</div>
                    <div className="text-[8px] md:text-[9px] opacity-70 leading-tight">{p.description}</div>
                  </button>
                ))}
              </div>
              
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your workplace scenario..."
                  className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                />
                <button 
                  onClick={generatePolicyInsight}
                  disabled={loading || !prompt}
                  className="w-full py-3 md:py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Draft Response ✨'}
                </button>
              </div>

              {aiResult && (
                <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                      <FileText className="w-3 h-3" />
                      Archivist Record
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-widest">{selectedPillar}</span>
                  </div>
                  <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {aiResult}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sensory Audit (Vision Tool) */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Search className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Sensory Audit <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded ml-2 uppercase tracking-wider font-bold">Vision AI</span></h2>
            </div>
            <p className="text-slate-500 mb-6 leading-relaxed text-sm">
              Upload a workplace photo to identify sensory barriers and receive audit-ready improvement suggestions.
            </p>

            <div className="flex-1 flex flex-col">
              {!auditImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors mb-4">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Click to Upload Image</p>
                  <p className="text-[11px] text-slate-400 mt-2 italic">Analyze Lighting, Clutter, or Layout</p>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  <div className="relative h-48 rounded-2xl overflow-hidden group border border-slate-100">
                    <img src={auditImage} alt="Audit target" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {setAuditImage(null); setAuditResult(null);}}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {!auditResult && (
                    <button 
                      onClick={runSensoryAudit}
                      disabled={auditLoading}
                      className="w-full py-3 md:py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm"
                    >
                      {auditLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Sensory Audit 🔍'}
                    </button>
                  )}

                  {auditResult && (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 max-h-[220px] overflow-y-auto custom-scrollbar">
                       <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em]">
                        <CheckCircle2 className="w-3 h-3" />
                        Audit Findings
                      </div>
                      <div className="text-sm leading-relaxed text-slate-700 italic">
                        {auditResult}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
              <div className={`${pillar.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                {pillar.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {pillar.text}
              </p>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Core Pillar</span>
                <span className="text-slate-900">{pillar.stats}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sensory Intervention Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-slate-900 p-8 md:p-12 text-white relative">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 italic">Difference, Not Deficit.</h2>
                <p className="text-slate-400 leading-relaxed mb-8 text-sm md:text-base">
                  Reasonable adjustments are not favors. They are essential architectural considerations for cognitive diversity.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                    <span className="text-[11px] md:text-xs font-medium text-blue-100 uppercase tracking-tighter">Equality Act 2010 Compliant</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                    <span className="text-[11px] md:text-xs font-medium text-emerald-100 uppercase tracking-tighter">Neuro-Affirming Protocol</span>
                  </div>
                </div>

                {/* Statutory Trinity Hashtags */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-4 text-blue-400/80 text-[10px] uppercase font-bold tracking-[0.2em]">
                     <Tag className="w-3 h-3" />
                     Statutory Trinity
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statutes.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-bold text-blue-300/70 hover:text-white hover:border-blue-400 transition-colors cursor-default whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            </div>
            
            <div className="md:w-2/3 p-8 md:p-12 bg-white">
              <h3 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                Key Environmental Adjustments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
                {sensoryZones.map((zone, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="shrink-0 w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                      {zone.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-base md:text-lg mb-1">{zone.title}</h4>
                      <p className="text-slate-900 font-medium text-xs md:text-sm mb-2">{zone.action}</p>
                      <p className="text-slate-500 text-[11px] md:text-xs italic flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" /> Impact: {zone.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Legal Footer Note */}
        <footer className="text-center pb-12">
          <div className="max-w-2xl mx-auto p-6 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-blue-800 text-[11px] md:text-xs font-medium italic">
              "The duty to make reasonable adjustments is a proactive obligation on employers to remove barriers that disadvantage neurodivergent professionals."
            </p>
            <p className="text-blue-600 text-[9px] md:text-[10px] mt-2 font-bold tracking-widest uppercase">
              (Equality Act 2010)
            </p>
          </div>
          <div className="mt-8 text-slate-400 text-[10px] md:text-xs flex flex-wrap items-center justify-center gap-2">
            <span>Created by the Academic Archivist for Neurodiversity</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
            <span>AI-Enhanced Insight Series</span>
            {user && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
                <span className="text-[9px] md:text-[10px] font-mono opacity-50">UID: {user.uid.substring(0,8)}...</span>
              </>
            )}
          </div>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
};

export default App;
