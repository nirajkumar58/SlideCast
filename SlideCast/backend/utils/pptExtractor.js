import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(xml2js.parseString);

export class PPTExtractor {
  static async extract(fileBuffer) {
    try {
      // Generate a unique temp file name
      const tempId = uuidv4();
      const tempDir = path.join(process.cwd(), 'temp');
      const extractDir = path.join(tempDir, tempId);
      
      // Ensure temp directories exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }

      // Extract PPTX contents (it's a ZIP file)
      await unzipper.Open.buffer(fileBuffer)
        .then(directory => directory.extract({ path: extractDir }));

      // Get all slide XML files
      const slidesDir = path.join(extractDir, 'ppt', 'slides');
      if (!fs.existsSync(slidesDir)) {
        throw new Error('No slides directory found in PPTX file');
      }

      const slideFiles = fs.readdirSync(slidesDir)
        .filter(file => file.match(/slide\d+\.xml/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      if (slideFiles.length === 0) {
        throw new Error('No slide files found in PPTX');
      }

      // Process each slide
      const slides = await Promise.all(slideFiles.map(async (file, index) => {
        try {
          const slideXmlPath = path.join(extractDir, 'ppt', 'slides', file);
          const slideXml = await fs.promises.readFile(slideXmlPath, 'utf8');
          
          // Validate XML content
          if (!slideXml.includes('<?xml') && !slideXml.includes('<p:sld')) {
            console.warn(`Invalid XML content in slide ${index + 1}`);
            return {
              slideNumber: index + 1,
              content: 'Invalid slide content',
              type: 'content'
            };
          }

          const content = await this.extractTextFromSlideXml(slideXml);
          return {
            slideNumber: index + 1,
            content: content || 'Empty slide',
            type: this.detectSlideType(content)
          };
        } catch (error) {
          console.error(`Error processing slide ${index + 1}:`, error);
          return {
            slideNumber: index + 1,
            content: 'Error processing slide',
            type: 'content'
          };
        }
      }));

      // Clean up temp directory
      fs.rmSync(extractDir, { recursive: true, force: true });

      // Ensure we have at least one slide
      const processedSlides = slides.length > 0 ? slides : [{
        slideNumber: 1,
        content: 'No content could be extracted',
        type: 'content'
      }];

      // Log the extracted content for debugging
      console.log('Extracted slides:', processedSlides.map(slide => ({
        number: slide.slideNumber,
        contentLength: slide.content.length,
        type: slide.type
      })));

      return {
            metadata: {
          title: this.extractTitle(processedSlides),
          totalSlides: processedSlides.length,
          createdAt: new Date()
        },
        slides: processedSlides
      };
    } catch (error) {
      console.error('PPT extraction error:', error);
      throw new Error(`Failed to extract PPT content: ${error.message}`);
    }
  }

  static async extractTextFromSlideXml(slideXml) {
    try {
      // Ensure we have valid XML
      if (typeof slideXml !== 'string') {
        console.error('Invalid input: slideXml must be a string');
        return '';
      }

      // Add XML declaration if missing
      if (!slideXml.includes('<?xml')) {
        slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + slideXml;
      }

      // Clean up XML content
      const cleanXml = slideXml
        .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '') // Remove invalid XML characters
        .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;') // Fix unescaped ampersands
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'); // Handle CDATA sections

      // Create parser with more lenient options
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        async: true,
        trim: true,
        normalize: true,
        explicitRoot: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        attrNameProcessors: [xml2js.processors.stripPrefix],
        valueProcessors: [xml2js.processors.parseValues],
        strict: false
      });

      // Parse XML with error handling
      let result;
      try {
        result = await parser.parseStringPromise(cleanXml);
      } catch (parseError) {
        console.error('XML parsing error:', parseError);
        // Try parsing without namespaces as fallback
        const fallbackParser = new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: true,
          async: true,
          trim: true,
          strict: false
        });
        result = await fallbackParser.parseStringPromise(cleanXml);
      }

      if (!result) {
        console.warn('No content found in XML');
        return '';
      }

      const texts = [];

      // Function to recursively extract text from XML nodes
      const extractText = (obj) => {
        if (!obj) return;
        
        if (typeof obj === 'string') {
          const trimmed = obj.trim();
          if (trimmed) texts.push(trimmed);
          return;
        }
        
        if (Array.isArray(obj)) {
          obj.forEach(item => extractText(item));
          return;
        }
        
        if (typeof obj === 'object') {
          // PowerPoint specific text elements
          const textElements = [
            'a:t',           // Text run
            't',             // Text content
            'text',          // Generic text
            'p:txBody',      // Text body
            'a:p',           // Paragraph
            'a:r',           // Text run
            'p:sp',          // Shape with text
            'p:graphicFrame' // Tables and other graphic frames
          ];
          
          // Extract text from known elements
          textElements.forEach(key => {
            if (obj[key]) {
              if (Array.isArray(obj[key])) {
                obj[key].forEach(item => extractText(item));
                } else {
                extractText(obj[key]);
              }
            }
          });
          
          // Process all other properties
          Object.values(obj).forEach(value => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              extractText(value);
            }
          });
        }
      };

      extractText(result);
      
      // Join extracted text with proper spacing
      const extractedText = texts
        .filter(text => text.length > 0)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
        .trim();

      // Log for debugging
      console.log('Extracted text length:', extractedText.length);
      if (extractedText.length === 0) {
        console.warn('No text extracted from valid XML');
      }

      return extractedText;
    } catch (error) {
      console.error('Error parsing slide XML:', error);
      // Return empty string on error to allow processing to continue
      return '';
    }
  }

  static extractTitle(slides) {
    if (!slides || slides.length === 0) return 'Untitled Presentation';
    
    // Assume the first non-empty line of the first slide is the title
    const firstSlideText = slides[0].content;
    const titleMatch = firstSlideText.match(/^[^\n]+/);
    return titleMatch ? titleMatch[0].trim() : 'Untitled Presentation';
  }

  static detectSlideType(text) {
    if (!text) return 'content';
    
    // Simple slide type detection based on content patterns
    if (text.match(/^(agenda|outline|contents?)/i)) {
      return 'outline';
    } else if (text.match(/thank\s*you|questions?|q\s*&\s*a/i)) {
      return 'ending';
    } else if (text.match(/^(introduction|overview)/i)) {
      return 'introduction';
    } else {
      return 'content';
    }
  }
}
