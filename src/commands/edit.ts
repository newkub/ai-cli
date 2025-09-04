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

export async function interactiveEdit() {
  const openai = useOpenAI({
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.3
  });
  
  while (true) {
    const prompt = await text({
      message: 'Enter text to edit: ',
      validate: (input) => {
        if (typeof input !== 'string') return 'Please enter valid text';
      }
    });
    
    if (typeof prompt !== 'string') {
      continue;
    }
    
    const s = spinner();
    s.start('Processing edit request');
    
    const response = await openai.chat(prompt);
    
    s.stop('Done!');
    console.log(response);
  }
}
