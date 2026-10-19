"use client";

import React from "react";
import { Activity, ShieldCheck, Server, RefreshCw, ExternalLink } from "lucide-react";

export default function GrafanaMonitoringPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg border border-blue-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HackGrid Infrastructure Telemetry &amp; Observability</h1>
            <p className="text-xs text-slate-400">Prometheus &amp; Grafana Engine (Kubernetes Namespace: <span className="font-mono text-blue-400">hackathon</span>)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Prometheus Live Scrape Active (5s)
          </span>
          <a
            href="/grafana-dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Full Screen Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Container - Embed Live Grafana Telemetry */}
      <main className="flex-1 p-4 bg-slate-950 flex flex-col">
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#111217]">
          <iframe
            src="/grafana-dashboard.html"
            title="Grafana Observability Dashboard"
            className="w-full h-full min-h-[800px] border-none"
          />
        </div>
      </main>
    </div>
  );
}
