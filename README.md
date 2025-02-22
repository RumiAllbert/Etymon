I'll help you modify the README.md. Here's the updated version:

```markdown:README.md
# Etymon 🔍

A beautiful and interactive web application that deconstructs words into their meaningful parts and explains their etymology, with a special focus on Ancient Greek and Latin roots. Built with Next.js, React Flow, and powered by AI. 📚

## Features

- 🏺 Specialized in Ancient Greek and Latin etymology
- 🌍 Support for other language etymologies
- 🔍 Interactive word analysis
- 🌳 Beautiful visualization of word components using React Flow
- 📚 Detailed etymology and meaning breakdowns
- 🎨 Dark mode
- ⚡ Real-time updates and animations
- 🧠 AI-powered word deconstruction using Google's Gemini AI

## Prerequisites

Before you begin, ensure you have:

- 💻 Node.js 18+ installed
- 🔑 A Google AI API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/RumiAllbert/Etymon.git
cd Etymon
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp example.env .env.local
```

Then edit `.env.local` and add your Google AI API key.

4. Run the development server:

```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The Etymon app breaks down words into their constituent parts:

1. 📝 Enter any word in the input field (works best with words of Greek/Latin origin)
2. 🤖 The AI analyzes the word's etymology and components
3. 🎯 A beautiful graph visualization shows:
   - Individual word parts
   - Their origins (primarily Ancient Greek and Latin)
   - Meanings of each component
   - How components combine to form the full word

## Tech Stack

- ⚛️ [Next.js](https://nextjs.org/) - React framework
- 🔄 [React Flow](https://reactflow.dev/) - Graph visualization
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - Styling
- 🧠 [Google Gemini AI](https://ai.google.dev/) - AI-powered word analysis
- 📝 [TypeScript](https://www.typescriptlang.org/) - Type safety
- ⚡ [Jotai](https://jotai.org/) - State management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 🤝