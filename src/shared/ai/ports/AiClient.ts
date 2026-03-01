export interface AiPromptParams {
    systemPrompt: string;
    userPrompt: string;
    responseSchema?: unknown;
}

export interface AiClient { // 모든 도메인이 공통으로 사용할 AI 인터페이스
    generateStructuredData<T>(params: AiPromptParams): Promise<T>;
    validateMatch(sourceText: string, targetData: unknown): Promise<boolean>;
}
