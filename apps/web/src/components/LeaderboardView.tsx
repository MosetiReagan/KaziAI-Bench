import { Award, Zap, DollarSign, Activity, RotateCcw } from "lucide-react";
import { MOCK_LEADERBOARD, LeaderboardRow } from "../data";

export function LeaderboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="text-yellow-400" size={22} /> Agent Reliability Leaderboard
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Multi-metric benchmark ranking computed across real code execution, terminal commands, and automated verifiers.
        </p>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Agent / Framework</th>
                <th className="px-6 py-3.5">Foundation Model</th>
                <th className="px-6 py-3.5">Pass Rate</th>
                <th className="px-6 py-3.5">Reliability Score</th>
                <th className="px-6 py-3.5">Avg Latency</th>
                <th className="px-6 py-3.5">Avg Cost</th>
                <th className="px-6 py-3.5">Recovery %</th>
                <th className="px-6 py-3.5">Evaluated Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {MOCK_LEADERBOARD.map((row: LeaderboardRow) => (
                <tr key={`${row.agent}-${row.model}`} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-bold text-gray-300">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      row.rank === 1 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" :
                      row.rank === 2 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                      row.rank === 3 ? "bg-amber-700/20 text-amber-500 border border-amber-700/40" :
                      "text-gray-500"
                    }`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{row.agent}</td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">{row.model}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">{row.passRate.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${row.passRate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-400">{row.reliabilityScore.toFixed(1)}</td>
                  <td className="px-6 py-4 text-gray-300 flex items-center gap-1">
                    <Zap size={13} className="text-gray-500" /> {row.avgDurationSec}s
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">
                    ${row.avgCostUsd.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-purple-400 flex items-center gap-1 font-semibold">
                    <RotateCcw size={13} /> {row.recoveryRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{row.runsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metric explanation callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Activity size={15} className="text-blue-400" /> Pass Rate & Verification
          </div>
          <div className="text-xs text-gray-400 mt-1 leading-relaxed">
            Binary and partial credit determined by automated verifiers (compilation, unit tests, security exploit assertions, DB explain plans).
          </div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <RotateCcw size={15} className="text-purple-400" /> Autonomous Recovery
          </div>
          <div className="text-xs text-gray-400 mt-1 leading-relaxed">
            Measures the agent's ability to diagnose stderr, syntax errors, or tool failures and self-correct without human intervention.
          </div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <DollarSign size={15} className="text-emerald-400" /> Token & Cost Efficiency
          </div>
          <div className="text-xs text-gray-400 mt-1 leading-relaxed">
            Standardized cost calculation based on recorded input/output tokens using official model pricing registries.
          </div>
        </div>
      </div>
    </div>
  );
}
