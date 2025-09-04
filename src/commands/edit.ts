import { text, spinner } from '@clack/prompts';
import { useOpenAI } from '../utils/useOpenAI';

export async function handleFileEdit(filePath: string, prompt: string): Promise<string> {
  const s = spinner();
  s.start(`Editing file ${filePath}`);
  
  // Read file content
  let fileContent = '';
  try {
    fileContent = await Bun.file(filePath).text();
  } catch (error) {
    s.stop('Failed to read file');
    throw new Error(`Cannot read file: ${filePath}`);
  }
  
  const openai = useOpenAI({
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.3
  });
  
  const fullPrompt = `File content:\n\n${fileContent}\n\nEdit instruction:\n${prompt}`;
  const response = await openai.chat(fullPrompt);
  
  // Write edited content back to file
  try {
    await Bun.write(filePath, response);
    s.stop('File edited successfully!');
    return response;
  } catch (error) {
    s.stop('Failed to write file');
    throw new Error(`Cannot write to file: ${filePath}`);
  }
}

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
    const prompt = await text({
      message: 'Enter text to edit: ',
      validate: (input: string) => {
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
