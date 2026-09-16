import { ResourceLimitError, TimeoutError } from "./errors.js";
import { PricingRegistry } from "./pricing.js";
import { TokenUsage } from "./types.js";

export interface BudgetLimits {
  maxDurationSeconds?: number;
  maxSteps?: number;
  maxTokens?: number;
  maxCostUsd?: number;
  maxToolCalls?: number;
}

export class BudgetEnforcer {
  private limits: BudgetLimits;
  private provider: string;
  private model: string;
  private timer?: NodeJS.Timeout;

  constructor(limits: BudgetLimits, provider = "mock", model = "reference") {
    this.limits = limits;
    this.provider = provider;
    this.model = model;
  }

  public async runWithTimeout<T>(action: () => Promise<T>): Promise<T> {
    const maxSec = this.limits.maxDurationSeconds || 900;
    const timeoutMs = maxSec * 1000;

    return new Promise<T>((resolve, reject) => {
      this.timer = setTimeout(() => {
        reject(new TimeoutError(`Execution exceeded maximum duration limit of ${maxSec}s`));
      }, timeoutMs);

      action()
        .then((res) => {
          if (this.timer) clearTimeout(this.timer);
          resolve(res);
        })
        .catch((err) => {
          if (this.timer) clearTimeout(this.timer);
          reject(err);
        });
    });
  }

  public checkTokens(usage: TokenUsage): void {
    if (this.limits.maxTokens && usage.totalTokens > this.limits.maxTokens) {
      throw new ResourceLimitError(
        `Token limit exceeded: used ${usage.totalTokens}, max allowed is ${this.limits.maxTokens}`
      );
    }

    if (this.limits.maxCostUsd) {
      const pricing = PricingRegistry.getInstance();
      const cost = pricing.calculateCost(this.provider, this.model, usage);
      if (cost.totalCostUsd > this.limits.maxCostUsd) {
        throw new ResourceLimitError(
          `Cost budget exceeded: estimated $${cost.totalCostUsd.toFixed(4)}, max allowed is $${this.limits.maxCostUsd}`
        );
      }
    }
  }

  public checkSteps(stepCount: number): void {
    if (this.limits.maxSteps && stepCount > this.limits.maxSteps) {
      throw new ResourceLimitError(
        `Step limit exceeded: executed ${stepCount}, max allowed is ${this.limits.maxSteps}`
      );
    }
  }

  public cancel(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
