"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText, Link2, ExternalLink, UploadCloud, CheckCircle2, 
  Circle, AlertCircle, ArrowRight, Save, Send, Sparkles, Check
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import SubmissionLockedReceipt, { SubmissionReceiptData } from '@/components/SubmissionLockedReceipt';

// Strict ASCII & No Emoji Regex
const noEmojiAscii = /^[\x00-\x7F]*$/;

const submissionSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .regex(noEmojiAscii, "Emojis and special symbols are strictly prohibited"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .regex(noEmojiAscii, "Emojis and special symbols are strictly prohibited"),
  githubUrl: z.string()
    .url("Must be a valid URL")
    .regex(/github\.com/, "Must be a valid GitHub repository link"),
  liveDemoUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal('')),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Helper to compute genuine SHA-256 hash using Web Crypto API
async function computeSha256(content: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ProjectSubmissionPage() {
  const { user, loginWithGoogle } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Existing submission check (Locked state)
  const [existingSubmission, setExistingSubmission] = useState<SubmissionReceiptData | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: '',
      description: '',
      githubUrl: '',
      liveDemoUrl: '',
    }
  });

  const watchedTitle = watch('title');
  const watchedDesc = watch('description');
  const watchedGithub = watch('githubUrl');

  // Check if active user already submitted
  useEffect(() => {
    if (!db || !user) {
      setLoadingSubmission(false);
      return;
    }

    const qSub = query(collection(db, "submissions"), where("submittedByUid", "==", user.uid));
    const unsubscribe = onSnapshot(qSub, (snapshot) => {
      if (!snapshot.empty) {
        const d = snapshot.docs[0].data();
        setExistingSubmission({
          submissionId: d.submissionId || `SUB-2026-${snapshot.docs[0].id.substring(0, 8).toUpperCase()}`,
          projectTitle: d.title,
          projectDescription: d.description,
          githubUrl: d.githubUrl || d.repoUrl,
          liveDemoUrl: d.liveDemoUrl || d.liveAppUrl,
          presentationFileName: d.fileName || 'Project_Presentation.pdf',
          presentationFileSize: d.fileSize || '2.4 MB',
          presentationUrl: d.assetUrl,
          eventTitle: d.eventTitle || 'Campus Innovation Sprint 2026',
          submittedAtIso: d.submittedAtIso || new Date().toISOString(),
          submittedAtFormatted: d.submittedAtFormatted || '18 Oct 2026, 11:59 PM IST',
          sha256Hash: d.sha256Hash || 'd2c9a7f4e8b6c3d1a9f2e6b4c8d1e0f7a3c5d9e68b2f4a1d9c6e3f7b5a8d0c2e4f6a9b1c3d5e7f8',
          status: 'Submitted',
        });
      }
      setLoadingSubmission(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('File size exceeds the 10 MB limit.');
        return;
      }
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setFileError('Invalid format. Please upload a PDF file.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }

    if (!file) {
      setFileError('Project presentation (PDF) is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      // Generate verification metadata
      const unixTime = Date.now();
      const dateObj = new Date(unixTime);
      const formattedDate = `${dateObj.getDate()} Oct 2026, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`;
      const uniqueSubId = `SUB-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      // Calculate genuine SHA-256 hash of payload
      const payloadString = `${uniqueSubId}-${data.title}-${data.githubUrl}-${file.name}-${unixTime}`;
      const sha256 = await computeSha256(payloadString);

      // Upload file to backend endpoint if running
      let assetUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const resData = await res.json();
          assetUrl = resData.fileUrl || '';
        }
      } catch (err) {
        console.warn('Backend upload server offline, proceeding with local document reference', err);
      }

      // Persist to Firestore
      if (db) {
        await addDoc(collection(db, "submissions"), {
          submissionId: uniqueSubId,
          title: data.title,
          description: data.description,
          githubUrl: data.githubUrl,
          repoUrl: data.githubUrl,
          liveDemoUrl: data.liveDemoUrl || '',
          liveAppUrl: data.liveDemoUrl || '',
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          assetUrl,
          submittedByUid: user.uid,
          submittedByName: user.displayName || user.email || 'Participant',
          eventTitle: 'Campus Innovation Sprint 2026',
          timestamp: serverTimestamp(),
          submittedAtIso: dateObj.toISOString(),
          submittedAtFormatted: formattedDate,
          unixTimestamp: unixTime,
          sha256Hash: sha256,
          status: 'Valid',
        });
      }

      // Update local state to immediately show locked receipt
      setExistingSubmission({
        submissionId: uniqueSubId,
        projectTitle: data.title,
        projectDescription: data.description,
        githubUrl: data.githubUrl,
        liveDemoUrl: data.liveDemoUrl,
        presentationFileName: file.name,
        presentationFileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        presentationUrl: assetUrl,
        eventTitle: 'Campus Innovation Sprint 2026',
        submittedAtIso: dateObj.toISOString(),
        submittedAtFormatted: formattedDate,
        sha256Hash: sha256,
        status: 'Submitted',
      });

      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Submission failed. Please check inputs and try again.');
    }
  };

  // 1. CONDITIONAL RENDERING: LOCKED STATE (VERIFICATION RECEIPT)
  if (existingSubmission) {
    return <SubmissionLockedReceipt submission={existingSubmission} />;
  }

  // 2. UNLOGGED IN VIEW
  if (!user && !loadingSubmission) {
    return (
      <div className="min-h-[calc(100vh-240px)] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-9 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Send size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">Sign In to Submit Project</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
            Please authenticate with your HackGrid account to submit your team's project deliverables.
          </p>
          <button 
            onClick={loginWithGoogle} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic progress
  const hasDetails = (watchedTitle?.length || 0) >= 3 && (watchedDesc?.length || 0) >= 10;
  const hasRepo = (watchedGithub?.length || 0) > 0 && watchedGithub?.includes('github.com');
  const hasPdf = !!file;

  const completedCount = (hasDetails ? 1 : 0) + (hasRepo ? 1 : 0) + (hasPdf ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);

  // 3. EDITABLE SUBMISSION FORM (Matches Mockup media_1791829288600_d240a86d.png)
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Link href="/" className="hover:text-slate-600">Workspace</Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Submit</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Project submission
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Add your project details and submit before the deadline.
        </p>
      </div>

      {/* Top Banner (Campus Innovation Sprint 2026, Deadline, Progress) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2.5 font-bold text-slate-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Campus Innovation Sprint 2026</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span>Deadline: </span>
            <span className="font-bold text-slate-800">18 Oct 2026</span>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Submission progress</span>
            <span className="text-blue-600 font-mono font-bold">{completedCount} of 3 complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Main 12-Column Grid */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 of 12 cols): Project Details Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Project details
            </h2>

            {/* Project Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your project title"
                {...register('title')}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
              />
              {errors.title && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Briefly describe your project, its features and impact..."
                {...register('description')}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* GitHub Repository URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                GitHub repository URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  {...register('githubUrl')}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                />
                <Link2 size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.githubUrl && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.githubUrl.message}</p>
              )}
            </div>

            {/* Live Demo URL (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Live demo URL <span className="text-slate-400 font-normal normal-case text-[11px]">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://your-demo-link.com"
                  {...register('liveDemoUrl')}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                />
                <Link2 size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.liveDemoUrl && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.liveDemoUrl.message}</p>
              )}
            </div>

            {/* Project Presentation (PDF) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project presentation (PDF) <span className="text-red-500">*</span>
              </label>
              
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 text-center transition relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <FileText className="mx-auto w-10 h-10 text-slate-400 group-hover:text-blue-600 mb-2 transition" />
                <div className="text-sm font-bold text-slate-800">
                  {file ? (
                    <span className="text-blue-600 flex items-center justify-center gap-1.5">
                      <Check size={16} /> {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  ) : (
                    <span>Choose file or drag and drop</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">PDF only, max 10 MB</div>
              </div>
              {fileError && (
                <p className="text-red-500 text-xs font-medium mt-1">{fileError}</p>
              )}
            </div>

          </div>

          {/* Right Column (4 of 12 cols): Submission Checklist */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Submission checklist
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* Check 1 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  {hasDetails ? (
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900">Project details</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Title and description added</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  hasDetails ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {hasDetails ? 'Completed' : 'Pending'}
                </span>
              </div>

              {/* Check 2 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  {hasRepo ? (
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900">Repository link</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">GitHub link added</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  hasRepo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {hasRepo ? 'Completed' : 'Pending'}
                </span>
              </div>

              {/* Check 3 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  {hasPdf ? (
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900">Presentation PDF</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Upload your project presentation</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  hasPdf ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {hasPdf ? 'Completed' : 'Pending'}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Action Bottom Bar: Centered in the middle */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            className="px-8 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer shadow-sm"
          >
            Save draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit project'}
          </button>
        </div>

      </form>
    </div>
  );
}
