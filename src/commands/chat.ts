import { text, spinner } from '@clack/prompts';
import { useOpenAI } from '../utils/useOpenAI';
import type { KoaiConfig } from '../types/config';

export async function handleChat(prompt: string, config?: KoaiConfig['chat']): Promise<string> {
  const s = spinner();
  s.start('Processing chat request');
  
  const openai = useOpenAI({
    model: config?.model || 'gpt-3.5-turbo',
    maxTokens: config?.maxTokens || 1000,
    temperature: config?.temperature || 0.7,
    systemMessage: config?.systemMessage ? config.systemMessage : undefined
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
    const prompt = await text({
      message: 'Enter your message: ',
      validate: (input) => {
        if (typeof input !== 'string') return 'Please enter a valid message';
      }
    });
    
    if (typeof prompt !== 'string') {
      continue;
    }
    
    const s = spinner();
    s.start('Processing chat request');
    
    const response = await openai.chat(prompt);
    
    s.stop('Done!');
    console.log(response);
  }
}
