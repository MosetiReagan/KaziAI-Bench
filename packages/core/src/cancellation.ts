export class CancellationToken {
  private _isCancelled = false;
  private listeners: (() => void)[] = [];

  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  public throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new Error("Execution was cancelled by user request");
    }
  }

  public onCancelled(callback: () => void): void {
    if (this._isCancelled) {
      callback();
    } else {
      this.listeners.push(callback);
    }
  }

  public cancel(): void {
    if (!this._isCancelled) {
      this._isCancelled = true;
      for (const cb of this.listeners) {
        try {
          cb();
        } catch {
          // ignore
        }
      }
      this.listeners = [];
    }
  }
}

export class CancellationRegistry {
  private static instance: CancellationRegistry;
  private tokens: Map<string, CancellationToken> = new Map();

  public static getInstance(): CancellationRegistry {
    if (!CancellationRegistry.instance) {
      CancellationRegistry.instance = new CancellationRegistry();
    }
    return CancellationRegistry.instance;
  }

  public createToken(runId: string): CancellationToken {
    const token = new CancellationToken();
    this.tokens.set(runId, token);
    return token;
  }

  public cancelRun(runId: string): boolean {
    const token = this.tokens.get(runId);
    if (token) {
      token.cancel();
      this.tokens.delete(runId);
      return true;
    }
    return false;
  }

  public removeToken(runId: string): void {
    this.tokens.delete(runId);
  }
}
