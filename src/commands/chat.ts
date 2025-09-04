import { text, spinner } from '@clack/prompts';

export async function handleChat(prompt: string): Promise<string> {
  const s = spinner();
  s.start('Processing chat request');
  
  // Simulate processing
  await Bun.sleep(1000);
  
  s.stop('Done!');
  return `Response for: ${prompt}`;
}
