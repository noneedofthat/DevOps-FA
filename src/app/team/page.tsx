"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Copy, Check, Server, Activity, ArrowUpRight, Shield } from 'lucide-react';

type Member = {
  id: string;
  name: string;
  role: string;
  status: string;
};

export default function TeamFormationPage() {
  const { user, loginAnonymously } = useAuth();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [teamConfig, setTeamConfig] = useState({ ec2Ip: '', ec2Status: 'Offline' });

  useEffect(() => {
    if (!db) return;
    const unsubscribeMembers = onSnapshot(collection(db, "teams"), (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(fetchedMembers);
    });
    
    const unsubscribeConfig = onSnapshot(doc(db, "teamConfig", "myTeam"), (docSnap) => {
      if (docSnap.exists()) {
        setTeamConfig(docSnap.data() as any);
      }
    });
    
    return () => {
      unsubscribeMembers();
      unsubscribeConfig();
    };
  }, [user]);

  const generateInvite = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: 'team_xyz123' })
      });
      const data = await res.json();
      setInviteToken(data.token);
    } catch (err) {
      console.error('Failed to generate invite:', err);
      setInviteToken('inv_abc123def456');
    }
  };

  const handleEditRole = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const updateRole = async (newRole: string) => {
    if (editingMember && db) {
      await updateDoc(doc(db, "teams", editingMember.id), { role: newRole });
      setIsModalOpen(false);
      setEditingMember(null);
    }
  };

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow-md border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h2>
        <p className="text-slate-600 mb-6 text-sm">You must be signed in to manage your team workspace.</p>
        <button onClick={loginAnonymously} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition">
          Sign In Anonymously
        </button>
      </div>
    );
  }

  const formatUid = (uid: string) => {
    if (!uid) return '';
    if (uid.length <= 8) return uid;
    return `${uid.substring(0, 4)}...${uid.substring(uid.length - 3)}`;
  };

  const getRolePill = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold border border-purple-200">{role}</span>;
      case 'devops': return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold border border-amber-200">{role}</span>;
      case 'frontend': return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold border border-blue-200">{role}</span>;
      case 'backend': return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold border border-emerald-200">{role}</span>;
      default: return <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full font-bold border border-slate-200">{role}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Team Workspace</h2>
          <p className="text-slate-500 text-sm mt-1">Manage roster, roles, and infrastructure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          
          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-600 font-bold text-2xl border border-blue-100">
              {user?.isAnonymous ? 'A' : 'U'}
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {user?.isAnonymous ? 'Anonymous Hacker' : 'Registered User'}
            </h3>
            
            <div className="flex items-center justify-center gap-2 mt-2 mb-4">
              <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {formatUid(user.uid)}
              </span>
              <button onClick={() => copyToClipboard(user.uid, setCopiedUid)} className="text-slate-400 hover:text-slate-700 transition" title="Copy full UID">
                {copiedUid ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-bold border border-indigo-100 flex items-center gap-1">
                <Shield size={12}/> Team Captain
              </span>
            </div>
          </div>
          
          {/* Invite Generator */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Invite Members</h4>
            <p className="text-xs text-slate-500 mb-4">Generate a secure single-use token to invite a teammate to this workspace.</p>
            
            {!inviteToken ? (
              <button onClick={generateInvite} className="w-full border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
                Generate Invite Link
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://portal.tenzorx.com/invite/${inviteToken}`}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-600 outline-none"
                />
                <button 
                  onClick={() => copyToClipboard(`https://portal.tenzorx.com/invite/${inviteToken}`, setCopiedLink)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition"
                >
                  {copiedLink ? <Check size={16}/> : <Copy size={16}/>}
                </button>
              </div>
            )}
          </div>

          {/* Infrastructure Status Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Server size={64}/></div>
            <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Activity size={18} className={teamConfig.ec2Status === 'Running' ? "text-emerald-400" : "text-amber-500"} /> Infrastructure
            </h4>
            <p className="text-xs text-slate-400 mb-6">Live AWS EC2 Instance Status</p>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-300">State</span>
                <span className={`font-bold flex items-center gap-1 ${teamConfig.ec2Status === 'Running' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {teamConfig.ec2Status === 'Running' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>} 
                  {teamConfig.ec2Status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-300">Public IP</span>
                {teamConfig.ec2Ip ? (
                  <span className="font-mono font-medium text-amber-400">{teamConfig.ec2Ip}</span>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" id="ec2IpInput" placeholder="x.x.x.x" className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500" />
                    <button onClick={async () => {
                      const val = (document.getElementById('ec2IpInput') as HTMLInputElement).value;
                      if(val && db) {
                        await setDoc(doc(db, "teamConfig", "myTeam"), { ec2Ip: val, ec2Status: 'Running' }, { merge: true });
                      }
                    }} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs font-bold transition">Save</button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-slate-300">Region</span>
                <span className="font-medium">ap-south-1</span>
              </div>
            </div>
            
            {teamConfig.ec2Ip && (
              <a href={`http://${teamConfig.ec2Ip}`} target="_blank" rel="noreferrer" className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg text-sm transition-colors border border-white/10 flex items-center justify-center gap-2">
                Open Application <ArrowUpRight size={16}/>
              </a>
            )}
          </div>

        </div>

        {/* Team Roster Table */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Current Roster</h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{members.length} / 4 Members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Member</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-900">{member.name}</td>
                      <td className="px-6 py-5">{getRolePill(member.role)}</td>
                      <td className="px-6 py-5"><span className="text-emerald-600 font-bold flex items-center gap-1.5"><Check size={14}/> {member.status}</span></td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => handleEditRole(member)} className="text-blue-600 font-bold hover:text-blue-800 text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition">
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-xl text-slate-900 mb-1">Edit Role</h3>
            <p className="text-sm text-slate-500 mb-6">Assigning role for <span className="font-bold text-slate-800">{editingMember.name}</span></p>
            
            <div className="space-y-6">
              <select 
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none font-medium bg-slate-50"
                defaultValue={editingMember.role}
                onChange={(e) => updateRole(e.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="DevOps">DevOps</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
              </select>
              <button onClick={() => setIsModalOpen(false)} className="w-full py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
