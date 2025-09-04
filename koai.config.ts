import { defineKoaiConfig } from './src/types/config'

export default defineKoaiConfig({
  chat: {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    systemMessage: 'You are a helpful assistant.'
  },
  edit: {
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.3
  }
})