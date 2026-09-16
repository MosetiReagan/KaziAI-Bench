import { useState } from "react";
import { Terminal, CheckCircle2, XCircle, Clock, Search, Layers, Play } from "lucide-react";
import { MOCK_RUNS, MOCK_TASKS, RunHistoryItem, BenchmarkTaskItem } from "../data";

export function RunsView() {
  const [activeSubTab, setActiveSubTab] = useState<"runs" | "tasks">("runs");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredRuns = MOCK_RUNS.filter((run: RunHistoryItem) => {
    return (
      run.taskId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      run.agent.toLowerCase().includes(searchFilter.toLowerCase()) ||
      run.model.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const filteredTasks = MOCK_TASKS.filter((task: BenchmarkTaskItem) => {
    const matchesSearch =
      task.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      task.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === "all" || task.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-blue-400" size={22} /> Runs & Benchmark Tasks
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Browse executed benchmark runs or inspect reproducible evaluation tasks.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab("runs")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === "runs" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Run History ({MOCK_RUNS.length})
          </button>
          <button
            onClick={() => setActiveSubTab("tasks")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === "tasks" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Task Explorer ({MOCK_TASKS.length})
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search by task, agent name, or model..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {activeSubTab === "tasks" && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="coding">Coding</option>
            <option value="debugging">Debugging</option>
            <option value="database">Database</option>
            <option value="security">Security</option>
            <option value="terminal">Terminal</option>
            <option value="devops">DevOps</option>
            <option value="api">API</option>
            <option value="mcp">MCP</option>
          </select>
        )}
      </div>

      {/* Runs Table */}
      {activeSubTab === "runs" && (
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Run ID</th>
                <th className="px-6 py-3.5">Task</th>
                <th className="px-6 py-3.5">Agent</th>
                <th className="px-6 py-3.5">Model</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Steps</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredRuns.map((run: RunHistoryItem) => (
                <tr key={run.id} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{run.id}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-200">{run.taskId}</td>
                  <td className="px-6 py-4 font-medium text-white">{run.agent}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{run.model}</td>
                  <td className="px-6 py-4">
                    {run.status === "PASSED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={13} /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <XCircle size={13} /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-mono text-xs">{run.steps} steps</td>
                  <td className="px-6 py-4 text-gray-300 flex items-center gap-1 font-mono text-xs">
                    <Clock size={13} className="text-gray-500" /> {run.durationSec}s
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">${run.costUsd.toFixed(4)}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{run.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Explorer Cards */}
      {activeSubTab === "tasks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task: BenchmarkTaskItem) => (
            <div key={task.id} className="border border-gray-800 bg-gray-900/60 rounded-xl p-5 hover:border-gray-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-semibold">{task.id}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                      task.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      task.difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mt-1">{task.name}</h3>
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                  <Layers size={13} /> {task.category}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">{task.description}</p>
              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
                <span>Timeout: {task.timeoutSeconds}s</span>
                <span className="text-blue-400 flex items-center gap-1 font-mono cursor-pointer hover:underline">
                  <Play size={12} /> kazi-bench run {task.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
