import { useState } from "react";
import { GitCompare, ArrowRight, CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparisonMetric {
  name: string;
  baseline: string | number;
  candidate: string | number;
  diff: string;
  trend: "better" | "worse" | "neutral";
}

export function CompareView() {
  const [baselineModel, setBaselineModel] = useState("gpt-4o");
  const [candidateModel, setCandidateModel] = useState("claude-3-5-sonnet-20241022");

  const metrics: ComparisonMetric[] = [
    {
      name: "Pass Rate (Core-v1)",
      baseline: "80.0%",
      candidate: "90.0%",
      diff: "+10.0%",
      trend: "better",
    },
    {
      name: "Autonomous Recovery Rate",
      baseline: "71.4%",
      candidate: "85.7%",
      diff: "+14.3%",
      trend: "better",
    },
    {
      name: "Average Execution Duration",
      baseline: "16.8s",
      candidate: "14.2s",
      diff: "-2.6s (15.5% faster)",
      trend: "better",
    },
    {
      name: "Average Cost per Task",
      baseline: "$0.0092",
      candidate: "$0.0084",
      diff: "-$0.0008 (8.7% cheaper)",
      trend: "better",
    },
    {
      name: "Mean Step Count",
      baseline: "5.8 steps",
      candidate: "4.2 steps",
      diff: "-1.6 steps",
      trend: "better",
    },
    {
      name: "Context Token Usage",
      baseline: "3,840 tokens",
      candidate: "3,120 tokens",
      diff: "-720 tokens",
      trend: "better",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitCompare className="text-blue-400" size={22} /> Agent & Model Regression Comparison
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Direct differential evaluation between baseline runs and current candidate models across reliability, latency, and cost.
        </p>
      </div>

      {/* Model Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/60 border border-gray-800 rounded-xl p-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Baseline Agent / Model
          </label>
          <select
            value={baselineModel}
            onChange={(e) => setBaselineModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="gpt-4o">Kazi Reference Agent (gpt-4o)</option>
            <option value="gpt-4o-mini">AutoGPT (gpt-4o-mini)</option>
            <option value="claude-3-haiku">CrewAI (claude-3-haiku)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Candidate Agent / Model
          </label>
          <select
            value={candidateModel}
            onChange={(e) => setCandidateModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="claude-3-5-sonnet-20241022">Kazi Reference Agent (claude-3-5-sonnet-20241022)</option>
            <option value="gpt-4o">Kazi Reference Agent (gpt-4o)</option>
            <option value="gemini-1.5-pro">LangChain ReAct (gemini-1.5-pro)</option>
          </select>
        </div>
      </div>

      {/* Comparative Metrics Table */}
      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/60 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="px-6 py-3.5">Reliability Metric</th>
              <th className="px-6 py-3.5">Baseline ({baselineModel})</th>
              <th className="px-6 py-3.5">Candidate ({candidateModel})</th>
              <th className="px-6 py-3.5">Net Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {metrics.map((m) => (
              <tr key={m.name} className="hover:bg-gray-800/30 transition">
                <td className="px-6 py-4 font-semibold text-white">{m.name}</td>
                <td className="px-6 py-4 font-mono text-gray-300">{m.baseline}</td>
                <td className="px-6 py-4 font-mono text-blue-400 font-bold">{m.candidate}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    m.trend === "better" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                    m.trend === "worse" ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                    "bg-gray-800 text-gray-400"
                  }`}>
                    {m.trend === "better" && <TrendingUp size={13} />}
                    {m.trend === "worse" && <TrendingDown size={13} />}
                    {m.trend === "neutral" && <Minus size={13} />}
                    {m.diff}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Level Breakdown Comparison */}
      <div className="border border-gray-800 bg-gray-900/60 rounded-xl p-5">
        <h3 className="font-bold text-white text-sm mb-4">Task-Level Pass/Fail Differential</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-800">
            <span className="font-mono text-gray-300">security.command-injection</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 flex items-center gap-1">
                Baseline: <CheckCircle2 size={13} className="text-emerald-400" />
              </span>
              <ArrowRight size={13} className="text-gray-600" />
              <span className="text-blue-400 font-bold flex items-center gap-1">
                Candidate: <CheckCircle2 size={13} className="text-emerald-400" /> (4.2s faster)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-800">
            <span className="font-mono text-gray-300">devops.docker-healthcheck</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 flex items-center gap-1">
                Baseline: <XCircle size={13} className="text-rose-400" />
              </span>
              <ArrowRight size={13} className="text-gray-600" />
              <span className="text-blue-400 font-bold flex items-center gap-1">
                Candidate: <CheckCircle2 size={13} className="text-emerald-400" /> (Resolved regression)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
