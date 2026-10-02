"use client";

import { useState, useEffect } from 'react';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { CalendarPlus, ShieldAlert, LockKeyhole, FileText, DownloadCloud, GitBranch, Server, ClipboardCheck, X, PenTool, Palette } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Submission = {
  id: string;
  eventId?: string;
  eventTitle?: string;
  category?: string;
  title: string;
  description: string;
  repoUrl?: string;
  liveAppUrl?: string;
  figmaUrl?: string;
  submittedBy: string;
  hasAsset: boolean;
  assetUrl?: string;
  status?: string;
};

export default function AdminDashboardPage() {
  const { addEvent } = useEvents();
  const { user, loginAnonymously } = useAuth();

  const [formData, setFormData] = useState({ title: '', category: '', dateRange: '', description: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [activeEvalSub, setActiveEvalSub] = useState<Submission | null>(null);
  
  // Checklist states
  const [checks, setChecks] = useState({
    c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false
  });

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "submissions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
      setSubmissions(fetched);
    });
    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvent(formData);
    setSuccessMsg('Event successfully published to the live database!');
    setFormData({ title: '', category: '', dateRange: '', description: '' });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateSubmissionStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "submissions", id), { status: newStatus });
      
      if (newStatus === 'Approved' && activeEvalSub) {
        await addDoc(collection(db, "leaderboard"), {
          name: activeEvalSub.title,
          project: activeEvalSub.eventTitle || 'DevOps Project',
          track: activeEvalSub.category === 'UI/UX' ? 'UI/UX Track' : 'Cloud Architecture',
          infrastructureScore: 38,
          configurationScore: 28,
          deploymentScore: 29,
          score: 95
        });
      }
      
      setEvalModalOpen(false);
    } catch (e) {
      console.error("Error updating status: ", e);
    }
  };

  const openEvalModal = (sub: Submission) => {
    setActiveEvalSub(sub);
    setChecks({ c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false });
    setEvalModalOpen(true);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <LockKeyhole className="mx-auto text-slate-300 w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-8 text-sm">You must have administrator privileges to access the event management console.</p>
        <button onClick={loginAnonymously} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-md">
          Authenticate to Continue
        </button>
      </div>
    );
  }

  const isUiUxEval = activeEvalSub?.category === 'UI/UX';
  
  // UI/UX needs 5 checks, DevOps needs 7 checks
  const allChecksPassed = isUiUxEval 
    ? checks.c1 && checks.c2 && checks.c3 && checks.c4 && checks.c5
    : checks.c1 && checks.c2 && checks.c3 && checks.c4 && checks.c5 && checks.c6 && checks.c7;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Event Creation Form */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <ShieldAlert className="text-amber-500 w-8 h-8" />
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
            <p className="text-slate-500 text-sm">Create events and review live project submissions.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><CalendarPlus size={20}/> Broadcast New Event</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Event Title</label>
                <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Cyber Security Sprint" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Category / Track</label>
                <input required name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. UI/UX or DevOps" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Date Range</label>
              <input required name="dateRange" value={formData.dateRange} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Dec 10 - Dec 12, 2026" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 h-32 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none" placeholder="Detail the core objective and rules of the hackathon..." />
            </div>
            {successMsg && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">{successMsg}</div>}
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2">
              <CalendarPlus size={18} /> Publish Event
            </button>
          </form>
        </div>
      </div>

      {/* Review Submissions Panel */}
      <div className="space-y-6">
        <h3 className="font-bold text-2xl text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="text-blue-600" /> Incoming Submissions
        </h3>
        
        {submissions.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
            No submissions have been received yet.
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => {
              const isUiUx = sub.category === 'UI/UX';
              
              return (
                <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8 justify-between hover:shadow-md transition-all relative overflow-hidden">
                  {/* Left Side: Meta Info */}
                  <div className="space-y-4 flex-grow z-10">
                    <div>
                      {sub.eventTitle && <div className={`text-xs font-black uppercase tracking-widest mb-1 ${isUiUx ? 'text-amber-500' : 'text-blue-600'}`}>{sub.eventTitle}</div>}
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-2xl text-slate-900">{sub.title}</h4>
                        {sub.status === 'Approved' && <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold border border-emerald-200">Approved</span>}
                        {sub.status === 'Rejected' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold border border-red-200">Rejected</span>}
                        {(!sub.status || sub.status === 'Pending') && <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-bold border border-slate-200">Pending Review</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">Submitted By: {sub.submittedBy}</div>
                    </div>
                    
                    <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">{sub.description}</p>
                  </div>
                  
                  {/* Right Side: Actions */}
                  <div className="lg:w-64 flex-shrink-0 flex flex-col gap-3 justify-center border-l-0 lg:border-l border-slate-100 lg:pl-8 z-10">
                    <div className="space-y-2">
                      {isUiUx ? (
                        sub.figmaUrl && (
                          <a href={sub.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-amber-50 hover:text-amber-700 border border-slate-200 transition">
                            <PenTool size={16}/> View Prototype
                          </a>
                        )
                      ) : (
                        <>
                          {sub.repoUrl && (
                            <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-slate-100 hover:text-black border border-slate-200 transition">
                              <GitBranch size={16}/> View Repository
                            </a>
                          )}
                          {sub.liveAppUrl && (
                            <a href={sub.liveAppUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-indigo-50 text-indigo-700 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition">
                              <Server size={16}/> View Live App
                            </a>
                          )}
                        </>
                      )}
                      
                      {sub.hasAsset && sub.assetUrl && (
                        <a href={sub.assetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-blue-100 border border-blue-200 transition">
                          <DownloadCloud size={16}/> {isUiUx ? 'Mockups' : 'Workflow Diagram'}
                        </a>
                      )}
                    </div>
                    
                    <div className="pt-4 mt-2 border-t border-slate-100">
                      {sub.status === 'Pending' || !sub.status ? (
                        <button onClick={() => openEvalModal(sub)} className={`w-full text-white font-bold py-3 rounded-lg transition shadow-md flex justify-center items-center gap-2 ${isUiUx ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                          <ClipboardCheck size={18}/> Evaluate
                        </button>
                      ) : (
                        <button onClick={() => openEvalModal(sub)} className="w-full border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-50 transition text-sm">
                          Re-evaluate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Rubric Modal */}
      {evalModalOpen && activeEvalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-6 flex justify-between items-center text-white ${isUiUxEval ? 'bg-gradient-to-r from-amber-600 to-pink-600' : 'bg-slate-900'}`}>
              <div>
                <h3 className="font-bold text-xl">{isUiUxEval ? 'UI/UX Design Rubric' : 'DevOps Engineering Rubric'}</h3>
                <p className="text-white/70 text-sm mt-1">Assessing: {activeEvalSub.title}</p>
              </div>
              <button onClick={() => setEvalModalOpen(false)} className="text-white/70 hover:text-white transition p-2 bg-black/20 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6 flex-grow">
              <div className={`p-4 rounded-xl text-sm border font-medium ${isUiUxEval ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                Verify all {isUiUxEval ? 'design' : 'DevOps'} criteria below. You must check all boxes to approve the submission.
              </div>

              <div className="space-y-4">
                {isUiUxEval ? (
                  <>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c1} onChange={(e) => setChecks({...checks, c1: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                      <span className="font-semibold text-slate-700">Figma prototype is accessible and interactive flows work correctly.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c2} onChange={(e) => setChecks({...checks, c2: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                      <span className="font-semibold text-slate-700">Design system utilizes consistent components, typography, and spacing.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c3} onChange={(e) => setChecks({...checks, c3: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                      <span className="font-semibold text-slate-700">Color contrast and hierarchy meet WCAG accessibility standards.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c4} onChange={(e) => setChecks({...checks, c4: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                      <span className="font-semibold text-slate-700">UI scales logically across mobile and desktop viewports.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c5} onChange={(e) => setChecks({...checks, c5: e.target.checked})} className="mt-1 w-5 h-5 accent-amber-600" />
                      <span className="font-semibold text-slate-700">High-fidelity mockups are polished and visually engaging.</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c1} onChange={(e) => setChecks({...checks, c1: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">Workflow diagram provided and accurately reflects the CI/CD pipeline.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c2} onChange={(e) => setChecks({...checks, c2: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">Terraform files present (main.tf, etc.) and apply is successful.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c3} onChange={(e) => setChecks({...checks, c3: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">AWS EC2 instance is currently running and accessible.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c4} onChange={(e) => setChecks({...checks, c4: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">Ansible ping and playbook execution successful.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c5} onChange={(e) => setChecks({...checks, c5: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">Dockerfile is syntactically correct and follows best practices.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c6} onChange={(e) => setChecks({...checks, c6: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">Website is live and fully working in the browser via public IP.</span>
                    </label>
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <input type="checkbox" checked={checks.c7} onChange={(e) => setChecks({...checks, c7: e.target.checked})} className="mt-1 w-5 h-5 accent-blue-600" />
                      <span className="font-semibold text-slate-700">GitHub repository is complete and correctly structured.</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-200 flex gap-4">
              <button onClick={() => updateSubmissionStatus(activeEvalSub.id, 'Rejected')} className="flex-1 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl transition">
                Reject Submission
              </button>
              <button 
                disabled={!allChecksPassed}
                onClick={() => updateSubmissionStatus(activeEvalSub.id, 'Approved')} 
                className={`flex-1 font-bold py-3 rounded-xl transition shadow-lg ${allChecksPassed ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Approve Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
