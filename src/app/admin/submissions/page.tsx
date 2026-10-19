"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, CheckCircle2, Clock, XCircle, Search, Download, 
  Eye, MoreVertical, Trash2, ShieldAlert, Check, X, AlertTriangle,
  ArrowRight, Filter, ChevronDown, CheckSquare, Square
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface AdminSubmission {
  id: string;
  teamName: string;
  teamInitials: string;
  avatarBg: string;
  projectTitle: string;
  track: string;
  trackColor: string;
  submittedOn: string;
  status: 'Valid' | 'Under review' | 'Disqualified';
  assetUrl?: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [trackFilter, setTrackFilter] = useState('All tracks');
  const [selectedEvent, setSelectedEvent] = useState('Campus Innovation Sprint 2026');

  // Context Menu State
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // Destructive Deletion Modal State
  const [deleteTargetSub, setDeleteTargetSub] = useState<AdminSubmission | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync real-time Firestore submissions
  useEffect(() => {
    if (!db) {
      setSubmissions([]);
      return;
    }
    const q = query(collection(db, "submissions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetched: AdminSubmission[] = snapshot.docs.map((docSnap, index) => {
          const d = docSnap.data();
          const name = d.teamName || d.submittedByName || `Team ${index + 1}`;
          const isSus = (d.category || d.track || '').includes('Sustainability');
          const isAi = (d.category || d.track || '').includes('AI') || (d.category || '').includes('AIML');
          const trackLabel = isSus ? 'Sustainability' : isAi ? 'AI for Social Impact' : 'Design & Innovation';

          return {
            id: docSnap.id,
            teamName: name,
            teamInitials: name.substring(0, 2).toUpperCase(),
            avatarBg: index % 2 === 0 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
            projectTitle: d.title || 'Project Solution',
            track: trackLabel,
            trackColor: isSus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isAi ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200',
            submittedOn: d.submittedAtFormatted || '18 Oct 2026, 11:59 PM',
            status: (d.status === 'Approved' ? 'Valid' : d.status === 'Disqualified' ? 'Disqualified' : 'Under review') as any,
            assetUrl: d.assetUrl,
          };
        });

        setSubmissions(fetched);
      } else {
        setSubmissions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return submissions.filter(item => {
      const matchSearch = 
        item.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'All status' || item.status === statusFilter;
      const matchTrack = trackFilter === 'All tracks' || item.track === trackFilter;

      return matchSearch && matchStatus && matchTrack;
    });
  }, [submissions, searchQuery, statusFilter, trackFilter]);

  // Metric KPI counts
  const totalCount = submissions.length;
  const validCount = submissions.filter(s => s.status === 'Valid').length;
  const reviewCount = submissions.filter(s => s.status === 'Under review').length;
  const disqualifiedCount = submissions.filter(s => s.status === 'Disqualified').length;

  // Context Menu Actions
  const handleUpdateStatus = async (id: string, newStatus: 'Valid' | 'Under review' | 'Disqualified') => {
    setOpenMenuRowId(null);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    if (db && !id.startsWith('sub-')) {
      try {
        await updateDoc(doc(db, "submissions", id), { status: newStatus });
      } catch (err) {
        console.error("Failed to update status", err);
      }
    }
  };

  // Execute Strict Deletion
  const handleExecuteDelete = async () => {
    if (!deleteTargetSub) return;
    if (confirmDeleteInput.trim() !== deleteTargetSub.teamName.trim()) {
      return;
    }

    setIsDeleting(true);
    const targetId = deleteTargetSub.id;

    // Remove locally
    setSubmissions(prev => prev.filter(s => s.id !== targetId));

    // Remove from Firestore if real doc
    if (db && !targetId.startsWith('sub-')) {
      try {
        await deleteDoc(doc(db, "submissions", targetId));
      } catch (err) {
        console.error("Failed to delete Firestore document", err);
      }
    }

    setIsDeleting(false);
    setDeleteTargetSub(null);
    setConfirmDeleteInput('');
  };

  const handleExportCsv = () => {
    const csvHeader = "ID,Team Name,Project Title,Track,Submitted On,Status\n";
    const csvRows = filteredList.map(s => 
      `"${s.id}","${s.teamName}","${s.projectTitle}","${s.track}","${s.submittedOn}","${s.status}"`
    ).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HackGrid_Submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminRouteGuard>
      <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <Link href="/admin/login" className="hover:text-slate-600">Admin</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Submissions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Submissions
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            View, review and manage project submissions for Campus Innovation Sprint 2026.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div>
          <select 
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold bg-white text-slate-800 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
          >
            <option value="Campus Innovation Sprint 2026">Campus Innovation Sprint 2026</option>
            <option value="AI for Good Hackathon">AI for Good Hackathon</option>
            <option value="Design the Future">Design the Future</option>
            <option value="GreenTech Buildathon">GreenTech Buildathon</option>
          </select>
        </div>
      </div>

      {/* 4 Top KPI Metric Cards (Matches Mockup media_1791829388999_5d1ba720.png) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Submissions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-none">
              {totalCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Total submissions
            </div>
          </div>
        </div>

        {/* Card 2: Valid Submissions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-none">
              {validCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Valid submissions
            </div>
          </div>
        </div>

        {/* Card 3: Under Review */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-none">
              {reviewCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Under review
            </div>
          </div>
        </div>

        {/* Card 4: Disqualified */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono leading-none">
              {disqualifiedCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Disqualified
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by team name, project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-blue-600 transition cursor-pointer"
          >
            <option value="All status">All status</option>
            <option value="Valid">Valid</option>
            <option value="Under review">Under review</option>
            <option value="Disqualified">Disqualified</option>
          </select>

          {/* Tracks Filter */}
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-blue-600 transition cursor-pointer"
          >
            <option value="All tracks">All tracks</option>
            <option value="Sustainability">Sustainability</option>
            <option value="AI for Social Impact">AI for Social Impact</option>
            <option value="Design & Innovation">Design & Innovation</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Submissions Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 select-none uppercase tracking-wider text-[11px] text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-4 w-12 text-center">#</th>
                <th className="px-5 py-4">Team name</th>
                <th className="px-5 py-4">Project title</th>
                <th className="px-5 py-4">Track</th>
                <th className="px-5 py-4">Submitted on</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 text-center font-mono font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${sub.avatarBg} font-bold text-xs flex items-center justify-center flex-shrink-0`}>
                        {sub.teamInitials}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">
                        {sub.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {sub.projectTitle}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${sub.trackColor}`}>
                      {sub.track}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-medium">
                    {sub.submittedOn}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      sub.status === 'Valid' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : sub.status === 'Under review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View / Evaluate Button */}
                      <Link
                        href={`/judge/evaluate/${sub.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Evaluate submission"
                      >
                        <Eye size={16} />
                      </Link>

                      {/* Download PDF Presentation */}
                      <button
                        onClick={handleExportCsv}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Download submission file"
                      >
                        <Download size={16} />
                      </button>

                      {/* Context Menu Button */}
                      <button
                        onClick={() => setOpenMenuRowId(openMenuRowId === sub.id ? null : sub.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Context Menu Dropdown */}
                      {openMenuRowId === sub.id && (
                        <div className="absolute right-5 top-12 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 text-left text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'Valid')}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Mark as valid</span>
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'Disqualified')}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <XCircle size={14} className="text-red-600" />
                            <span>Disqualify</span>
                          </button>
                          
                          <div className="border-t border-slate-100 my-1"></div>

                          {/* Destructive Action Trigger */}
                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              setDeleteTargetSub(sub);
                              setConfirmDeleteInput('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={14} />
                            <span>Delete submission</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No submissions found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRITICAL: STRICT CONFIRMATION MODAL FOR DELETION */}
      {deleteTargetSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-4">
            
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Delete Submission
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This action is destructive and cannot be undone. All rubric evaluations, project files, and scores for this team will be permanently deleted.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-500 block">To confirm, type the exact team name:</span>
              <span className="font-bold text-xs font-mono text-slate-900 select-all block">
                {deleteTargetSub.teamName}
              </span>
            </div>

            <div>
              <input
                type="text"
                placeholder="Type team name to confirm..."
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSub(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmDeleteInput.trim() !== deleteTargetSub.teamName.trim() || isDeleting}
                onClick={handleExecuteDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </AdminRouteGuard>
  );
}
