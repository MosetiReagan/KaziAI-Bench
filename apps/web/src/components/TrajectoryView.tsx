import { useState } from "react";
import { FileCode2, ChevronDown, ChevronRight, Terminal, CheckCircle2, AlertCircle, Clock, Cpu } from "lucide-react";

interface StepDetail {
  step: number;
  type: "TOOL_CALL" | "TOOL_RESULT" | "OBSERVATION" | "AGENT_THOUGHT" | "VERIFICATION_CHECK";
  tool?: string;
  durationMs: number;
  thought?: string;
  input?: string;
  output?: string;
  status: "success" | "error" | "info";
}

const MOCK_STEPS: StepDetail[] = [
  {
    step: 1,
    type: "AGENT_THOUGHT",
    durationMs: 420,
    thought: "The prompt states there is a token validation bypass in src/auth.ts where expired JWTs or malformed headers are accepted. I need to inspect src/auth.ts and locate the verifyToken function.",
    status: "info",
  },
  {
    step: 2,
    type: "TOOL_CALL",
    tool: "terminal",
    durationMs: 180,
    input: "cat src/auth.ts",
    output: `export function verifyToken(token: string): boolean {\n  if (!token) return false;\n  // FIXME: bypass for debug\n  if (token.startsWith("test_")) return true;\n  return jwt.verify(token, SECRET);\n}`,
    status: "success",
  },
  {
    step: 3,
    type: "AGENT_THOUGHT",
    durationMs: 380,
    thought: "Found the flaw: `if (token.startsWith('test_')) return true;` bypasses proper HMAC signature verification. I will edit the file to enforce jwt.verify on all tokens and handle expired error states properly.",
    status: "info",
  },
  {
    step: 4,
    type: "TOOL_CALL",
    tool: "filesystem",
    durationMs: 140,
    input: "write_to_file: src/auth.ts (patched signature verification)",
    output: "Successfully updated src/auth.ts (38 lines written)",
    status: "success",
  },
  {
    step: 5,
    type: "TOOL_CALL",
    tool: "terminal",
    durationMs: 1450,
    input: "npm test",
    output: `PASS tests/auth.test.ts\n  ✓ rejects expired tokens\n  ✓ validates proper HMAC-SHA256 signature\n  ✓ rejects 'test_' prefix bypass attempts\n\nTest Suites: 1 passed, 1 total\nTests: 3 passed, 3 total\nSnapshots: 0 total\nTime: 1.124s`,
    status: "success",
  },
  {
    step: 6,
    type: "VERIFICATION_CHECK",
    durationMs: 250,
    thought: "Kazi Verifier: Executed deterministic security exploit verifier & regression unit tests. All tests passed with 0 exit code.",
    output: "VERIFICATION PASSED: Composite Score 1.0 (100%)",
    status: "success",
  },
];

export function TrajectoryView() {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1, 2, 4, 5, 6]);

  const toggleStep = (step: number) => {
    if (expandedSteps.includes(step)) {
      setExpandedSteps(expandedSteps.filter((s) => s !== step));
    } else {
      setExpandedSteps([...expandedSteps, step]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCode2 className="text-purple-400" size={22} /> Interactive Trajectory Explorer
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Step-by-step reasoning, tool inputs/outputs, and verifier evidence for run <span className="font-mono text-blue-400 font-semibold">run_01JH8A912K</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Cpu size={14} className="text-blue-400" />
            <span>Model: claude-3-5-sonnet</span>
          </div>
          <span className="text-gray-700">|</span>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Clock size={14} className="text-emerald-400" />
            <span>Duration: 2.82s</span>
          </div>
          <span className="text-gray-700">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 size={14} />
            <span>Passed (Score: 1.0)</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {MOCK_STEPS.map((item) => {
          const isExpanded = expandedSteps.includes(item.step);
          return (
            <div key={item.step} className="border border-gray-800 bg-gray-900/70 rounded-xl overflow-hidden shadow">
              <button
                onClick={() => toggleStep(item.step)}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono text-xs font-bold w-6">#{item.step}</span>
                  {item.type === "TOOL_CALL" && (
                    <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-medium">
                      <Terminal size={12} /> {item.tool}
                    </span>
                  )}
                  {item.type === "AGENT_THOUGHT" && (
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-medium">
                      Thought
                    </span>
                  )}
                  {item.type === "VERIFICATION_CHECK" && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                      Verification
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-200 truncate max-w-xl">
                    {item.thought || item.input || item.output}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono">{item.durationMs}ms</span>
                  {item.status === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400" />
                  )}
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-800/60 bg-gray-950/50 space-y-3 text-xs font-mono">
                  {item.thought && (
                    <div>
                      <div className="text-purple-400 text-[11px] font-sans font-bold uppercase tracking-wider mb-1">
                        Agent Rationale & Diagnostic Reasoning
                      </div>
                      <div className="bg-purple-950/20 border border-purple-800/30 p-3 rounded-lg text-gray-300 font-sans leading-relaxed">
                        {item.thought}
                      </div>
                    </div>
                  )}

                  {item.input && (
                    <div>
                      <div className="text-blue-400 text-[11px] font-sans font-bold uppercase tracking-wider mb-1">
                        Tool Invocation Input
                      </div>
                      <pre className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg text-gray-300 overflow-x-auto">
                        {item.input}
                      </pre>
                    </div>
                  )}

                  {item.output && (
                    <div>
                      <div className="text-emerald-400 text-[11px] font-sans font-bold uppercase tracking-wider mb-1">
                        Tool Output & Verification Response
                      </div>
                      <pre className="bg-gray-900/90 border border-gray-800 p-3 rounded-lg text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {item.output}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
