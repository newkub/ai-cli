import blessed from 'blessed';
import { spawn } from 'child_process';
import { useOpenAI, type OpenAIInstance } from '../utils/useOpenAI.js';

interface TUIConfig {
  screen: blessed.Widgets.Screen;
  leftPanel: blessed.Widgets.BoxElement;
  rightPanel: blessed.Widgets.BoxElement;
  chatInput: blessed.Widgets.TextboxElement;
  chatMessages: blessed.Widgets.BoxElement;
  gitPanel: blessed.Widgets.BoxElement;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class TUIApp {
  private config: TUIConfig;
  private chatHistory: ChatMessage[] = [];
  private gitProcess: any;
  private openai?: OpenAIInstance;

  constructor() {
    this.config = this.initializeScreen();
    this.setupPanels();
    this.setupEventHandlers();
    this.startGitUI();
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    try {
      this.openai = useOpenAI({
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        systemMessage: 'You are a helpful AI assistant integrated into a terminal-based development tool. Be concise and helpful.'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.config.chatMessages.setContent(`{red-fg}OpenAI Error:{/red-fg} ${errorMessage}\n\nPlease check your OPENAI_API_KEY environment variable.`);
      this.config.screen.render();
    }
  }

  private initializeScreen(): TUIConfig {
    const screen = blessed.screen({
      smartCSR: true,
      title: 'KoAI - Terminal UI',
      dockBorders: true,
      fullUnicode: true,
      autoPadding: true,
    });

    // Left Panel - AI Chat
    const leftPanel = blessed.box({
      parent: screen,
      top: 0,
      left: 0,
      width: '50%',
      height: '100%',
      border: {
        type: 'line'
      },
      label: ' AI Chat ',
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    // Right Panel - GitUI
    const rightPanel = blessed.box({
      parent: screen,
      top: 0,
      left: '50%',
      width: '50%',
      height: '100%',
      border: {
        type: 'line'
      },
      label: ' Git UI ',
      style: {
        border: {
          fg: 'green'
        }
      }
    });

    // Chat Messages Area
    const chatMessages = blessed.box({
      parent: leftPanel,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-5',
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true,
      content: 'Welcome to KoAI Chat!\nType your message below and press Enter to send.',
      style: {
        fg: 'white',
        bg: 'black'
      },
      tags: true
    });

    // Chat Input
    const chatInput = blessed.textbox({
      parent: leftPanel,
      bottom: 1,
      left: 1,
      width: '100%-4',
      height: 3,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        focus: {
          border: {
            fg: 'yellow'
          }
        }
      },
      inputOnFocus: true,
      keys: true,
      mouse: true
    });

    // Git Panel Content
    const gitPanel = blessed.box({
      parent: rightPanel,
      top: 1,
      left: 1,
      width: '100%-2',
      height: '100%-2',
      style: {
        fg: 'white',
        bg: 'black'
      },
      content: 'Loading Git UI...',
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true
    });

    return {
      screen,
      leftPanel,
      rightPanel,
      chatInput,
      chatMessages,
      gitPanel
    };
  }

  private setupPanels(): void {
    // Focus management - always return to chat input
    this.config.screen.key(['tab'], () => {
      if (this.config.screen.focused === this.config.chatInput) {
        this.config.gitPanel.focus();
        // Auto return to chat input after a short delay
        setTimeout(() => {
          this.config.chatInput.focus();
          this.config.screen.render();
        }, 2000);
      } else {
        this.config.chatInput.focus();
        this.config.screen.render();
      }
    });

    // Ensure chat input always gets focus back
    this.config.screen.on('element focus', () => {
      if (this.config.screen.focused !== this.config.chatInput) {
        setTimeout(() => {
          this.config.chatInput.focus();
          this.config.screen.render();
        }, 100);
      }
    });

    // Initial focus on chat input
    this.config.chatInput.focus();
  }

  private setupEventHandlers(): void {
    // Exit handlers
    this.config.screen.key(['escape', 'q', 'C-c'], () => {
      this.cleanup();
      return process.exit(0);
    });

    // Refresh git status
    this.config.screen.key(['r'], () => {
      this.showGitStatus();
      // Return focus to chat input after refresh
      setTimeout(() => {
        this.config.chatInput.focus();
        this.config.screen.render();
      }, 100);
    });

    // Chat input handler
    this.config.chatInput.on('submit', (text: string) => {
      if (text.trim()) {
        this.handleChatMessage(text.trim());
        this.config.chatInput.clearValue();
        this.config.chatInput.focus(); // Keep focus on input
        this.config.screen.render();
      }
    });

    // Screen resize handler
    this.config.screen.on('resize', () => {
      this.config.screen.render();
    });
  }

  private async handleChatMessage(message: string): Promise<void> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.chatHistory.push(userMessage);
    this.displayChatMessage(userMessage);

    // Show loading indicator
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '{gray-fg}🤔 กำลังคิด...{/gray-fg}',
      timestamp: new Date()
    };
    this.displayChatMessage(loadingMessage);

    try {
      if (!this.openai) {
        throw new Error('OpenAI is not initialized');
      }

      // Call OpenAI API
      const response = await this.openai.chat(message);
      
      // Remove loading message and add real response
      this.chatHistory.pop(); // Remove loading message from history
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: response || 'ขออภัย ไม่สามารถตอบได้ในขณะนี้',
        timestamp: new Date()
      };
      
      this.chatHistory.push(aiResponse);
      this.updateChatDisplay();
      
    } catch (error) {
      // Remove loading message and show error
      this.chatHistory.pop(); // Remove loading message from history
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `{red-fg}Error:{/red-fg} ${errorMessage}`,
        timestamp: new Date()
      };
      
      this.chatHistory.push(errorResponse);
      this.updateChatDisplay();
    }
  }

  private displayChatMessage(message: ChatMessage): void {
    const timeStr = message.timestamp.toLocaleTimeString();
    const roleColor = message.role === 'user' ? 'cyan' : 'green';
    const roleLabel = message.role === 'user' ? 'You' : 'AI';
    
    const formattedMessage = `{${roleColor}-fg}[${timeStr}] ${roleLabel}:{/${roleColor}-fg} ${message.content}\n`;
    
    this.config.chatMessages.insertBottom(formattedMessage);
    this.config.chatMessages.setScrollPerc(100);
    this.config.chatInput.focus(); // Maintain focus on input
    this.config.screen.render();
  }

  private updateChatDisplay(): void {
    // Clear and rebuild the entire chat display
    this.config.chatMessages.setContent('');
    
    for (const message of this.chatHistory) {
      const timeStr = message.timestamp.toLocaleTimeString();
      const roleColor = message.role === 'user' ? 'cyan' : 'green';
      const roleLabel = message.role === 'user' ? 'You' : 'AI';
      
      const formattedMessage = `{${roleColor}-fg}[${timeStr}] ${roleLabel}:{/${roleColor}-fg} ${message.content}\n`;
      this.config.chatMessages.insertBottom(formattedMessage);
    }
    
    this.config.chatMessages.setScrollPerc(100);
    this.config.chatInput.focus(); // Maintain focus on input
    this.config.screen.render();
  }

  private startGitUI(): void {
    // Show git status as list instead of GitUI
    this.showGitStatus();
  }

  private showGitStatus(): void {
    // Get git status with porcelain format for better parsing
    const gitStatus = spawn('git', ['status', '--porcelain'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let statusOutput = '';
    
    gitStatus.stdout?.on('data', (data: Buffer) => {
      statusOutput += data.toString();
    });

    gitStatus.on('close', (code: number) => {
      if (code === 0) {
        this.displayGitStatusList(statusOutput);
      }
    });

    gitStatus.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      this.config.gitPanel.setContent(`{red-fg}Git Error:{/red-fg} ${error}\n\n{yellow-fg}Press 'r' to refresh{/yellow-fg}`);
      this.config.screen.render();
    });

    gitStatus.on('error', () => {
      this.config.gitPanel.setContent(`{red-fg}Git not found or not a git repository{/red-fg}\n\n{yellow-fg}Press 'r' to refresh{/yellow-fg}`);
      this.config.screen.render();
    });
  }

  private displayGitStatusList(statusOutput: string): void {
    const lines = statusOutput.trim().split('\n').filter(line => line.trim());
    
    let content = '{green-fg}{bold}Git Status{/bold}{/green-fg}\n\n';
    
    if (lines.length === 0) {
      content += '{green-fg}✓ Working tree clean{/green-fg}\n';
    } else {
      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];
      
      for (const line of lines) {
        const status = line.substring(0, 2);
        const fileName = line.substring(3);
        
        if (status[0] !== ' ' && status[0] !== '?') {
          // Staged changes
          const statusIcon = this.getStatusIcon(status[0]);
          staged.push(`  {green-fg}${statusIcon}{/green-fg} ${fileName}`);
        }
        
        if (status[1] !== ' ' && status[1] !== '?') {
          // Modified changes
          const statusIcon = this.getStatusIcon(status[1]);
          modified.push(`  {yellow-fg}${statusIcon}{/yellow-fg} ${fileName}`);
        }
        
        if (status === '??') {
          // Untracked files
          untracked.push(`  {red-fg}?{/red-fg} ${fileName}`);
        }
      }
      
      if (staged.length > 0) {
        content += '{green-fg}{bold}Staged Changes:{/bold}{/green-fg}\n';
        content += staged.join('\n') + '\n\n';
      }
      
      if (modified.length > 0) {
        content += '{yellow-fg}{bold}Modified:{/bold}{/yellow-fg}\n';
        content += modified.join('\n') + '\n\n';
      }
      
      if (untracked.length > 0) {
        content += '{red-fg}{bold}Untracked:{/bold}{/red-fg}\n';
        content += untracked.join('\n') + '\n\n';
      }
    }
    
    content += '{cyan-fg}Press \'r\' to refresh • Press \'Tab\' to switch panels{/cyan-fg}';
    
    this.config.gitPanel.setContent(content);
    this.config.screen.render();
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'M': return '●'; // Modified
      case 'A': return '+'; // Added
      case 'D': return '−'; // Deleted
      case 'R': return '→'; // Renamed
      case 'C': return '©'; // Copied
      case 'U': return '!'; // Unmerged
      default: return '?';
    }
  }

  private cleanup(): void {
    if (this.gitProcess) {
      this.gitProcess.kill();
    }
  }

  public run(): void {
    this.config.screen.render();
  }
}

export function startTUI(): void {
  const app = new TUIApp();
  app.run();
}