import { execSync } from 'child_process';

export interface GitStatus {
  staged: string[];
  modified: string[];
  untracked: string[];
  branch: string;
  ahead?: number;
  behind?: number;
}

export function showGitStatus(): GitStatus {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];
    
    status.split('\n').forEach(line => {
      if (!line.trim()) return;
      
      const statusCode = line.substring(0, 2);
      const fileName = line.substring(3);
      
      if (statusCode[0] !== ' ') {
        staged.push(fileName);
      }
      if (statusCode[1] === 'M') {
        modified.push(fileName);
      }
      if (statusCode === '??') {
        untracked.push(fileName);
      }
    });
    
    return {
      staged,
      modified,
      untracked,
      branch
    };
  } catch (error) {
    throw new Error(`Git status failed: ${error instanceof Error ? error.message : error}`);
  }
}

export function showGitDiff(staged: boolean = false): string {
  try {
    const command = staged ? 'git diff --cached' : 'git diff';
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    throw new Error(`Git diff failed: ${error instanceof Error ? error.message : error}`);
  }
}

export function showGitLog(count: number = 10): string {
  try {
    return execSync(`git log --oneline -${count}`, { encoding: 'utf8' });
  } catch (error) {
    throw new Error(`Git log failed: ${error instanceof Error ? error.message : error}`);
  }
}
