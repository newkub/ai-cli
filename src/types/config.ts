export type ModelType = 'gpt-3.5-turbo' | 'gpt-4' | 'claude-2' | 'claude-3'

export type ApiKeyType = `sk-${string}`

export interface KoaiConfig {
  chat?: {
    model?: ModelType
    maxTokens?: number
    temperature?: number
    systemMessage?: string
  }
  edit?: {
    model?: ModelType
    maxTokens?: number
    temperature?: number
    systemMessage?: string
  }
  apiKey?: ApiKeyType
}

export function defineKoaiConfig(config: KoaiConfig) {
  const defaultConfig: KoaiConfig = {
    chat: {
      systemMessage: 'You are a helpful AI assistant'
    },
    edit: {
      systemMessage: 'You are a helpful AI coding assistant'
    }
  }
  
  return {
    ...defaultConfig,
    ...config
  }
}