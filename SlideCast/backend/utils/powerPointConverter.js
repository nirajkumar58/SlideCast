import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a Python script for PowerPoint conversion
const pythonScript = `
import os
import sys
import traceback

def convert_to_pdf(input_path, output_path):
    try:
        # Check if input file exists
        if not os.path.exists(input_path):
            print(f"Error: Input file does not exist: {input_path}")
            return False
            
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
            
        # Convert paths to absolute
        abs_input_path = os.path.abspath(input_path)
        abs_output_path = os.path.abspath(output_path)
        
        print(f"Converting {abs_input_path} to {abs_output_path}")
        
        try:
            # Try to import win32com
            import win32com.client
            
            # Initialize PowerPoint
            print("Initializing PowerPoint...")
            powerpoint = win32com.client.Dispatch("Powerpoint.Application")
            powerpoint.Visible = True  # Make it visible to handle any dialogs
            
            # Open the presentation
            print("Opening presentation...")
            presentation = powerpoint.Presentations.Open(abs_input_path)
            
            # Save as PDF (formatType = 32 for PDF)
            print("Saving as PDF...")
            presentation.SaveAs(abs_output_path, 32)
            
            # Close everything
            presentation.Close()
            powerpoint.Quit()
            
            # Verify the output file exists
            if os.path.exists(abs_output_path):
                print(f"PDF created successfully: {abs_output_path}")
                print(f"PDF file size: {os.path.getsize(abs_output_path)} bytes")
                return True
            else:
                print(f"Error: Output file was not created: {abs_output_path}")
                return False
                
        except ImportError:
            print("Error: win32com module not found. Please install it with 'pip install pywin32'")
            return False
            
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        
        # Ensure PowerPoint is closed
        try:
            presentation.Close()
            powerpoint.Quit()
        except:
            pass
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: script.py <input_path> <output_path>")
        sys.exit(1)
    
    success = convert_to_pdf(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
`;

// Write the Python script to a file
const scriptPath = path.join(__dirname, 'ppt_converter.py');
fs.writeFileSync(scriptPath, pythonScript);
console.log(`Python script written to: ${scriptPath}`);

export async function convertUsingPowerPoint(inputPath, outputPath) {
  console.log('Starting PowerPoint to PDF conversion using Python script...');
  console.log(`Input file: ${inputPath}`);
  console.log(`Output file: ${outputPath}`);
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }
  
  return new Promise((resolve, reject) => {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Run the Python script
    console.log(`Executing Python script: ${scriptPath}`);
    const pythonProcess = spawn('python', [scriptPath, inputPath, outputPath]);
    
    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log('Python output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error('Python error:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('PowerPoint conversion completed successfully');
        
        // Verify the output file exists
        if (fs.existsSync(outputPath)) {
          console.log(`Output file exists: ${outputPath}`);
          console.log(`Output file size: ${fs.statSync(outputPath).size} bytes`);
          resolve(true);
        } else {
          const error = new Error(`PowerPoint conversion failed: Output file does not exist: ${outputPath}`);
          console.error(error);
          reject(error);
        }
      } else {
        const error = new Error(`PowerPoint conversion failed with code ${code}.\nOutput: ${stdoutData}\nError: ${stderrData}`);
        console.error(error);
        reject(error);
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
} 