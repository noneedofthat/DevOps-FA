"use client";

import { useState, useEffect } from 'react';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { Clock, Trophy, Target, ArrowRight, CheckCircle, Download, Server, Code, Container } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function EventDiscoveryPage() {
  const { events } = useEvents();
  const { user, loginAnonymously } = useAuth();
  const [timeLeft, setTimeLeft] = useState('00:00:00:00');
  const [isMounted, setIsMounted] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());

  // Fetch user's registrations
  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "registrations"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach(doc => ids.add(doc.data().eventId));
      setRegisteredEventIds(ids);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
    const targetDate = new Date('2026-12-10T00:00:00Z');
    const targetTime = targetDate.getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00:00');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const format = (num: number) => num.toString().padStart(2, '0');
      setTimeLeft(`${format(days)}:${format(hours)}:${format(minutes)}:${format(seconds)}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (eventId: string, eventTitle: string) => {
    if (!user) {
      await loginAnonymously();
      return; 
    }
    if (!db) return;
    
    try {
      await addDoc(collection(db, "registrations"), {
        uid: user.uid,
        eventId,
        eventTitle,
        registeredAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-10 md:p-20 text-center shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          
          <div className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-4">
            DevOps Assessment 2026
          </div>
          
          <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-tight">
            TenzorX Hackathon
          </h2>
          
          {/* Integrated Timer */}
          <div className="py-6 flex flex-col items-center justify-center border-y border-white/10 my-8">
            <div className="flex items-center gap-2 text-slate-400 mb-2 uppercase tracking-widest text-xs font-bold">
              <Clock size={14} /> Hacking Begins In
            </div>
            <div className="text-5xl md:text-7xl font-mono font-black tracking-tighter text-blue-400 drop-shadow-lg">
              {isMounted ? timeLeft : <span className="opacity-0">00:00:00:00</span>}
            </div>
          </div>

          <p className="text-lg md:text-xl opacity-90 mx-auto font-medium text-slate-300">
            Provision infrastructure, configure servers, and deploy containerized applications at scale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={() => {
              document.getElementById('events-catalog')?.scrollIntoView({ behavior: 'smooth' });
            }} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2">
              View Events <ArrowRight size={18} />
            </button>
            <a href="/FA1_DevOps_Quick_Notes.pdf" download className="w-full sm:w-auto bg-slate-800 border border-slate-600 text-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
              <Download size={18} /> Assessment Guidelines
            </a>
          </div>
        </div>
      </section>

      {/* Event Catalog Grid */}
      <section id="events-catalog">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
          <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="text-blue-600" /> Upcoming Events
          </h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Live Database</span>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
            No events found. Go to the Admin dashboard to add some!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id);
              return (
                <div key={event.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{event.category}</div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{event.title}</h4>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">{event.description}</p>
                  
                  {/* Tech Stack Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                      <Server size={10} /> Terraform
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                      <Code size={10} /> Ansible
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                      <Container size={10} /> Docker
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                      AWS
                    </span>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="text-sm font-semibold text-slate-500 flex items-center gap-2 pt-4 border-t border-slate-100">
                      <Clock size={14} className="text-slate-400" /> {event.dateRange}
                    </div>
                    
                    {isRegistered ? (
                      <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 text-sm shadow-sm">
                        <CheckCircle size={16}/> Registered
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleRegister(event.id, event.title)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
                      >
                        Register for Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Prize Track Cards */}
      <section>
        <h3 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-200 pb-4">
          <Trophy className="text-amber-500" /> Prize Tracks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 w-2 h-full bg-blue-500"></div>
            <h4 className="font-bold text-lg text-slate-900">Best Cloud Architecture</h4>
            <p className="text-sm text-slate-600 mt-2">Sponsored by AWS. Requires use of serverless components like Lambda or DynamoDB.</p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 w-2 h-full bg-amber-500"></div>
            <h4 className="font-bold text-lg text-slate-900">UI/UX Excellence</h4>
            <p className="text-sm text-slate-600 mt-2">Highest usability score. Must strictly meet WCAG accessibility standards.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
