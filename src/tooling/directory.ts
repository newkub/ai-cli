import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface DirectoryItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: DirectoryItem[];
}

export function showDirectoryStructure(path: string = process.cwd(), maxDepth: number = 3): DirectoryItem[] {
  function buildTree(currentPath: string, depth: number): DirectoryItem[] {
    if (depth <= 0) return [];
    
    try {
      const items = readdirSync(currentPath);
      return items
        .filter(item => !item.startsWith('.') && item !== 'node_modules')
        .map(item => {
          const fullPath = join(currentPath, item);
          const stat = statSync(fullPath);
          
          const result: DirectoryItem = {
            name: item,
            type: stat.isDirectory() ? 'directory' : 'file',
          };
          
          if (stat.isFile()) {
            result.size = stat.size;
          } else if (stat.isDirectory()) {
            result.children = buildTree(fullPath, depth - 1);
          }
          
          return result;
        });
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
      return [];
    }
  }
  
  return buildTree(path, maxDepth);
}

export function showDirectoryTree(path: string = process.cwd()): string {
  try {
    return execSync(`tree "${path}" /F /A`, { encoding: 'utf8' });
  } catch (error) {
    // Fallback for systems without tree command
    const items = showDirectoryStructure(path);
    return formatTree(items);
  }
}

function formatTree(items: DirectoryItem[], indent: string = ''): string {
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const prefix = indent + (isLast ? '└── ' : '├── ');
    const nextIndent = indent + (isLast ? '    ' : '│   ');
    
    let result = prefix + item.name;
    if (item.type === 'file' && item.size) {
      result += ` (${item.size} bytes)`;
    }
    
    if (item.children && item.children.length > 0) {
      result += '\n' + formatTree(item.children, nextIndent);
    }
    
    return result;
  }).join('\n');
}
