import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
}

export async function searchInFiles(pattern: string, directory: string = process.cwd(), fileExtensions?: string[]): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  async function searchFile(filePath: string) {
    try {
      const content = await Bun.file(filePath).text();
      const lines = content.split('\n');
      
      lines.forEach((line: string, index: number) => {
        const regex = new RegExp(pattern, 'gi');
        let match;
        
        while ((match = regex.exec(line)) !== null) {
          results.push({
            file: filePath,
            line: index + 1,
            column: match.index + 1,
            match: match[0],
            context: line.trim()
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  async function walkDirectory(dir: string) {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          await walkDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = extname(item).toLowerCase();
          if (!fileExtensions || fileExtensions.includes(ext)) {
            await searchFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  await walkDirectory(directory);
  return results;
}

export async function searchWithGrep(pattern: string, directory: string = process.cwd(), options?: { 
  recursive?: boolean;
  ignoreCase?: boolean;
  filePattern?: string;
}): Promise<string> {
  try {
    let cmd = 'grep';
    
    if (options?.recursive) cmd += ' -r';
    if (options?.ignoreCase) cmd += ' -i';
    cmd += ' -n';
    
    if (options?.filePattern) {
      cmd += ` --include="${options.filePattern}"`;
    }
    
    cmd += ` "${pattern}" "${directory}"`;
    
    const proc = Bun.spawn(cmd.split(' '), { stdout: 'pipe' });
    const output = await new Response(proc.stdout).text();
    return output;
  } catch (error) {
    return `Search failed: ${error instanceof Error ? error.message : error}`;
  }
}