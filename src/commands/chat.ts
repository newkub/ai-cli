import { text, spinner } from '@clack/prompts';
import { useOpenAI } from '../utils/useOpenAI';

export async function handleChat(prompt: string): Promise<string> {
  const s = spinner();
  s.start('Processing chat request');
  
  const openai = useOpenAI({
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  });
  
  const response = await openai.chat(prompt);
  
  s.stop('Done!');
  return response;
}

export async function interactiveChat() {
  const openai = useOpenAI({
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  });
  
  while (true) {
    const prompt = await text('Enter your message: ');
    const s = spinner();
    s.start('Processing chat request');
    
    const response = await openai.chat(prompt);
    
    s.stop('Done!');
    console.log(response);
  }
}
