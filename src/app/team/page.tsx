"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp, 
  query, where, getDocs, updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { 
  Users, UserPlus, Copy, Check, Shield, CheckCircle, ArrowRight, 
  ExternalLink, Sparkles, Send, Calendar, Award, Info, Server,
  MoreVertical, CheckCircle2, Circle, Clock, Plus, X, AlertCircle
} from 'lucide-react';
import TeamCreationModal from '@/components/TeamCreationModal';

interface TeamMember {
  uid: string;
  name: string;
  role: string;
  initials: string;
  colorBg: string;
}

export default function TeamFormationPage() {
  const { user, loginWithGoogle } = useAuth();
  
  const [hasTeam, setHasTeam] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [teamError, setTeamError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Firestore listener
  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    let unsubSub: (() => void) | null = null;

    const qTeam = query(collection(db, "teams"), where("members", "array-contains", user.uid));
    const unsubTeam = onSnapshot(qTeam, (snapshot) => {
      if (!snapshot.empty) {
        setHasTeam(true);
        const teamDoc = snapshot.docs[0];
        const data: any = { id: teamDoc.id, ...teamDoc.data() };
        setTeamData(data);

        // Listen for submission belonging to any team member
        if (unsubSub) unsubSub();

        const membersList: string[] = Array.isArray(data.members) && data.members.length > 0 
          ? data.members 
          : [user.uid];

        const qSub = membersList.length <= 10
          ? query(collection(db, "submissions"), where("submittedByUid", "in", membersList))
          : query(collection(db, "submissions"), where("submittedByUid", "==", user.uid));

        unsubSub = onSnapshot(qSub, (subSnap) => {
          if (!subSnap.empty) {
            setSubmissionData({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
          } else {
            setSubmissionData(null);
          }
        });
      } else {
        setHasTeam(false);
        setTeamData(null);

        if (unsubSub) unsubSub();
        const qSubUser = query(collection(db, "submissions"), where("submittedByUid", "==", user.uid));
        unsubSub = onSnapshot(qSubUser, (subSnap) => {
          if (!subSnap.empty) {
            setSubmissionData({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
          } else {
            setSubmissionData(null);
          }
        });
      }
      setLoading(false);
    });

    return () => {
      unsubTeam();
      if (unsubSub) unsubSub();
    };
  }, [user]);

  // Handle Team Creation from Modal
  const handleCreateTeamSubmit = async (data: { name: string; event: string; description: string }) => {
    if (!db || !user) return;
    setTeamError('');
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await addDoc(collection(db, "teams"), {
      name: data.name,
      event: data.event,
      description: data.description,
      joinCode: code,
      captain: user.uid,
      members: [user.uid],
      memberDetails: [
        {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Team Lead',
          role: 'Team Lead',
          initials: (user.displayName || user.email || 'TL').substring(0, 2).toUpperCase(),
          colorBg: 'bg-blue-100 text-blue-700',
        }
      ],
      createdAt: serverTimestamp(),
      progressPercentage: 65,
    });
  };

  // Handle Join Team
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !joinCodeInput) return;
    setTeamError('');

    try {
      const q = query(collection(db, "teams"), where("joinCode", "==", joinCodeInput.trim().toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setTeamError("Invalid 6-character team invite code. Please check and try again.");
        return;
      }
      
      const teamDoc = snapshot.docs[0];
      const data = teamDoc.data();
      const currentMembers = data.members || [];
      const currentDetails = data.memberDetails || [];

      if (currentMembers.includes(user.uid)) {
        setTeamError("You are already registered in this team.");
        return;
      }

      if (currentMembers.length >= 4) {
        setTeamError("Team is full (maximum 4 members allowed).");
        return;
      }

      const newMember = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || `Member ${currentMembers.length + 1}`,
        role: 'Developer',
        initials: (user.displayName || user.email || 'M').substring(0, 2).toUpperCase(),
        colorBg: 'bg-purple-100 text-purple-700',
      };

      await updateDoc(doc(db, "teams", teamDoc.id), {
        members: [...currentMembers, user.uid],
        memberDetails: [...currentDetails, newMember],
      });
      
      setJoinCodeInput('');
      setIsJoinModalOpen(false);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to join team.');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } finally {
        textArea.remove();
      }
    }
  };

  // 1. Unauthenticated Login Screen
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-240px)] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-9 text-center relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Users size={24} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">Sign In to Manage Team</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
            Sign in to HackGrid to create your team, invite peers, or track project progress.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign in to HackGrid</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE: User is not in a team (Exactly matches Mockup media_1791829441337_27dfe55c.png)
  if (!loading && !hasTeam) {
    return (
      <div className="w-full space-y-6">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Team</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team workspace</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create a team or join an existing one to collaborate and participate in hackathons.
          </p>
        </div>

        {/* Empty State Card */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-12 sm:p-16 text-center shadow-sm flex flex-col items-center justify-center">
          
          {/* Puzzle Collaboration SVG Illustration */}
          <div className="w-64 h-48 mb-6 flex items-center justify-center relative">
            <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-xs">
              <rect x="30" y="30" width="240" height="140" rx="16" fill="#F1F5F9" />
              {/* Puzzle pieces representation */}
              <path d="M110 70 C110 60, 130 60, 130 70 L150 70 L150 90 C160 90, 160 110, 150 110 L150 130 L110 130 Z" fill="#3B82F6" opacity="0.85" />
              <path d="M155 70 L195 70 L195 130 L175 130 C175 120, 155 120, 155 130 Z" fill="#93C5FD" opacity="0.9" />
              {/* Silhouette team avatars */}
              <circle cx="95" cy="115" r="14" fill="#1E293B" />
              <path d="M80 145 C80 130, 110 130, 110 145 Z" fill="#1E293B" />
              <circle cx="205" cy="115" r="14" fill="#1E293B" />
              <path d="M190 145 C190 130, 220 130, 220 145 Z" fill="#1E293B" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            You're not in a team yet
          </h2>
          <p className="text-slate-500 text-sm max-w-md mb-8">
            Team up with like-minded peers and start building your idea together.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create team</span>
            </button>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Join team</span>
            </button>
          </div>
        </div>

        {/* Team Creation Modal */}
        <TeamCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTeamSubmit}
        />

        {/* Join Team Modal */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Join a Team</h3>
                <button 
                  onClick={() => setIsJoinModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Enter the 6-character team invite code shared by your Team Lead.
              </p>

              <form onSubmit={handleJoinTeam} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. FQSNLZ"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-bold tracking-widest uppercase border border-slate-300 rounded-xl py-3 px-3.5 text-base bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />

                {teamError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                    {teamError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Join Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) return null;

  // 3. ACTIVE TEAM STATE (Live state from database)
  const members: TeamMember[] = teamData?.memberDetails || [
    {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Team Lead',
      role: 'Team Lead',
      initials: (user.displayName || user.email || 'TL').substring(0, 2).toUpperCase(),
      colorBg: 'bg-blue-100 text-blue-700',
    }
  ];

  // Dynamically calculate milestones from real submission and team state
  const hasProblemStatement = Boolean(hasTeam);
  const hasRepo = Boolean(submissionData?.githubUrl || submissionData?.repoUrl || teamData?.githubUrl);
  const isSubmitted = Boolean(
    (submissionData && (
      submissionData.submissionId || 
      submissionData.title || 
      submissionData.submittedAtFormatted ||
      submissionData.submittedAtIso ||
      submissionData.fileName ||
      submissionData.assetUrl ||
      ['submitted', 'approved', 'valid', 'under review', 'evaluated'].includes(String(submissionData.status || '').toLowerCase())
    )) ||
    teamData?.isSubmitted ||
    teamData?.submissionId
  );

  const completedCount = (hasProblemStatement ? 1 : 0) + (hasRepo ? 1 : 0) + (isSubmitted ? 1 : 0);
  const progress = Math.round((completedCount / 3) * 100);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header with Create Team Action */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Team</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Team workspace
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your team and keep track of your hackathon progress.
          </p>
        </div>
      </div>

      {/* Team Summary Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Left: Avatar & Team Identity */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            {(teamData?.name || 'T')[0].toUpperCase()}
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {teamData?.name || 'My Team'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" />
              <span>{teamData?.event || 'Campus Innovation Sprint 2026'}</span>
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Users size={14} className="text-slate-400" />
                <span>{members.length} members</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award size={14} className="text-slate-400" />
                <span>Team</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Submission Progress Bar */}
        <div className="w-full md:w-72 bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Submission progress</span>
            <span className="text-blue-600 font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout (Team Members on Left, Milestones on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Team Members (7 of 12 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Team members
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {members.map((member: TeamMember, idx: number) => {
              const isLead = member.role === 'Team Lead';
              return (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${member.colorBg || 'bg-slate-100 text-slate-700'} font-bold text-xs flex items-center justify-center flex-shrink-0`}>
                      {member.initials || member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{member.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                      isLead 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {member.role}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invite Member Button */}
          {members.length < 4 && (
            <div className="pt-2">
              <button 
                onClick={() => copyToClipboard(teamData?.joinCode)}
                className="w-full border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>
                  {copiedCode ? 'Code Copied to Clipboard!' : `Invite member (Code: ${teamData?.joinCode || 'GEN-CODE'})`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Upcoming Milestones (5 of 12 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Upcoming milestones
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Milestone 1: Team Formed */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-start gap-2.5">
                {hasProblemStatement ? (
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-900">Form team and choose event</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Campus Innovation Sprint 2026</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                hasProblemStatement ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {hasProblemStatement ? 'Completed' : 'Pending'}
              </span>
            </div>

            {/* Milestone 2: Repository Link */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-start gap-2.5">
                {hasRepo ? (
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-900">Add repository link and details</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {hasRepo ? (
                      <a 
                        href={submissionData?.githubUrl || submissionData?.repoUrl || teamData?.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">
                          {submissionData?.githubUrl || submissionData?.repoUrl || teamData?.githubUrl}
                        </span>
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                    ) : (
                      'Add your GitHub repo in Submit'
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                hasRepo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {hasRepo ? 'Completed' : 'Pending'}
              </span>
            </div>

            {/* Milestone 3: Final Project Submission */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-start gap-2.5">
                {isSubmitted ? (
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-900">Submit final project</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isSubmitted 
                      ? (submissionData?.submittedAtFormatted || teamData?.submittedAtFormatted || 'Completed on 23 Oct 2026') 
                      : 'Due 18 Oct, 2026'}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isSubmitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {isSubmitted ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{isSubmitted ? 'View Submission Receipt' : 'Go to Project Submission'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* Team Creation Modal */}
      <TeamCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTeamSubmit}
      />

    </div>
  );
}