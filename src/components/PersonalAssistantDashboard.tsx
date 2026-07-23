import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Target, Loader2, Sparkles, AlertCircle, FileText, TrendingUp, Calendar, Trophy, Plus, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface PersonalAssistantProps {
  gmailToken: string | null;
  onAuthRequest: () => void;
}

export const PersonalAssistantDashboard: React.FC<PersonalAssistantProps> = ({ gmailToken, onAuthRequest }) => {
  const [activeTab, setActiveTab] = useState<'emails' | 'marketing' | 'performance'>('emails');
  
  // Email Summarizer State
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [emailTasks, setEmailTasks] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Marketing Checker State
  const [marketingText, setMarketingText] = useState('');
  const [isCheckingMarketing, setIsCheckingMarketing] = useState(false);
  const [marketingResult, setMarketingResult] = useState<string | null>(null);
  const [marketingError, setMarketingError] = useState<string | null>(null);

  // Performance Tracker State
  const [achievements, setAchievements] = useState<Array<{ id: string, title: string, impact: string, date: string }>>(() => {
    const saved = localStorage.getItem('argus_achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [newAchieveTitle, setNewAchieveTitle] = useState('');
  const [newAchieveImpact, setNewAchieveImpact] = useState('');

  useEffect(() => {
    localStorage.setItem('argus_achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Email Tasks Logic
  const handleSummarizeEmails = async () => {
    if (!gmailToken) {
      onAuthRequest();
      return;
    }
    
    setIsFetchingEmails(true);
    setEmailError(null);
    setEmailTasks(null);

    try {
      // 1. Fetch unread emails
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5`,
        { headers: { Authorization: `Bearer ${gmailToken}` } }
      );
      
      if (!listRes.ok) throw new Error("Échec de la récupération Gmail");
      
      const listData = await listRes.json();
      const messages = listData.messages || [];
      
      if (messages.length === 0) {
        setEmailTasks("Aucun courriel non lu.");
        setIsFetchingEmails(false);
        return;
      }

      // 2. Fetch email details
      const emailDetails = [];
      for (const msg of messages) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          { headers: { Authorization: `Bearer ${gmailToken}` } }
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans objet';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
          let body = detailData.snippet || '';
          
          emailDetails.push({ from, subject, body });
        }
      }

      // 3. Summarize with Gemini
      const sumRes = await fetch('/api/assistant/summarize-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailDetails })
      });
      
      if (!sumRes.ok) throw new Error("Échec de la génération des tâches");
      const sumData = await sumRes.json();
      setEmailTasks(sumData.tasks);
      
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Erreur lors du traitement des courriels');
    } finally {
      setIsFetchingEmails(false);
    }
  };

  // Marketing Checker Logic
  const handleCheckCompliance = async () => {
    if (!marketingText.trim()) return;
    
    setIsCheckingMarketing(true);
    setMarketingError(null);
    setMarketingResult(null);

    try {
      const sumRes = await fetch('/api/assistant/check-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: marketingText })
      });
      
      if (!sumRes.ok) throw new Error("Échec de la vérification");
      const sumData = await sumRes.json();
      setMarketingResult(sumData.analysis);
      
    } catch (err: any) {
      console.error(err);
      setMarketingError(err.message || 'Erreur lors de la vérification');
    } finally {
      setIsCheckingMarketing(false);
    }
  };

  // Performance Tracker Logic
  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchieveTitle.trim()) return;
    
    const newAchieve = {
      id: Math.random().toString(36).substr(2, 9),
      title: newAchieveTitle,
      impact: newAchieveImpact,
      date: new Date().toISOString()
    };
    
    setAchievements([newAchieve, ...achievements]);
    setNewAchieveTitle('');
    setNewAchieveImpact('');
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter(a => a.id !== id));
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Compétences Agentiques</h1>
            <p className="text-sm text-slate-400 font-mono mt-1">Automatisation personnelle & Analyse de conformité</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emails' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" /> INBOX -&gt; TÂCHES
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'marketing' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Target className="w-4 h-4" /> CONFORMITÉ MARQUE
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'performance' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> RÉUSSITES
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {/* 1. EMAIL TASKS */}
        {activeTab === 'emails' && (
          <motion.div
            key="tab-emails"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="font-sans font-bold text-white">Extraction de Tâches Gmail</h3>
              </div>
              <p className="text-sm text-slate-400">
                L'IA va lire vos derniers courriels non lus et générer une liste de tâches structurée pour optimiser votre journée.
              </p>
              
              <div className="flex-1 flex flex-col justify-center py-8">
                {gmailToken ? (
                  <button
                    onClick={handleSummarizeEmails}
                    disabled={isFetchingEmails}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {isFetchingEmails ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Analyse en cours...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Générer les Tâches depuis Gmail</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onAuthRequest}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Connecter Gmail (Workspace)
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-6 h-[500px] overflow-y-auto relative">
              <h4 className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider">Résultat de l'analyse</h4>
              
              {emailError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{emailError}</p>
                </div>
              )}
              
              {emailTasks && (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <Markdown>{emailTasks}</Markdown>
                </div>
              )}

              {!emailTasks && !emailError && !isFetchingEmails && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center opacity-30">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-mono text-xs">AUNCUNE TÂCHE GÉNÉRÉE</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. MARKETING COMPLIANCE */}
        {activeTab === 'marketing' && (
          <motion.div
            key="tab-marketing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="font-sans font-bold text-white">Vérificateur de Ligne Éditoriale</h3>
              </div>
              <p className="text-sm text-slate-400">
                Collez votre brouillon marketing ci-dessous. L'IA vérifiera sa conformité avec le ton moderne, sérieux et innovant de la marque.
              </p>
              
              <textarea
                value={marketingText}
                onChange={e => setMarketingText(e.target.value)}
                placeholder="Insérez votre texte ici..."
                className="w-full flex-1 min-h-[250px] bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
              />

              <button
                onClick={handleCheckCompliance}
                disabled={isCheckingMarketing || !marketingText.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingMarketing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyse...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Vérifier la conformité</>
                )}
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-6 h-[600px] overflow-y-auto">
              <h4 className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider">Rapport d'audit</h4>
              
              {marketingError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{marketingError}</p>
                </div>
              )}
              
              {marketingResult && (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <Markdown>{marketingResult}</Markdown>
                </div>
              )}

              {!marketingResult && !marketingError && !isCheckingMarketing && (
                <div className="flex flex-col items-center justify-center h-full opacity-30 pointer-events-none">
                  <FileText className="w-12 h-12 mb-2" />
                  <p className="font-mono text-xs">EN ATTENTE DE TEXTE</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. PERFORMANCE TRACKER */}
        {activeTab === 'performance' && (
          <motion.div
            key="tab-performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Input Form */}
            <div className="lg:col-span-5 bg-slate-900/40 rounded-xl border border-slate-800 p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-sans font-bold text-white">Journal des Réussites</h3>
              </div>
              <p className="text-sm text-slate-400">
                Documentez vos victoires professionnelles pour préparer efficacement vos évaluations de performance (entretiens annuels, bilans).
              </p>

              <form onSubmit={handleAddAchievement} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Titre de la réussite</label>
                  <input
                    type="text"
                    required
                    value={newAchieveTitle}
                    onChange={e => setNewAchieveTitle(e.target.value)}
                    placeholder="ex: Refonte de l'API de facturation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Impact / Chiffres clés</label>
                  <textarea
                    required
                    value={newAchieveImpact}
                    onChange={e => setNewAchieveImpact(e.target.value)}
                    placeholder="ex: Réduction du temps de réponse de 40%, gain de 2j/homme par mois..."
                    className="w-full min-h-[100px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newAchieveTitle.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Ajouter au journal
                </button>
              </form>
            </div>

            {/* Right: List of achievements */}
            <div className="lg:col-span-7 bg-slate-950/80 rounded-xl border border-slate-800 p-6 min-h-[500px]">
              <h4 className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider flex justify-between">
                <span>Historique des réussites</span>
                <span className="text-indigo-400">{achievements.length} enregistrement(s)</span>
              </h4>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {achievements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 opacity-30 text-center">
                    <Trophy className="w-10 h-10 mb-2" />
                    <p className="font-mono text-xs">AUCUNE RÉUSSITE ENREGISTRÉE</p>
                    <p className="font-sans text-sm mt-2 max-w-[250px]">Commencez à tracer vos succès pour construire votre dossier d'évaluation.</p>
                  </div>
                ) : (
                  achievements.map((ach) => (
                    <div key={ach.id} className="group relative bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                      <button 
                        onClick={() => removeAchievement(ach.id)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs font-mono"
                      >
                        SUPPRIMER
                      </button>
                      <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(ach.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <h5 className="text-lg font-bold text-white mb-2">{ach.title}</h5>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-300">
                        {ach.impact}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
