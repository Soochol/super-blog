export interface LlmRunOptions {
    system?: string;
    model?: string;
    temperature?: number;
}

export interface LlmRunner {
    run(prompt: string, opts?: LlmRunOptions): Promise<string>;
}
