"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, Lock, FileText, AlignLeft, Link2, ExternalLink, 
  Download, Copy, Check, Printer, Clock, ShieldCheck, Trophy, ArrowRight
} from 'lucide-react';

export interface SubmissionReceiptData {
  submissionId: string;
  projectTitle: string;
  projectDescription: string;
  githubUrl: string;
  liveDemoUrl?: string;
  presentationFileName: string;
  presentationFileSize?: string;
  presentationUrl?: string;
  eventTitle: string;
  submittedAtIso: string;
  submittedAtFormatted: string;
  sha256Hash: string;
  status: 'Submitted' | 'Under Review' | 'Valid' | 'Disqualified';
}

interface SubmissionLockedReceiptProps {
  submission: SubmissionReceiptData;
  onPrint?: () => void;
}

export default function SubmissionLockedReceipt({
  submission,
  onPrint,
}: SubmissionLockedReceiptProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrintReceipt = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Printable Receipt CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-submission-receipt, #printable-submission-receipt * {
            visibility: visible;
          }
          #printable-submission-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Page Title & Breadcrumb */}
      <div className="border-b border-slate-200 pb-4 no-print">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Link href="/" className="hover:text-slate-600">Workspace</Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Submit</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Project submitted
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Your project has been submitted successfully. You can view the details below.
        </p>
      </div>

      <div id="printable-submission-receipt" className="space-y-8">
        {/* Top Success Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <CheckCircle2 size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Submission successful!
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Your project has been submitted for <span className="font-semibold text-slate-900">{submission.eventTitle || 'Campus Innovation Sprint 2026'}</span>.
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                You will be notified about the results via email and on the platform.
              </p>
            </div>
          </div>

          <div className="bg-white/80 border border-emerald-200 rounded-xl px-4 py-2.5 text-left md:text-right w-full md:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Submitted on
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {submission.submittedAtFormatted || '18 Oct 2026, 11:59 PM IST'}
            </span>
          </div>
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (8 of 12 columns): Submission Details */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
            
            {/* Header with Locked Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submission details
                </h3>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock size={12} className="text-emerald-600" />
                  <span>Submitted</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  No further changes can be made.
                </span>
              </div>
            </div>

            {/* Field Rows */}
            <div className="space-y-6 text-sm">
              
              {/* Project Title */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                    Project title
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {submission.projectTitle}
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlignLeft size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                    Project description
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {submission.projectDescription}
                  </p>
                </div>
              </div>

              {/* GitHub Repository */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Link2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                    GitHub repository
                  </span>
                  <a
                    href={submission.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold break-all hover:underline"
                  >
                    <span>{submission.githubUrl}</span>
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </a>
                </div>
              </div>

              {/* Live Demo URL */}
              {submission.liveDemoUrl && (
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Link2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                      Live demo URL
                    </span>
                    <a
                      href={submission.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold break-all hover:underline"
                    >
                      <span>{submission.liveDemoUrl}</span>
                      <ExternalLink size={14} className="flex-shrink-0" />
                    </a>
                  </div>
                </div>
              )}

              {/* Project Presentation PDF */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Project presentation
                  </span>
                  
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs uppercase">
                        PDF
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {submission.presentationFileName || 'Project_Presentation.pdf'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {submission.presentationFileSize || '2.4 MB'}
                        </div>
                      </div>
                    </div>

                    {submission.presentationUrl ? (
                      <a
                        href={submission.presentationUrl}
                        download={submission.presentationFileName}
                        className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-200 transition"
                        title="Download uploaded file"
                      >
                        <Download size={16} />
                      </a>
                    ) : (
                      <button
                        onClick={handlePrintReceipt}
                        className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-200 transition"
                        title="Download submission receipt"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN (4 of 12 columns): Verification & Next Steps */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Verification Metadata */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Verification
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use the details below to verify your submission.
                </p>
              </div>

              {/* Submission ID */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-500">Submission ID</span>
                  <button
                    onClick={() => handleCopy(submission.submissionId, 'id')}
                    className="text-slate-400 hover:text-slate-700 transition"
                    aria-label="Copy submission ID"
                  >
                    {copiedField === 'id' ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 truncate">
                  {submission.submissionId}
                </div>
              </div>

              {/* Submitted at (IST) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-500">Submitted at (IST)</span>
                  <button
                    onClick={() => handleCopy(submission.submittedAtFormatted, 'time')}
                    className="text-slate-400 hover:text-slate-700 transition"
                    aria-label="Copy timestamp"
                  >
                    {copiedField === 'time' ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-900">
                  {submission.submittedAtFormatted}
                </div>
              </div>

              {/* SHA-256 Hash */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-500">File hash (SHA-256)</span>
                  <button
                    onClick={() => handleCopy(submission.sha256Hash, 'hash')}
                    className="text-slate-400 hover:text-slate-700 transition"
                    aria-label="Copy hash"
                  >
                    {copiedField === 'hash' ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-600 break-all leading-tight">
                  {submission.sha256Hash}
                </div>
              </div>
            </div>

            {/* Card 2: What's Next Timeline */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
              <h4 className="text-base font-bold text-slate-900">
                What's next?
              </h4>

              <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-6 text-xs">
                {/* Step 1: Completed */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                  <div className="font-bold text-slate-900">Submission completed</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{submission.submittedAtFormatted || '18 Oct 2026, 11:59 PM'}</div>
                </div>

                {/* Step 2: Under Review */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  </div>
                  <div className="font-bold text-slate-900">Under review</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">19 Oct - 24 Oct 2026</div>
                </div>

                {/* Step 3: Results Announcement */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 shadow"></div>
                  <div className="font-bold text-slate-400">Results announcement</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">25 Oct 2026, 12:00 PM</div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Print Receipt & Leaderboard */}
            <div className="space-y-3 no-print">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Download Verification Receipt (PDF)</span>
              </button>

              <Link
                href="/leaderboard"
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <Trophy size={15} className="text-amber-500" />
                <span>View Live Leaderboard</span>
                <ArrowRight size={13} />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
