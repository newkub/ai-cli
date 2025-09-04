import { text, spinner } from '@clack/prompts';
import { useOpenAI } from '../utils/useOpenAI';

export async function handleEdit(prompt: string): Promise<string> {
  const s = spinner();
  s.start('Processing edit request');
  
  const openai = useOpenAI({
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.3
  });
  
  const response = await openai.chat(prompt);
  
  s.stop('Done!');
  return response;
}

export async function interactiveEdit() {
  const openai = useOpenAI({
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.3
  });
  
  while (true) {
    const prompt = await text('Enter your prompt: ');
    const s = spinner();
    s.start('Processing edit request');
    
    const response = await openai.chat(prompt);
    
    s.stop('Done!');
    console.log(response);
  }
}
