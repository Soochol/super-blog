export interface AiSkill {
    id: string;
    name: string; // e.g., 'gaming_laptop_review_v1'
    systemPromptTemplate: string;
    userPromptTemplate: string;
    temperature: number;
    model: string;
    version: string;
}

export function injectContextToPrompt(template: string, context: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}
