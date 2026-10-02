"use client";

import { useState, useMemo, useEffect } from 'react';
import { Trophy, ArrowUp, ArrowDown, ServerOff, Medal } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type TeamScore = {
  id: string;
  rank: number;
  name: string;
  project: string;
  track: string;
  score: number;
  infrastructureScore?: number;
  configurationScore?: number;
  deploymentScore?: number;
};

export default function LiveLeaderboardPage() {
  const [data, setData] = useState<TeamScore[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrack, setActiveTrack] = useState('Overall Standings');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TeamScore; direction: 'asc' | 'desc' } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamScore | null>(null);

  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(collection(db, "leaderboard"), (snapshot) => {
      const fetchedScores = snapshot.docs.map(doc => {
        const d = doc.data();
        // Deterministically mock the granular scores if they aren't in the DB yet
        const inf = d.infrastructureScore || Math.floor(d.score * 0.4);
        const conf = d.configurationScore || Math.floor(d.score * 0.3);
        const dep = d.deploymentScore || (d.score - inf - conf);
        
        return {
          id: doc.id,
          infrastructureScore: inf,
          configurationScore: conf,
          deploymentScore: dep,
          ...d
        };
      }) as TeamScore[];
      setData(fetchedScores);
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    if (activeTrack !== 'Overall Standings') {
      filtered = filtered.filter(item => item.track === activeTrack);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] ?? 0;
        const valB = b[sortConfig.key] ?? 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Assign dynamic ranks based on sorted score if no sort is active, else just keep original rank
    if (sortConfig === null || sortConfig.key === 'score') {
      filtered.sort((a, b) => b.score - a.score);
      filtered = filtered.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    return filtered;
  }, [data, searchQuery, activeTrack, sortConfig]);

  const requestSort = (key: keyof TeamScore) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof TeamScore) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1 text-blue-500" /> : <ArrowDown size={14} className="inline ml-1 text-blue-500" />;
  };

  const getRowClass = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 border-l-4 border-amber-400";
      case 2: return "bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 border-l-4 border-slate-300";
      case 3: return "bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 border-l-4 border-orange-400";
      default: return "hover:bg-blue-50/50 border-l-4 border-transparent";
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <div className="flex items-center gap-1 text-amber-600"><Medal size={20} className="fill-amber-400"/> <span className="text-xl">1</span></div>;
      case 2: return <div className="flex items-center gap-1 text-slate-500"><Medal size={20} className="fill-slate-300"/> <span className="text-xl">2</span></div>;
      case 3: return <div className="flex items-center gap-1 text-orange-600"><Medal size={20} className="fill-orange-400"/> <span className="text-xl">3</span></div>;
      default: return <span className="text-slate-500">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Trophy className="text-amber-500 w-10 h-10" />
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Live Leaderboard</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time standings updated via WebSocket.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search teams..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm flex-grow md:w-72 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
          />
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-8">
        {['Overall Standings', 'Cloud Architecture', 'UI/UX Track'].map(track => (
          <button 
            key={track}
            onClick={() => setActiveTrack(track)}
            className={`pb-3 text-sm transition-colors ${activeTrack === track ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-semibold'}`}
          >
            {track}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-bold w-16 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('rank')}>
                  Rank {renderSortIcon('rank')}
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('name')}>
                  Team Name {renderSortIcon('name')}
                </th>
                <th className="px-6 py-4 font-bold hidden lg:table-cell cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('track')}>
                  Track {renderSortIcon('track')}
                </th>
                <th className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('infrastructureScore')}>
                  Infrastructure (TF) {renderSortIcon('infrastructureScore')}
                </th>
                <th className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('configurationScore')}>
                  Configuration (Ansible) {renderSortIcon('configurationScore')}
                </th>
                <th className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('deploymentScore')}>
                  Deployment (Docker) {renderSortIcon('deploymentScore')}
                </th>
                <th className="px-6 py-4 font-bold text-right cursor-pointer hover:bg-slate-100 transition text-blue-700" onClick={() => requestSort('score')}>
                  Total Score {renderSortIcon('score')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedData.map((team) => (
                <tr 
                  key={team.id} 
                  className={`cursor-pointer transition-all ${getRowClass(team.rank)}`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <td className="px-6 py-5 font-black text-lg">{getRankBadge(team.rank)}</td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-base">{team.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{team.project}</div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell text-slate-500 font-medium">{team.track}</td>
                  <td className="px-6 py-5 text-center font-mono font-medium text-slate-600">{team.infrastructureScore} / 40</td>
                  <td className="px-6 py-5 text-center font-mono font-medium text-slate-600">{team.configurationScore} / 30</td>
                  <td className="px-6 py-5 text-center font-mono font-medium text-slate-600">{team.deploymentScore} / 30</td>
                  <td className="px-6 py-5 text-right font-mono font-black text-blue-600 text-xl">{team.score}</td>
                </tr>
              ))}
              
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <ServerOff size={64} className="text-slate-400 mb-4" />
                      <h3 className="text-xl font-bold text-slate-600">No Infrastructure Deployed Yet</h3>
                      <p className="text-slate-500 mt-2">Teams are currently building their environments. Check back soon!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTeam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="font-black text-2xl text-slate-900 mb-1">{selectedTeam.name}</h3>
            <p className="text-sm font-semibold text-blue-600 mb-8">{selectedTeam.track}</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm border-b pb-3 border-slate-100">
                <span className="text-slate-600 font-medium">Infrastructure (TF)</span>
                <span className="font-mono font-bold text-slate-900">{selectedTeam.infrastructureScore} / 40</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-3 border-slate-100">
                <span className="text-slate-600 font-medium">Configuration (Ansible)</span>
                <span className="font-mono font-bold text-slate-900">{selectedTeam.configurationScore} / 30</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-3 border-slate-100">
                <span className="text-slate-600 font-medium">Deployment (Docker)</span>
                <span className="font-mono font-bold text-slate-900">{selectedTeam.deploymentScore} / 30</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-slate-800">Total Score</span>
                <span className="font-mono font-black text-blue-600 text-3xl">{selectedTeam.score}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedTeam(null)}
              className="w-full bg-slate-100 text-slate-800 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
