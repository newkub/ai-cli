import { useOpenAI } from '../utils/useOpenAI';
import * as tooling from '../tooling';

export interface AgentTask {
  goal: string;
  context?: string;
  files?: string[];
}

export interface AgentAction {
  action: string;
  reasoning: string;
  tool?: string;
  parameters?: any;
  result?: any;
}

export async function handleAgent(userInput: string): Promise<string> {
  try {
    // Analyze user input to determine what the agent should do
    const task = await analyzeUserRequest(userInput);
    
    // Execute the task using available tools
    const actions = await planAndExecute(task);
    
    // Format and return results
    return formatAgentResponse(actions, task);
  } catch (error) {
    return `Agent error: ${error instanceof Error ? error.message : error}`;
  }
}

async function analyzeUserRequest(input: string): Promise<AgentTask> {
  const systemPrompt = `You are an AI agent analyzer. Analyze the user's request and extract:
1. The main goal they want to achieve
2. Any context or constraints
3. Files they might want to work with

Respond with JSON format:
{
  "goal": "brief description of main goal",
  "context": "any additional context",
  "files": ["array of file paths if mentioned"]
}`;

  const openai = useOpenAI({ 
    model: 'gpt-4',
    temperature: 0.1,
    systemMessage: systemPrompt
  });
  const response = await openai.chat(input);

  try {
    return JSON.parse(response || '{}');
  } catch {
    return { goal: input };
  }
}

async function planAndExecute(task: AgentTask): Promise<AgentAction[]> {
  const actions: AgentAction[] = [];
  
  // Start with project analysis
  actions.push(await analyzeProject());
  
  // Check git status if relevant
  if (shouldCheckGit(task)) {
    actions.push(await checkGitStatus());
  }
  
  // Analyze specific files if mentioned
  if (task.files && task.files.length > 0) {
    for (const file of task.files) {
      actions.push(await analyzeFile(file));
    }
  }
  
  // Plan next steps based on analysis
  const nextSteps = await planNextSteps(task, actions);
  actions.push(...nextSteps);
  
  return actions;
}

async function analyzeProject(): Promise<AgentAction> {
  try {
    const structure = tooling.showDirectoryStructure(process.cwd(), 2);
    return {
      action: 'analyze_project_structure',
      reasoning: 'Getting overview of project structure to understand context',
      tool: 'directory',
      result: structure
    };
  } catch (error) {
    return {
      action: 'analyze_project_structure',
      reasoning: 'Failed to analyze project structure',
      result: `Error: ${error instanceof Error ? error.message : error}`
    };
  }
}

async function checkGitStatus(): Promise<AgentAction> {
  try {
    const status = tooling.showGitStatus();
    return {
      action: 'check_git_status',
      reasoning: 'Checking git status to understand current changes',
      tool: 'git',
      result: status
    };
  } catch (error) {
    return {
      action: 'check_git_status',
      reasoning: 'Failed to check git status',
      result: `Error: ${error instanceof Error ? error.message : error}`
    };
  }
}

async function analyzeFile(filePath: string): Promise<AgentAction> {
  try {
    const fileInfo = tooling.readFileContent(filePath);
    return {
      action: 'analyze_file',
      reasoning: `Analyzing file ${filePath} to understand its content`,
      tool: 'file',
      parameters: { filePath },
      result: fileInfo
    };
  } catch (error) {
    return {
      action: 'analyze_file',
      reasoning: `Failed to analyze file ${filePath}`,
      parameters: { filePath },
      result: `Error: ${error instanceof Error ? error.message : error}`
    };
  }
}

async function planNextSteps(task: AgentTask, analysis: AgentAction[]): Promise<AgentAction[]> {
  const systemPrompt = `Based on the task goal and analysis results, suggest the next actions to take.
Available tools:
- directory: show directory structure, list files
- git: check status, show diff, show log
- file: read, write files
- command: execute shell commands

Respond with an array of action objects in JSON format:
[
  {
    "action": "action_name",
    "reasoning": "why this action is needed",
    "tool": "tool_to_use",
    "parameters": { "param": "value" }
  }
]`;

  const context = {
    task,
    analysis: analysis.map(a => ({ action: a.action, result: a.result }))
  };

  const openai = useOpenAI({ 
    model: 'gpt-4',
    temperature: 0.1,
    systemMessage: systemPrompt
  });
  try {
    const response = await openai.chat(JSON.stringify(context, null, 2));
    return JSON.parse(response || '[]');
  } catch {
    return [{
      action: 'manual_review',
      reasoning: 'Unable to automatically plan next steps, manual review needed'
    }];
  }
}

function shouldCheckGit(task: AgentTask): boolean {
  const gitKeywords = ['commit', 'push', 'pull', 'status', 'diff', 'branch', 'merge'];
  return gitKeywords.some(keyword => 
    task.goal.toLowerCase().includes(keyword) || 
    (task.context && task.context.toLowerCase().includes(keyword))
  );
}

function formatAgentResponse(actions: AgentAction[], task: AgentTask): string {
  let response = `🤖 AI Agent Analysis for: "${task.goal}"\n\n`;
  
  actions.forEach((action, index) => {
    response += `${index + 1}. **${action.action}**\n`;
    response += `   Reasoning: ${action.reasoning}\n`;
    
    if (action.tool) {
      response += `   Tool used: ${action.tool}\n`;
    }
    
    if (action.result) {
      if (typeof action.result === 'object') {
        response += `   Result: ${JSON.stringify(action.result, null, 2)}\n`;
      } else {
        response += `   Result: ${action.result}\n`;
      }
    }
    response += '\n';
  });
  
  response += '---\n';
  response += 'Agent analysis complete. Review the results and let me know if you need further assistance.';
  
  return response;
}