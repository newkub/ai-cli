import { existsSync, statSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface FileInfo {
  path: string;
  exists: boolean;
  size?: number;
  lastModified?: Date;
  content?: string;
}

export async function readFileContent(filePath: string): Promise<FileInfo> {
  try {
    if (!existsSync(filePath)) {
      return {
        path: filePath,
        exists: false
      };
    }
    
    const stat = statSync(filePath);
    const content = await Bun.file(filePath).text();
    
    return {
      path: filePath,
      exists: true,
      size: stat.size,
      lastModified: stat.mtime,
      content
    };
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}

export async function writeFileContent(filePath: string, content: string, createDir: boolean = true): Promise<boolean> {
  try {
    if (createDir) {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    
    await Bun.write(filePath, content);
    return true;
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}

export function listFiles(dirPath: string, extension?: string): string[] {
  try {
    const { readdirSync } = require('fs');
    const files = readdirSync(dirPath, { withFileTypes: true });
    
    return files
      .filter((file: any) => file.isFile())
      .map((file: any) => file.name)
      .filter((name: string) => !extension || name.endsWith(extension));
  } catch (error) {
    throw new Error(`Failed to list files in ${dirPath}: ${error instanceof Error ? error.message : error}`);
  }
}
