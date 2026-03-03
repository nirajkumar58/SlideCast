import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class PPTConverter {
  static async convertToPDF(pptBuffer) {
    const tempDir = path.join(process.cwd(), 'temp');
    const uniqueId = uuidv4();
    const inputPath = path.join(tempDir, `${uniqueId}.pptx`);
    const outputPath = path.join(tempDir, `${uniqueId}.pdf`);

    try {
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        console.log(`Creating temp directory at: ${tempDir}`);
        fs.mkdirSync(tempDir, { recursive: true });
      }

      console.log(`Temp directory exists: ${fs.existsSync(tempDir)}`);
      console.log(`Writing PPT buffer (${pptBuffer.length} bytes) to: ${inputPath}`);
      
      // Write PPT buffer to temp file
      await writeFile(inputPath, pptBuffer);
      console.log(`PPT file written successfully to: ${inputPath}`);
      console.log(`File exists: ${fs.existsSync(inputPath)}, Size: ${fs.statSync(inputPath).size} bytes`);

      let conversionMethod = '';
      try {
        // Try using LibreOffice first
        console.log('Attempting conversion with LibreOffice...');
        conversionMethod = 'LibreOffice';
        await execAsync(`soffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`);
        console.log('LibreOffice conversion successful');
      } catch (libreOfficeError) {
        console.log(`LibreOffice conversion failed: ${libreOfficeError.message}`);
        try {
          // Try unoconv as fallback
          console.log('Attempting conversion with unoconv...');
          conversionMethod = 'unoconv';
          await execAsync(`unoconv -f pdf -o "${outputPath}" "${inputPath}"`);
          console.log('unoconv conversion successful');
        } catch (unoconvError) {
          console.log(`unoconv conversion failed: ${unoconvError.message}`);
          // If on Windows, try PowerPoint COM automation
          if (process.platform === 'win32') {
            console.log('Attempting conversion with PowerPoint COM...');
            conversionMethod = 'PowerPoint COM';
            const { convertUsingPowerPoint } = await import('./powerPointConverter.js');
            await convertUsingPowerPoint(inputPath, outputPath);
            console.log('PowerPoint COM conversion successful');
          } else {
            throw new Error('No available conversion method');
          }
        }
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        console.error(`Output PDF file does not exist at: ${outputPath}`);
        
        // If LibreOffice was used, the output filename might be different
        if (conversionMethod === 'LibreOffice') {
          const libreOfficeOutputPath = path.join(tempDir, `${uniqueId}.pdf`);
          if (fs.existsSync(libreOfficeOutputPath)) {
            console.log(`Found LibreOffice output at: ${libreOfficeOutputPath}`);
            outputPath = libreOfficeOutputPath;
          } else {
            throw new Error(`PDF conversion failed: Output file not found after ${conversionMethod} conversion`);
          }
        } else {
          throw new Error(`PDF conversion failed: Output file not found after ${conversionMethod} conversion`);
        }
      }

      // Read the converted PDF
      console.log(`Reading converted PDF from: ${outputPath}`);
      const pdfBuffer = await fs.promises.readFile(outputPath);
      console.log(`PDF conversion successful, size: ${pdfBuffer.length} bytes`);

      return pdfBuffer;
    } catch (error) {
      console.error('PDF conversion error:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to convert PPT to PDF: ${error.message}`);
    } finally {
      // Clean up temp files
      try {
        if (fs.existsSync(inputPath)) {
          await unlink(inputPath);
          console.log(`Cleaned up input file: ${inputPath}`);
        }
        if (fs.existsSync(outputPath)) {
          await unlink(outputPath);
          console.log(`Cleaned up output file: ${outputPath}`);
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up temp files:', cleanupError);
      }
    }
  }
} 