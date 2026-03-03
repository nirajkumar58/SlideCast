# PPT to Audio Converter

Convert PowerPoint presentations into engaging audio content with AI-generated deep dive discussions.

## Features

- **Multiple Audio Modes**
  - Deep Dive Overview (10-15 minutes)
  - Per Slide Explanations (1-2 minutes per slide)
  - Quick Summary (3-5 minutes)

- **Smart Content Processing**
  - Converts bullet points into natural conversations
  - Adds context and examples
  - Maintains professional tone
  - Generates engaging transitions

- **Interactive Audio Player**
  - Play/Pause/Stop controls
  - Per-slide navigation
  - Progress tracking
  - Feedback system

## Prerequisites

- Node.js 16+
- MongoDB
- OpenAI API Key
- Perplexity API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd slidecast
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:

Create `.env` files in both backend and frontend directories using the provided templates:

Backend (.env):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/slidecast
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

Frontend (.env):
```env
VITE_API_URL=http://localhost:5000
```

## Running the Application

1. Start the development servers:
```bash
# Start both frontend and backend
npm start

# Or start them separately:
npm run frontend
npm run backend
```

2. Open your browser and navigate to:
```
http://localhost:5173
```

## Usage

1. **Upload Presentation**
   - Drag and drop your PPT/PPTX file
   - Or click to select file

2. **Select Processing Mode**
   - Deep Dive Overview: Comprehensive discussion of the entire presentation
   - Per Slide: Individual explanations for each slide
   - Quick Summary: Concise overview of key points

3. **Listen and Interact**
   - Use the audio player controls
   - Navigate between slides (in per-slide mode)
   - Provide feedback using thumbs up/down

## API Endpoints

### POST /api/audio/process
Upload and process a presentation
- Body: FormData with 'file' and 'mode'
- Returns: Processed content based on mode

### GET /api/audio/status/:id
Check processing status
- Returns: Current status and progress

### POST /api/audio/feedback
Submit feedback for processed content
- Body: 
  ```json
  {
    "contentId": "string",
    "rating": "like" | "dislike",
    "feedback": "string"
  }
  ```

## Architecture

- Frontend: React with Vite, TailwindCSS
- Backend: Node.js, Express
- Database: MongoDB
- Content Processing: 
  - OpenAI GPT-4 API for initial processing
  - Perplexity API for content enhancement
- Audio: Web Speech API (with future ElevenLabs integration option)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Future Enhancements

- ElevenLabs integration for higher quality voices
- Background music options
- Additional processing modes
- Export functionality
- Progress saving
- User accounts and history

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB is running locally
   - Check connection string in .env

2. **API Key Issues**
   - Verify OpenAI API key is valid
   - Confirm Perplexity API key is correct

3. **File Processing Errors**
   - Check file format (PPT/PPTX only)
   - Ensure file size is under limit

## License

MIT License - see LICENSE file for details
