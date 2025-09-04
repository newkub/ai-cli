import { OpenAI } from 'openai';
import { type ClientOptions } from 'openai';

export interface OpenAIConfig extends Omit<ClientOptions, 'apiKey'> {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export function useOpenAI(config: OpenAIConfig) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
  }

  const openai = new OpenAI({
    ...config,
    apiKey
  });

  async function chat(prompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI Error:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  return {
    chat
  };
}

export type OpenAIInstance = ReturnType<typeof useOpenAI>;
