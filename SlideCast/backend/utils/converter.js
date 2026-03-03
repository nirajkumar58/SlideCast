import fs from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to get Python executable path
const getPythonPath = () => {
  // Common Python installation paths on Windows
  const pythonPaths = [
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
    'C:\\Python39\\python.exe',
    'C:\\Python38\\python.exe',
    'python.exe',
    'python'
  ]

  for (const pythonPath of pythonPaths) {
    try {
      // For full paths, check if file exists first
      if (pythonPath.includes(':\\') && !existsSync(pythonPath)) {
        continue
      }

      // Test if Python works
      const result = spawnSync(pythonPath, ['--version'])
      
      if (result.status === 0) {
        console.log('Found working Python at:', pythonPath)
        console.log('Python version:', result.stdout.toString().trim())
        return pythonPath
      }
    } catch (err) {
      console.log('Error checking Python path:', pythonPath, err.message)
      continue
    }
  }
  
  throw new Error('Python not found. Please ensure Python is installed and in PATH')
}

export const convertToPDF = async (inputBuffer) => {
  let tempInputPath
  let tempOutputPath
  
  try {
    console.log('Starting PDF conversion process...')
    
    // Create temporary input file with unique timestamp
    const timestamp = Date.now()
    tempInputPath = path.join(__dirname, `../temp/input-${timestamp}.pptx`)
    tempOutputPath = path.join(__dirname, `../temp/output-${timestamp}.pdf`)
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp')
    await fs.mkdir(tempDir, { recursive: true })
    console.log('Temporary directory created/verified:', tempDir)
    
    // Write input buffer to temp file
    await fs.writeFile(tempInputPath, inputBuffer)
    console.log('Input file written to:', tempInputPath)

    // Get Python path
    const pythonPath = getPythonPath()
    console.log('Using Python executable:', pythonPath)

    // Build converter script path
    const scriptPath = path.join(__dirname, 'ppt_converter.py')
    console.log('Using converter script at:', scriptPath)
    
    if (!existsSync(scriptPath)) {
      throw new Error(`Converter script not found at: ${scriptPath}`)
    }

    // Convert using Python script
    const result = await new Promise((resolve, reject) => {
      console.log('Spawning Python process...')
      console.log('Command:', pythonPath, [scriptPath, tempInputPath, tempOutputPath].join(' '))
      
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        tempInputPath,
        tempOutputPath
      ])

      let stdoutData = ''
      let stderrData = ''

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString()
        stdoutData += output
        console.log('Python stdout:', output)
      })

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString()
        stderrData += error
        console.log('Python stderr:', error)
      })

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error)
        reject(new Error(`Failed to start conversion process: ${error.message}\nCommand: ${pythonPath} ${scriptPath} ${tempInputPath} ${tempOutputPath}`))
      })

      pythonProcess.on('close', async (code) => {
        console.log('Python process exited with code:', code)
        console.log('Full stdout:', stdoutData)
        console.log('Full stderr:', stderrData)
        
        if (code !== 0) {
          let errorMessage = `Conversion failed with exit code ${code}.`
          if (stderrData) {
            errorMessage += `\nError output: ${stderrData}`
          }
          if (stdoutData) {
            errorMessage += `\nStandard output: ${stdoutData}`
          }
          reject(new Error(errorMessage))
          return
        }

        try {
          // Verify the output file exists
          if (!existsSync(tempOutputPath)) {
            throw new Error(`Output PDF file not found at: ${tempOutputPath}`)
          }

          // Read the converted PDF
          console.log('Reading converted PDF file...')
          const pdfBuffer = await fs.readFile(tempOutputPath)
          console.log('Successfully read PDF buffer of size:', pdfBuffer.length)
          
          resolve(pdfBuffer)
        } catch (err) {
          console.error('Error processing conversion result:', err)
          reject(err)
        }
      })
    })

    return result
  } catch (error) {
    console.error('Conversion error:', error)
    throw error
  } finally {
    // Clean up temp files
    console.log('Cleaning up temporary files...')
    try {
      if (tempInputPath && existsSync(tempInputPath)) {
        await fs.unlink(tempInputPath)
        console.log('Cleaned up input file:', tempInputPath)
      }
      if (tempOutputPath && existsSync(tempOutputPath)) {
        await fs.unlink(tempOutputPath)
        console.log('Cleaned up output file:', tempOutputPath)
      }
    } catch (err) {
      console.error('Error cleaning up temp files:', err)
    }
  }
}
