"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Lightbulb, Code2, Leaf, MonitorPlay, Save, RotateCcw, 
  Send, ExternalLink, Download, FileText, CheckCircle2, 
  Circle, ChevronLeft, ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CriteriaScore {
  innovation: number;
  technical: number;
  impact: number;
  presentation: number;
}

export default function JudgeEvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = (params?.id as string) || 'sub-1';

  // Scoring matrix state (Max: 30, 30, 25, 15 => Total 100)
  const [scores, setScores] = useState<CriteriaScore>({
    innovation: 25,
    technical: 22,
    impact: 20,
    presentation: 12,
  });

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dynamic Total Score Calculation
  const totalScore = useMemo(() => {
    return Number(scores.innovation || 0) + 
           Number(scores.technical || 0) + 
           Number(scores.impact || 0) + 
           Number(scores.presentation || 0);
  }, [scores]);

  // Project data (can be fetched from Firestore or defaults)
  const [projectData, setProjectData] = useState({
    title: 'CropSense',
    teamName: 'Pixel Pioneers',
    track: 'Design & Innovation',
    membersCount: 4,
    description: 'An AI-powered plant disease detection platform that helps farmers identify diseases early using leaf images.',
    githubUrl: 'https://github.com/username/cropsense',
    liveDemoUrl: 'https://cropsense-demo.vercel.app',
    presentationFileName: 'CropSense_Presentation.pdf',
    presentationFileSize: '2.4 MB',
    status: 'Under Review',
    submittedAt: '18 Oct 2026, 11:59 PM',
  });

  useEffect(() => {
    if (!db || !submissionId || submissionId.startsWith('sub-')) return;
    
    getDoc(doc(db, "submissions", submissionId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const isSus = (d.category || d.track || '').includes('Sustainability');
        const isAi = (d.category || d.track || '').includes('AI') || (d.category || '').includes('AIML');
        const trackLabel = isSus ? 'Sustainability' : isAi ? 'AI for Social Impact' : 'Design & Innovation';

        setProjectData({
          title: d.title || '3D Gaussian',
          teamName: d.teamName || d.submittedByName || 'D_039_Sahil_Kasture',
          track: trackLabel,
          membersCount: 4,
          description: d.description || '',
          githubUrl: d.githubUrl || d.repoUrl || 'https://github.com',
          liveDemoUrl: d.liveDemoUrl || d.liveAppUrl || 'https://demo.app',
          presentationFileName: d.fileName || 'Project_Presentation.pdf',
          presentationFileSize: d.fileSize || '2.4 MB',
          status: 'Under Review',
          submittedAt: d.submittedAtFormatted || '18 Oct 2026, 11:59 PM',
        });
      }
    }).catch(err => console.warn(err));
  }, [submissionId]);

  const handleScoreChange = (field: keyof CriteriaScore, val: string, max: number) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      setScores(prev => ({ ...prev, [field]: 0 }));
    } else {
      const clamped = Math.max(0, Math.min(parsed, max));
      setScores(prev => ({ ...prev, [field]: clamped }));
    }
  };

  const handleReset = () => {
    setScores({
      innovation: 0,
      technical: 0,
      impact: 0,
      presentation: 0,
    });
    setFeedback('');
  };

  const handleSubmitEvaluation = async () => {
    setIsSubmitting(true);

    try {
      if (db) {
        // Record into leaderboard collection for real-time ranking update
        await addDoc(collection(db, "leaderboard"), {
          name: projectData.teamName,
          project: projectData.title,
          track: projectData.track || 'Design & Innovation',
          score: totalScore,
          innovationScore: scores.innovation,
          technicalScore: scores.technical,
          impactScore: scores.impact,
          presentationScore: scores.presentation,
          feedback,
          evaluatedAt: serverTimestamp(),
        });

        // Update submission status if existing
        if (!submissionId.startsWith('sub-')) {
          await updateDoc(doc(db, "submissions", submissionId), {
            status: 'Approved',
            score: totalScore,
          });
        }
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        router.push('/admin/submissions');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Navigation */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <Link href="/admin/submissions" className="hover:text-slate-600">Judging</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Evaluate Submission</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Evaluate Submission
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review the project and assign scores based on the evaluation criteria.
          </p>
        </div>

        {/* Event Dropdown & Top Nav */}
        <div className="flex items-center gap-3">
          <select className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800 shadow-sm focus:border-blue-600 outline-none">
            <option>Campus Innovation Sprint 2026</option>
          </select>
        </div>
      </div>

      {/* Pagination Stepper */}
      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-xs">
        <button 
          onClick={() => router.push('/admin/submissions')}
          className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span className="font-bold text-slate-700">
          Submission 3 of 12
        </span>

        <button 
          onClick={() => router.push('/admin/submissions')}
          className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dual-Pane 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANE (8 of 12 cols): Scoring Matrix */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Header & Aggregate Score Display */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Evaluation Criteria
              </h2>
              <p className="text-xs text-slate-500">Tab through fields to grade dynamically.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Total Score:</span>
              <span className="font-mono font-black text-2xl text-blue-600">{totalScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
          </div>

          {/* 4 Criteria Matrix */}
          <div className="space-y-6">
            
            {/* 1. Innovation & Originality */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Innovation & Originality
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Uniqueness of idea and creativity in approach
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-400">Max: 30</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={scores.innovation}
                      onChange={(e) => handleScoreChange('innovation', e.target.value, 30)}
                      className="w-16 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">/ 30</span>
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(scores.innovation / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* 2. Technical Execution */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Technical Execution
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Quality of implementation, architecture and code
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-400">Max: 30</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={scores.technical}
                      onChange={(e) => handleScoreChange('technical', e.target.value, 30)}
                      className="w-16 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">/ 30</span>
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(scores.technical / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* 3. Impact & Feasibility */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Impact & Feasibility
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Real-world impact and practical feasibility
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-400">Max: 25</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={scores.impact}
                      onChange={(e) => handleScoreChange('impact', e.target.value, 25)}
                      className="w-16 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">/ 25</span>
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(scores.impact / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* 4. Presentation & Demo */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MonitorPlay size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Presentation & Demo
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Clarity of presentation and effectiveness of demo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-400">Max: 15</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={scores.presentation}
                      onChange={(e) => handleScoreChange('presentation', e.target.value, 15)}
                      className="w-16 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">/ 15</span>
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(scores.presentation / 15) * 100}%` }}
                />
              </div>
            </div>

          </div>

          {/* Overall Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Overall feedback <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Provide constructive feedback for the team..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
            />
            <div className="text-right text-[11px] font-mono text-slate-400 mt-1">
              {feedback.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Save draft</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitEvaluation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit evaluation'}</span>
              </button>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Evaluation recorded successfully! Redirecting to submissions table...</span>
            </div>
          )}

        </div>

        {/* RIGHT PANE (4 of 12 cols): Project Context & Presentation Viewer */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Project Summary Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {projectData.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {projectData.teamName} • {projectData.membersCount} members
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                {projectData.status}
              </span>
            </div>

            {/* Description */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1">Project description</span>
              <p>{projectData.description}</p>
            </div>

            {/* External Links */}
            <div className="space-y-2 text-xs">
              <a
                href={projectData.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-slate-700 font-medium"
              >
                <span>GitHub repository</span>
                <ExternalLink size={14} className="text-blue-600" />
              </a>

              <a
                href={projectData.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-slate-700 font-medium"
              >
                <span>Live demo URL</span>
                <ExternalLink size={14} className="text-blue-600" />
              </a>
            </div>

            {/* Presentation PDF Card */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">
                  PDF
                </div>
                <div>
                  <div className="font-bold text-slate-900 truncate max-w-[150px]">
                    {projectData.presentationFileName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {projectData.presentationFileSize}
                  </div>
                </div>
              </div>

              <a
                href="/FA1_DevOps_Quick_Notes.pdf"
                download={projectData.presentationFileName}
                className="text-slate-600 hover:text-slate-900 p-1.5 rounded hover:bg-slate-200 transition"
                title="Download presentation"
              >
                <Download size={15} />
              </a>
            </div>
          </div>

          {/* Submission Timeline */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Submission timeline
            </h4>

            <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-5 text-xs">
              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <div className="font-bold text-slate-900">Submitted</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{projectData.submittedAt}</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <div className="font-bold text-blue-600">Under review</div>
                <div className="text-[11px] text-slate-500 mt-0.5">19 Oct - 24 Oct 2026</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 shadow"></div>
                <div className="font-bold text-slate-400">Results announcement</div>
                <div className="text-[11px] text-slate-400 mt-0.5">25 Oct 2026, 12:00 PM</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
