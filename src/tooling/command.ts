import { execSync, spawn } from 'child_process';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export function executeCommand(command: string, options?: { cwd?: string; timeout?: number }): CommandResult {
  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      cwd: options?.cwd || process.cwd(),
      timeout: options?.timeout || 10000,
    });
    
    return {
      stdout: stdout.toString(),
      stderr: '',
      exitCode: 0,
      success: true
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message || '',
      exitCode: error.status || 1,
      success: false
    };
  }
}

export function executeCommandAsync(command: string, args: string[] = [], options?: { cwd?: string }): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options?.cwd || process.cwd(),
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
        success: (code || 0) === 0
      });
    });
  });
}
