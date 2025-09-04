# AI CLI Tool

A command line tool for working with AI using OpenAI API

## Features

- Chat with AI (`chat` command)
- Edit content with AI (`edit` command)

## Installation

### Package Managers

| Manager | Install Command |
|---------|----------------|
| Bun | `bun install` |
| npm | `npm install` |
| pnpm | `pnpm install` |
| yarn | `yarn install` |

1. Install [Bun](https://bun.sh/) (recommended) or Node.js 18+
2. Install dependencies using your preferred package manager
3. Create `.env` file and set OPENAI_API_KEY:
```env
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Chat command
```bash
bun run chat "your message"
```

### Edit command
```bash
bun run edit "text to edit"
```

## Development

Project structure:
```
src/
  commands/
    chat.ts    # AI chat functions
    edit.ts    # AI edit functions
  utils/
    useOpenAI.ts # Helper for OpenAI API
```

## Requirements

- Node.js 18+
- Bun
- OpenAI API Key