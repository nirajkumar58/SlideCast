import PDFParser from 'pdf2json'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

export const extractTextFromPDF = async (pdfBuffer) => {
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }
  
  // Create a temporary file path with unique name
  const tempPath = path.join(tempDir, `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  
  console.log('Starting PDF text extraction:', { tempPath });
  
  try {
    // Write the buffer to a temporary file
    await writeFile(tempPath, pdfBuffer);
    console.log('PDF buffer written to temp file');

    // Create a new parser instance with error handling
    const pdfParser = new PDFParser(null, 1); // 1 = processing page by page

    // Convert parser's loadPDF and parseBuffer to promise-based functions
    const loadPDF = promisify(pdfParser.loadPDF.bind(pdfParser));
    
    try {
      // Load and parse the PDF
      await loadPDF(tempPath);
      console.log('PDF loaded successfully');
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      throw new Error('Failed to parse PDF content');
    }
    
    return new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          console.log('PDF parsing completed, processing pages...');
          const slides = [];
          let currentSlideText = [];
          
          // Process each page
          pdfData.Pages.forEach((page, pageIndex) => {
            let slideText = '';
            
            console.log(`Processing page ${pageIndex + 1}/${pdfData.Pages.length}`);
            
            // Extract text from each text element on the page
            page.Texts.forEach((textElement) => {
              try {
                // Decode the text (pdf2json encodes special characters)
                const decodedText = decodeURIComponent(textElement.R[0].T);
                slideText += decodedText + ' ';
              } catch (decodeError) {
                console.warn('Failed to decode text element:', decodeError);
                // Use raw text as fallback
                slideText += textElement.R[0].T + ' ';
              }
            });
            
            // Clean up the text
            slideText = slideText
              .trim()
              .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
              .replace(/\n+/g, '\n')       // Replace multiple newlines with single newline
              .replace(/\\n/g, '\n')       // Replace literal '\n' with newline
              .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces (but not newlines) with single space
            
            // Skip empty slides
            if (slideText.length > 0) {
              slides.push(slideText)
            }
          })
          
          console.log(`Extracted ${slides.length} slides with content`);
          resolve(slides);
        } catch (error) {
          console.error('Error processing PDF data:', error);
          reject(new Error('Failed to process PDF content'));
        }
      });

      pdfParser.on('pdfParser_dataError', (error) => {
        reject(error)
      })
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  } finally {
    // Clean up the temporary file
    try {
      await unlink(tempPath)
    } catch (error) {
      console.error('Error deleting temporary file:', error)
    }
  }
}

// Helper function to clean and format extracted text
const cleanText = (text) => {
  return text
    .replace(/[\r\n]+/g, '\n')           // Normalize line endings
    .replace(/[^\S\r\n]+/g, ' ')         // Replace multiple spaces with single space
    .replace(/•/g, '\n• ')               // Format bullet points
    .replace(/([.!?])\s+/g, '$1\n')      // Add newlines after sentences
    .trim()
}

// Helper function to detect slide boundaries
const isNewSlide = (text) => {
  // Common slide markers
  const slideMarkers = [
    /^slide\s+\d+/i,           // "Slide 1", "Slide 2", etc.
    /^section\s+\d+/i,         // "Section 1", "Section 2", etc.
    /^chapter\s+\d+/i,         // "Chapter 1", "Chapter 2", etc.
    /^\d+\.\s+[A-Z]/,         // "1. Title", "2. Title", etc.
    /^[A-Z][^.!?]+[.!?]$/m,   // Standalone title-like sentences
  ]

  return slideMarkers.some(marker => marker.test(text))
}

// Helper function to group text into logical sections
const groupIntoSections = (text) => {
  const sections = []
  let currentSection = ''

  text.split('\n').forEach(line => {
    if (isNewSlide(line)) {
      if (currentSection.trim()) {
        sections.push(currentSection.trim())
      }
      currentSection = line
    } else {
      currentSection += '\n' + line
    }
  })

  if (currentSection.trim()) {
    sections.push(currentSection.trim())
  }

  return sections
}

export const enhanceSlideText = (slideText) => {
  // Format the text for better readability
  const cleanedText = cleanText(slideText)
  
  // Extract key elements
  const lines = cleanedText.split('\n')
  const title = lines[0]
  const bulletPoints = lines
    .filter(line => line.startsWith('•'))
    .map(point => point.substring(1).trim())
  
  // Format the remaining text into paragraphs
  const paragraphs = lines
    .filter(line => !line.startsWith('•') && line !== title)
    .join(' ')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  return {
    title,
    bulletPoints,
    paragraphs,
    rawText: cleanedText
  }
}
