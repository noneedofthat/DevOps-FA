"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Info, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LeaderboardTeam {
  id: string;
  rank: number;
  name: string;
  initials: string;
  avatarBg: string;
  score: number;
  track: string;
  trackColor: string;
}

const DEFAULT_LEADERBOARD: LeaderboardTeam[] = [
  {
    id: 'lead-1',
    rank: 1,
    name: 'Pixel Pioneers',
    initials: 'P',
    avatarBg: 'bg-purple-100 text-purple-700',
    score: 942,
    track: 'Sustainability',
    trackColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'lead-2',
    rank: 2,
    name: 'Code Catalyst',
    initials: 'CC',
    avatarBg: 'bg-indigo-100 text-indigo-700',
    score: 918,
    track: 'AI for Social Impact',
    trackColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'lead-3',
    rank: 3,
    name: 'GreenStack',
    initials: 'GS',
    avatarBg: 'bg-emerald-100 text-emerald-700',
    score: 891,
    track: 'Sustainability',
    trackColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'lead-4',
    rank: 4,
    name: 'Nova Labs',
    initials: 'NL',
    avatarBg: 'bg-sky-100 text-sky-700',
    score: 876,
    track: 'Design & Innovation',
    trackColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  {
    id: 'lead-5',
    rank: 5,
    name: 'ByteForge',
    initials: 'BF',
    avatarBg: 'bg-pink-100 text-pink-700',
    score: 852,
    track: 'AI for Social Impact',
    trackColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export default function HackGridLeaderboardPage() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>(DEFAULT_LEADERBOARD);
  const [selectedEvent, setSelectedEvent] = useState('Campus Innovation Sprint 2026');

  // Real-time Firestore sync
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetched: LeaderboardTeam[] = snapshot.docs.map((docSnap, index) => {
          const d = docSnap.data();
          const isSus = (d.track || '').includes('Sustainability');
          const isAi = (d.track || '').includes('AI');

          return {
            id: docSnap.id,
            rank: index + 1,
            name: d.name || `Team ${index + 1}`,
            initials: (d.name || 'TM').substring(0, 2).toUpperCase(),
            avatarBg: index === 0 ? 'bg-purple-100 text-purple-700' : index === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700',
            score: d.score || 850,
            track: d.track || (isSus ? 'Sustainability' : isAi ? 'AI for Social Impact' : 'Design & Innovation'),
            trackColor: isSus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isAi ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200',
          };
        });
        setTeams(fetched.length >= 3 ? fetched : DEFAULT_LEADERBOARD);
      }
    });

    return () => unsubscribe();
  }, []);

  const top1 = teams[0];
  const top2 = teams[1];
  const top3 = teams[2];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Leaderboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Leaderboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track the teams leading the Campus Innovation Sprint 2026.
          </p>
        </div>

        {/* Event Selector */}
        <div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold bg-white text-slate-800 shadow-sm focus:border-blue-600 outline-none transition cursor-pointer"
          >
            <option value="Campus Innovation Sprint 2026">Campus Innovation Sprint 2026</option>
            <option value="AI for Good Hackathon">AI for Good Hackathon</option>
            <option value="Design the Future">Design the Future</option>
            <option value="GreenTech Buildathon">GreenTech Buildathon</option>
          </select>
        </div>
      </div>

      {/* TOP 3 PODIUM CARDS (Matches media_1791829293626_31c14690.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Rank 1: Gold */}
        {top1 && (
          <div className="bg-amber-50/40 border border-amber-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              1
            </div>

            <div className={`w-12 h-12 rounded-2xl ${top1.avatarBg} font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm`}>
              {top1.initials}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">{top1.name}</h3>
              <div className="font-mono font-bold text-sm text-blue-600">{top1.score} points</div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${top1.trackColor}`}>
                {top1.track}
              </span>
            </div>
          </div>
        )}

        {/* Rank 2: Silver */}
        {top2 && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-400 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              2
            </div>

            <div className={`w-12 h-12 rounded-2xl ${top2.avatarBg} font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm`}>
              {top2.initials}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">{top2.name}</h3>
              <div className="font-mono font-bold text-sm text-blue-600">{top2.score} points</div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${top2.trackColor}`}>
                {top2.track}
              </span>
            </div>
          </div>
        )}

        {/* Rank 3: Bronze */}
        {top3 && (
          <div className="bg-orange-50/40 border border-orange-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-orange-400 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              3
            </div>

            <div className={`w-12 h-12 rounded-2xl ${top3.avatarBg} font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm`}>
              {top3.initials}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">{top3.name}</h3>
              <div className="font-mono font-bold text-sm text-blue-600">{top3.score} points</div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${top3.trackColor}`}>
                {top3.track}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* RANKINGS DATA TABLE (Matches media_1791829293626_31c14690.png) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 select-none uppercase tracking-wider text-[11px] text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4 w-16">#</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">
                    {t.rank}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${t.avatarBg} font-bold text-xs flex items-center justify-center flex-shrink-0`}>
                        {t.initials}
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {t.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                    {t.score}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${t.trackColor}`}>
                      {t.track}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Info size={15} className="text-slate-400 flex-shrink-0" />
          <span>Final rankings are confirmed after judging.</span>
        </div>
      </div>

    </div>
  );
}
