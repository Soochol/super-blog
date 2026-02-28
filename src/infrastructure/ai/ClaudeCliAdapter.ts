import { execFile } from 'child_process';
import { promisify } from 'util';
import { LlmRunner, LlmRunOptions } from '../../shared/ai/ports/LlmRunner';

const execFileAsync = promisify(execFile);

export class ClaudeCliAdapter implements LlmRunner {
    async run(prompt: string, opts?: LlmRunOptions): Promise<string> {
        const args = ['-p', prompt];
        if (opts?.system) args.push('--system-prompt', opts.system);
        if (opts?.model) args.push('--model', opts.model);

        const { stdout } = await execFileAsync('claude', args, {
            timeout: 120_000,
            maxBuffer: 1024 * 1024,
        });

        return stdout.trim();
    }
}
