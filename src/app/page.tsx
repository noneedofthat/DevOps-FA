"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, Users, ArrowRight, Plus, Filter, 
  Clock, ShieldCheck, Sparkles, Trophy, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchActiveEvents, EventItem, DEFAULT_EVENTS } from '@/lib/api';

export default function EventsDiscoveryPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'All events' | 'Hackathons' | 'Workshops'>('All events');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Open' | 'Upcoming' | 'Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      setIsLoadingEvents(true);
      try {
        const liveEvents = await fetchActiveEvents();
        if (isMounted) {
          setEvents(liveEvents);
        }
      } catch (err) {
        console.error('Failed to load active events:', err);
      } finally {
        if (isMounted) {
          setIsLoadingEvents(false);
        }
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesCategory = activeTab === 'All events' || e.category === activeTab;
    const matchesStatus = selectedStatus === 'All' || e.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header with Create Event / Filter buttons */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Events</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Events
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Discover hackathons and workshops, participate and build something amazing.
          </p>
        </div>

        {/* Top Right Action Buttons: Create event is restricted strictly to Admins (RBAC) */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/team"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create event</span>
            </Link>
          )}
          {/* Filter Popover Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`border text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer ${
                isFilterOpen || selectedStatus !== 'All'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <Filter size={15} />
              <span>Filter</span>
              {selectedStatus !== 'All' && (
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-xs space-y-3 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900">Filter Events</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus('All');
                      setActiveTab('All events');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Registration Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['All', 'Open', 'Upcoming', 'Closed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          selectedStatus === st
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Event Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['All events', 'Hackathons', 'Workshops'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveTab(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          activeTab === cat
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FEATURED HACKATHON HERO BANNER (Matches media_1791829273978_93fb724e.png) */}
      <div className="w-full rounded-3xl bg-slate-950 text-white overflow-hidden shadow-xl border border-slate-800 relative">
        {/* Dark Modern Workspace Gradient & Grid Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 opacity-95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f615_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 p-8 sm:p-10 md:p-12 space-y-6 max-w-3xl">
          {/* Badge */}
          <span className="inline-block text-[11px] font-black uppercase tracking-wider text-blue-300 bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-full shadow-inner">
            FEATURED HACKATHON
          </span>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Campus Innovation Sprint 2026
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A 48-hour hackathon to build innovative solutions for real-world problems.
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-2 font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              <span>18 Oct 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" />
              <span>Online + Campus</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span>Team of 2 – 4</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
            >
              <span>View event</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* EXPLORE EVENTS SECTION */}
      <div className="space-y-6 pt-4">
        
        {/* Section Header & Sub-Navigation Tabs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Explore events
          </h2>

          <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold">
            {(['All events', 'Hackathons', 'Workshops'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Events Grid (12-Column: 4 cols each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              {/* Thumbnail Header */}
              <div className={`h-40 bg-gradient-to-br ${evt.bannerBg} p-4 flex items-start justify-end relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <span className="relative z-10 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-sm">
                  {evt.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {evt.description}
                  </p>
                </div>

                {/* Deadline Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">{evt.deadline}</div>
                      <div className="text-[10px] text-slate-400">Deadline</div>
                    </div>
                  </div>

                  <Link
                    href="/team"
                    className="font-bold text-blue-600 hover:underline text-xs flex items-center gap-1"
                  >
                    <span>Register</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
