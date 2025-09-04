#!/usr/bin/env bun
import { isCancel, text } from '@clack/prompts';
import { Command } from 'commander';
import { handleChat, handleEdit } from './commands';
import { startTUI } from './mode/tui';

const program = new Command();

// Interactive chat mode
program
  .command('chat')
  .description('Interactive AI Chat mode')
  .action(async () => {
    while (true) {
      try {
        const prompt = await text({
          message: 'Enter your message (Ctrl+C to exit)',
        });

        if (isCancel(prompt)) {
          process.exit(0);
        }

        const result = await handleChat(prompt.toString());
        console.log(result);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    }
  });

// Interactive edit mode
program
  .command('edit')
  .description('Interactive AI Edit mode')
  .action(async () => {
    while (true) {
      try {
        const prompt = await text({
          message: 'Enter text to edit (Ctrl+C to exit)',
        });

        if (isCancel(prompt)) {
          process.exit(0);
        }

        const result = await handleEdit(prompt.toString());
        console.log(result);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
    }
  });

// TUI mode
program
  .command('tui')
  .description('Terminal UI mode with AI chat and Git UI panels')
  .action(async () => {
    try {
      startTUI();
    } catch (error) {
      console.error('Error starting TUI:', error instanceof Error ? error.message : error);
    }
  });

// Original commands
program
  .command('ac [prompt...]')
  .description('AI Chat mode (one-time)')
  .action(async (promptParts) => {
    try {
      const prompt = promptParts.join(' ');
      const result = await handleChat(prompt.toString());
      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
  });

program
  .command('ae [prompt...]')
  .description('AI Edit mode (one-time)')
  .action(async (promptParts) => {
    try {
      const prompt = promptParts.join(' ');
      const result = await handleEdit(prompt.toString());
      console.log(result);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
  });

process.on('SIGINT', () => {
  console.log('\nExiting...');
  process.exit(0);
});

program.parse(process.argv);