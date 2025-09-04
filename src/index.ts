#!/usr/bin/env bun
import { Command } from 'commander';
import { handleChat, handleEdit } from './commands';

const program = new Command();

program
  .command('ac <prompt>')
  .description('AI Chat mode')
  .action(async (prompt) => {
    try {
      const result = await handleChat(prompt);
      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      // Don't exit with code 1
    }
  });

program
  .command('ae <prompt>')
  .description('AI Edit mode')
  .action(async (prompt) => {
    try {
      const result = await handleEdit(prompt);
      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      // Don't exit with code 1
    }
  });

program.parse(process.argv);