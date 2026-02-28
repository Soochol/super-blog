import { spawn } from 'child_process';
import { LlmRunner, LlmRunOptions } from '../../shared/ai/ports/LlmRunner';

export class ClaudeCliAdapter implements LlmRunner {
    // Cache sanitized env once to avoid copying process.env on every call
    private readonly cleanEnv: NodeJS.ProcessEnv;

    constructor() {
        const env = { ...process.env };
        // Remove CLAUDECODE env var to allow nested CLI calls from within a Claude Code session
        delete env.CLAUDECODE;
        this.cleanEnv = env;
    }

    async run(prompt: string, opts?: LlmRunOptions): Promise<string> {
        const args = ['-p', '-', '--output-format', 'text'];
        if (opts?.system) args.push('--system-prompt', opts.system);
        if (opts?.model && opts.model !== 'claude') args.push('--model', opts.model);

        return new Promise((resolve, reject) => {
            const child = spawn('claude', args, {
                env: this.cleanEnv,
                timeout: 120_000,
            });

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            child.stdout.on('data', (data: Buffer) => { stdoutChunks.push(data); });
            child.stderr.on('data', (data: Buffer) => { stderrChunks.push(data); });

            child.on('close', (code) => {
                const stdout = Buffer.concat(stdoutChunks).toString();
                const stderr = Buffer.concat(stderrChunks).toString();
                if (code !== 0) {
                    reject(new Error(`claude CLI exited with code ${code}: ${stderr}`));
                } else {
                    resolve(stdout.trim());
                }
            });

            child.on('error', reject);

            // Send prompt via stdin to avoid argument length limits
            child.stdin.write(prompt);
            child.stdin.end();
        });
    }
}
