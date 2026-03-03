import { PDFExtract } from 'pdf.js-extract';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL
});

const pdfExtract = new PDFExtract();

export class ContentExtractor {
  static async extractFromPDF(pdfBuffer) {
    try {
      console.log('Starting PDF content extraction...');
      
      // Save buffer to temporary file (required by pdf.js-extract)
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Created temp directory:', tempDir);
      }
      
      const tempFile = path.join(tempDir, `${uuidv4()}.pdf`);
      fs.writeFileSync(tempFile, pdfBuffer);
      console.log('Saved PDF to temp file:', tempFile);

      try {
        // Extract PDF content
        console.log('Extracting content from PDF...');
        const data = await pdfExtract.extract(tempFile, {});
        console.log('PDF parsed successfully, total pages:', data.pages.length);

        // Convert pages to slides
        console.log('Converting pages to slides...');
        const slides = this.convertPagesToSlides(data.pages);
        console.log('Converted to slides:', slides.length);
        console.log('First slide preview:', slides[0]?.content.substring(0, 100));

        // Process each slide to improve content structure
        console.log('Processing slides with AI enhancement...');
        const processedSlides = await this.processSlides(slides);
        console.log('Slides processed successfully');
        console.log('First processed slide preview:', processedSlides[0]?.content.substring(0, 100));

        const result = {
          metadata: {
            title: this.extractTitle(processedSlides),
            totalSlides: processedSlides.length,
            createdAt: new Date()
          },
          slides: processedSlides
        };

        console.log('Content extraction completed:', {
          title: result.metadata.title,
          totalSlides: result.metadata.totalSlides
        });

        return result;
      } finally {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
          console.log('Cleaned up temp file:', tempFile);
        } catch (error) {
          console.warn('Error cleaning up temp file:', error);
        }
      }
    } catch (error) {
      console.error('Content extraction error:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  }

  static convertPagesToSlides(pages) {
    return pages.map((page, index) => {
      // Combine all content items on the page
      const content = page.content
        .sort((a, b) => {
          // Sort by y position first (top to bottom)
          if (Math.abs(a.y - b.y) > 5) { // 5px threshold for same line
            return a.y - b.y;
          }
          // If on same line, sort by x position (left to right)
          return a.x - b.x;
        })
        .map(item => item.str)
        .join(' ')
        .trim();

      return {
        slideNumber: index + 1,
        content: this.cleanSlideContent(content),
        type: this.detectSlideType(content)
      };
    });
  }

  static async processSlides(slides) {
    // Process slides in parallel with rate limiting
    const processedSlides = [];
    const batchSize = 3; // Process 3 slides at a time
    
    for (let i = 0; i < slides.length; i += batchSize) {
      const batch = slides.slice(i, i + batchSize);
      const promises = batch.map(slide => this.enhanceSlideContent(slide));
      const results = await Promise.all(promises);
      processedSlides.push(...results);
    }

    return processedSlides;
  }

  static async enhanceSlideContent(slide) {
    try {
      // Use GPT to improve content structure and readability
      const response = await openai.chat.completions.create({
        model: process.env.MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing and structuring presentation content. Extract and organize the key information from the slide content provided."
          },
          {
            role: "user",
            content: `Analyze and structure this slide content. Extract the title, main points, and any supporting details:

${slide.content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const enhancedContent = response.choices[0].message.content;
      
      return {
        ...slide,
        content: enhancedContent,
        rawContent: slide.content // Keep original content for reference
      };
    } catch (error) {
      console.warn('Error enhancing slide content:', error);
      return slide; // Return original slide if enhancement fails
    }
  }

  static cleanSlideContent(content) {
    return content
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/•/g, '\n• ')          // Format bullet points
      .replace(/([.!?])\s+/g, '$1\n') // Add line breaks after sentences
      .trim();
  }

  static detectSlideType(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('agenda') || lowerContent.includes('outline') || lowerContent.includes('contents')) {
      return 'outline';
    } else if (lowerContent.includes('thank you') || lowerContent.includes('questions?') || lowerContent.includes('q&a')) {
      return 'ending';
    } else if (lowerContent.includes('introduction') || content.match(/^slide\s*1\b/i)) {
      return 'introduction';
    } else {
      return 'content';
    }
  }

  static extractTitle(slides) {
    if (!slides || slides.length === 0) {
      return 'Untitled Presentation';
    }

    // Try to find title in the first slide
    const firstSlide = slides[0];
    const titleMatch = firstSlide.content.match(/^(?:Title:|Slide 1:?)?\s*([^\n.]+)/i);
    
    return titleMatch ? titleMatch[1].trim() : 'Untitled Presentation';
  }
} 