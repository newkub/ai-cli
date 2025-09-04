import { execSync } from 'child_process';

export interface PingResult {
  host: string;
  alive: boolean;
  time?: number;
  error?: string;
}

export interface PortResult {
  host: string;
  port: number;
  open: boolean;
  error?: string;
}

export function pingHost(host: string, timeout: number = 5000): PingResult {
  try {
    const result = execSync(`ping -n 1 -w ${timeout} ${host}`, { encoding: 'utf8' });
    const timeMatch = result.match(/time[<=](\d+)ms/i);
    
    return {
      host,
      alive: true,
      time: timeMatch ? parseInt(timeMatch[1]) : undefined
    };
  } catch (error) {
    return {
      host,
      alive: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function checkPort(host: string, port: number, timeout: number = 3000): Promise<PortResult> {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ host, port, open: false, error: 'Timeout' });
    }, timeout);
    
    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ host, port, open: true });
    });
    
    socket.on('error', (error: Error) => {
      clearTimeout(timer);
      resolve({ host, port, open: false, error: error.message });
    });
  });
}