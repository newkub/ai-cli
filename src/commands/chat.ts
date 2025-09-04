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
  
  try {
    const escapedResponse = JSON.stringify(response).slice(1, -1);
    const process = Bun.spawn(['shiki', '-l', 'md', '-t', 'github-dark', escapedResponse]);
    const output = await new Response(process.stdout).text();
    return output;
  } catch (error) {
    console.error('Shiki formatting failed:', error);
    return response;
  }
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
