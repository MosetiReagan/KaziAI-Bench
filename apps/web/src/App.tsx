import { useState } from "react";
import { LayoutDashboard, Award, Terminal, FileCode2, GitCompare, ShieldCheck } from "lucide-react";
import { LeaderboardView } from "./components/LeaderboardView";

export function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "runs" | "trajectory" | "compare">("overview");

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0F172A]/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            K
          </div>
          <div>
            <div className="font-bold text-lg leading-none tracking-tight flex items-center gap-2">
              KaziAI Bench
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-medium">v1.0.0</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">The Agent Reliability & Execution Benchmark</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "overview" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "leaderboard" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Award size={16} /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("runs")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "runs" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Terminal size={16} /> Runs
          </button>
          <button
            onClick={() => setActiveTab("trajectory")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "trajectory" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FileCode2 size={16} /> Trajectory
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "compare" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <GitCompare size={16} /> Compare
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Benchmark Tasks</div>
                <div className="text-3xl font-bold text-white mt-1">10 Active</div>
                <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <ShieldCheck size={14} /> 100% Deterministic Verifiers
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Evaluated Runs</div>
                <div className="text-3xl font-bold text-white mt-1">142</div>
                <div className="text-xs text-gray-400 mt-2">Across 6 Frontier Models</div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pass Rate Average</div>
                <div className="text-3xl font-bold text-emerald-400 mt-1">68.4%</div>
                <div className="text-xs text-gray-400 mt-2">Weighted Reliability Score</div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Avg Recovery Rate</div>
                <div className="text-3xl font-bold text-blue-400 mt-1">54.2%</div>
                <div className="text-xs text-gray-400 mt-2">Self-correction upon error</div>
              </div>
            </div>

            {/* Quick Hero Banner */}
            <div className="border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-purple-950/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-white">Production Agent Reliability Evaluation</h2>
                <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                  KaziAI Bench evaluates AI agents performing real multi-step tasks across terminal commands, codebases,
                  databases, APIs, Git repositories, and MCP tools inside sandboxed environments.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && <LeaderboardView />}

        {activeTab !== "overview" && activeTab !== "leaderboard" && (
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
            Tab <span className="text-blue-400 font-semibold">{activeTab}</span> component loaded.
          </div>
        )}
      </main>
    </div>
  );
}
