import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { useOpenAI, type OpenAIInstance } from '../utils/useOpenAI.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GitStatus {
  staged: string[];
  modified: string[];
  untracked: string[];
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'M': return '●'; // Modified
    case 'A': return '+'; // Added
    case 'D': return '−'; // Deleted
    case 'R': return '→'; // Renamed
    case 'C': return '©'; // Copied
    case 'U': return '!'; // Unmerged
    default: return '?';
  }
};

function TUIApp() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to KoAI Chat!\nType your message and press Enter to send.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [gitStatus, setGitStatus] = useState<GitStatus>({ staged: [], modified: [], untracked: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'git'>('chat');
  const [openai, setOpenai] = useState<OpenAIInstance>();
  
  const inputRef = useRef<string>('');

  // Initialize OpenAI
  useEffect(() => {
    try {
      const instance = useOpenAI({
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        systemMessage: 'You are a helpful AI assistant integrated into a terminal-based development tool. Be concise and helpful.'
      });
      setOpenai(instance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `OpenAI Error: ${errorMessage}\n\nPlease check your OPENAI_API_KEY environment variable.`,
        timestamp: new Date()
      }]);
    }
  }, []);
  
  // Git status fetcher
  const fetchGitStatus = useCallback(async (): Promise<void> => {
    try {
      const proc = Bun.spawn(['git', 'status', '--porcelain'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text()
      ]);

      const exitCode = await proc.exited;
      
      if (exitCode === 0) {
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        const staged: string[] = [];
        const modified: string[] = [];
        const untracked: string[] = [];
        
        for (const line of lines) {
          const status = line.substring(0, 2);
          const fileName = line.substring(3);
          
          if (status[0] !== ' ' && status[0] !== '?') {
            staged.push(`${getStatusIcon(status[0])} ${fileName}`);
          }
          
          if (status[1] !== ' ' && status[1] !== '?') {
            modified.push(`${getStatusIcon(status[1])} ${fileName}`);
          }
          
          if (status === '??') {
            untracked.push(`? ${fileName}`);
          }
        }
        
        setGitStatus({ staged, modified, untracked });
      }
    } catch (error) {
      // Git error handling
      setGitStatus({ staged: ['Git not found or not a git repository'], modified: [], untracked: [] });
    }
  }, []);

  // Handle chat messages
  const handleChatMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '🤔 กำลังคิด...',
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      if (!openai) {
        throw new Error('OpenAI is not initialized');
      }

      const response = await openai.chat(message);
      
      // Remove loading message and add real response
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove loading message
        return [...newHistory, {
          role: 'assistant',
          content: response || 'ขออภัย ไม่สามารถตอบได้ในขณะนี้',
          timestamp: new Date()
        }];
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Remove loading message and add error
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove loading message
        return [...newHistory, {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [openai]);

  // Input handling
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      process.exit(0);
    }
    
    if (key.tab) {
      setActivePanel(prev => prev === 'chat' ? 'git' : 'chat');
      return;
    }
    
    if (input === 'r') {
      fetchGitStatus();
      return;
    }
    
    if (activePanel === 'chat') {
      if (key.return) {
        handleChatMessage(inputRef.current);
        setInputValue('');
        inputRef.current = '';
      } else if (key.backspace) {
        inputRef.current = inputRef.current.slice(0, -1);
        setInputValue(inputRef.current);
      } else if (input && !key.ctrl) {
        inputRef.current += input;
        setInputValue(inputRef.current);
      }
    }
  });

  // Load git status on mount
  useEffect(() => {
    fetchGitStatus();
  }, [fetchGitStatus]);

  // Render chat messages
  const renderChatMessages = () => {
    return chatHistory.map((msg, index) => {
      const timeStr = msg.timestamp.toLocaleTimeString();
      const roleColor = msg.role === 'user' ? 'cyan' : 'green';
      const roleLabel = msg.role === 'user' ? 'You' : 'AI';
      
      return (
        <Text key={index} color={roleColor}>
          [{timeStr}] {roleLabel}: <Text color="white">{msg.content}</Text>
        </Text>
      );
    });
  };

  // Render git status
  const renderGitStatus = () => {
    const { staged, modified, untracked } = gitStatus;
    
    return (
      <Box flexDirection="column">
        <Text color="green" bold>Git Status</Text>
        
        {staged.length === 0 && modified.length === 0 && untracked.length === 0 ? (
          <Text color="green">✓ Working tree clean</Text>
        ) : (
          <>
            {staged.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text color="green" bold>Staged Changes:</Text>
                {staged.map((file, i) => (
                  <Text key={i} color="green">  {file}</Text>
                ))}
              </Box>
            )}
            
            {modified.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text color="yellow" bold>Modified:</Text>
                {modified.map((file, i) => (
                  <Text key={i} color="yellow">  {file}</Text>
                ))}
              </Box>
            )}
            
            {untracked.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text color="red" bold>Untracked:</Text>
                {untracked.map((file, i) => (
                  <Text key={i} color="red">  {file}</Text>
                ))}
              </Box>
            )}
          </>
        )}
        
        <Text color="cyan">
          {"\n"}Press 'r' to refresh • Press 'Tab' to switch panels
        </Text>
      </Box>
    );
  };

  return (
    <Box height="100vh" flexDirection="row">
      {/* Left Panel - AI Chat */}
      <Box 
        width="50%" 
        borderStyle="single" 
        borderColor={activePanel === 'chat' ? 'cyan' : 'gray'}
        flexDirection="column"
        paddingX={1}
      >
        <Text color="cyan" bold> AI Chat </Text>
        
        {/* Chat Messages */}
        <Box flexDirection="column" flexGrow={1} paddingY={1}>
          {renderChatMessages()}
          {isLoading && <Text color="gray">🤔 กำลังคิด...</Text>}
        </Box>
        
        {/* Input */}
        <Box borderStyle="single" borderColor={activePanel === 'chat' ? 'yellow' : 'gray'}>
          <Text color="white">{activePanel === 'chat' ? '> ' : ''}{inputValue}</Text>
          {activePanel === 'chat' && <Text color="gray">█</Text>}
        </Box>
      </Box>
      
      {/* Right Panel - Git UI */}
      <Box 
        width="50%" 
        borderStyle="single" 
        borderColor={activePanel === 'git' ? 'green' : 'gray'}
        flexDirection="column"
        paddingX={1}
      >
        <Text color="green" bold> Git UI </Text>
        
        <Box flexDirection="column" flexGrow={1} paddingY={1}>
          {renderGitStatus()}
        </Box>
      </Box>
    </Box>
  );
}

export function startTUI(): void {
  render(<TUIApp />);
}
