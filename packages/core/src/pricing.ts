import { TokenUsage, CostEstimate } from "./types.js";

export interface ModelPricing {
  provider: string;
  model: string;
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
}

export class PricingRegistry {
  private static instance: PricingRegistry;
  private pricingTable: Map<string, ModelPricing> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): PricingRegistry {
    if (!PricingRegistry.instance) {
      PricingRegistry.instance = new PricingRegistry();
    }
    return PricingRegistry.instance;
  }

  private registerDefaults(): void {
    // Configurable defaults, extensible via custom config or environment
    this.register({ provider: "openai", model: "gpt-4o", inputPerMillionTokens: 2.5, outputPerMillionTokens: 10.0 });
    this.register({ provider: "openai", model: "gpt-4o-mini", inputPerMillionTokens: 0.15, outputPerMillionTokens: 0.6 });
    this.register({ provider: "anthropic", model: "claude-3-5-sonnet", inputPerMillionTokens: 3.0, outputPerMillionTokens: 15.0 });
    this.register({ provider: "google", model: "gemini-1.5-pro", inputPerMillionTokens: 1.25, outputPerMillionTokens: 5.0 });
    this.register({ provider: "mock", model: "reference", inputPerMillionTokens: 1.0, outputPerMillionTokens: 2.0 });
  }

  public register(pricing: ModelPricing): void {
    const key = `${pricing.provider.toLowerCase()}:${pricing.model.toLowerCase()}`;
    this.pricingTable.set(key, pricing);
  }

  public getPricing(provider: string, model: string): ModelPricing {
    const key = `${provider.toLowerCase()}:${model.toLowerCase()}`;
    const found = this.pricingTable.get(key);
    if (found) return found;

    // Default fallback pricing if not registered
    return {
      provider,
      model,
      inputPerMillionTokens: 2.0,
      outputPerMillionTokens: 8.0,
    };
  }

  public calculateCost(provider: string, model: string, usage: TokenUsage): CostEstimate {
    const pricing = this.getPricing(provider, model);
    const inputCostUsd = (usage.inputTokens / 1_000_000) * pricing.inputPerMillionTokens;
    const outputCostUsd = (usage.outputTokens / 1_000_000) * pricing.outputPerMillionTokens;
    return {
      inputCostUsd,
      outputCostUsd,
      totalCostUsd: Number((inputCostUsd + outputCostUsd).toFixed(6)),
    };
  }
}
