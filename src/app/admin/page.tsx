"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, FileText, CheckCircle2, Clock, Circle, ArrowRight, 
  ExternalLink, ShieldCheck, ChevronRight, Settings, Plus, Eye
} from 'lucide-react';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function AdminDashboardOverviewPage() {
  const [selectedEvent, setSelectedEvent] = useState('Campus Innovation Sprint 2026');

  return (
    <AdminRouteGuard>
      <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600">Workspace</Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Admin</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your event and submissions.
          </p>
        </div>

        {/* Event Selector Dropdown */}
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

      {/* 3 Top KPI Cards (Matches media_1791829298130_44632e82.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Registrations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Users size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">
              Registrations
            </span>
            <span className="text-3xl font-black text-slate-900 font-mono">
              248
            </span>
          </div>
        </div>

        {/* Card 2: Teams */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
            <Users size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">
              Teams
            </span>
            <span className="text-3xl font-black text-slate-900 font-mono">
              62
            </span>
          </div>
        </div>

        {/* Card 3: Submissions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <FileText size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">
              Submissions
            </span>
            <span className="text-3xl font-black text-slate-900 font-mono">
              48
            </span>
          </div>
        </div>

      </div>

      {/* Main 2-Column Content (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 of 12 cols): Recent Activity */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Recent activity
            </h3>
            <Link 
              href="/admin/submissions"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 select-none uppercase tracking-wider text-[11px] text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5 text-slate-400 font-medium">10 min ago</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                        AR
                      </div>
                      <span>Aarya Rao</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Team created
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span className="font-bold text-slate-800">Pixel Pioneers</span> (4 members)
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5 text-slate-400 font-medium">1 hr ago</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                        KS
                      </div>
                      <span>Kabir Shah</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Submission updated
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span className="font-bold text-slate-800">Project presentation</span> (Updated file)
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5 text-slate-400 font-medium">3 hrs ago</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[11px]">
                        MK
                      </div>
                      <span>Meera Kulkarni</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      New registration
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    Joined event (Individual participant)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Event Timeline & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Event Timeline */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Event timeline
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-5 text-xs">
              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Registration opens</span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Open</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">1 Oct 2026, 12:00 AM</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Submission deadline</span>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">3 days left</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">18 Oct 2026, 11:59 PM</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 shadow"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Results announcement</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">Upcoming</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">25 Oct 2026, 12:00 PM</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Quick actions
            </h3>

            <div className="space-y-3">
              <Link
                href="/team"
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <Users size={15} />
                <span>Manage teams</span>
              </Link>

              <Link
                href="/admin/submissions"
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                <span>View submissions</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

      </div>
    </AdminRouteGuard>
  );
}
