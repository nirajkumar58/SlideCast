import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const requiredStructure = {
  frontend: {
    public: ['document.svg', 'manifest.json', 'robots.txt'],
    src: {
      components: {
        audio: ['AudioPlayer.jsx', 'ConversationModeSelector.jsx', 'EnhancedContent.jsx'],
        ui: [
          'Button.jsx',
          'Card.jsx',
          'Loader.jsx',
          'ProcessingAnimation.jsx'
        ]
      },
      utils: ['axios.js', 'apiTest.js']
    }
  },
  backend: {
    models: ['File.js'],
    routes: ['audio.js', 'files.js'],
    utils: [
      'audioProcessor.js',
      'converter.js',
      'pdfExtractor.js',
      'ppt_converter.py'
    ]
  }
}

const configFiles = {
  frontend: [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    '.env'
  ],
  backend: ['package.json', '.env', 'requirements.txt']
}

function checkDirectory(structure, basePath) {
  let allValid = true

  for (const [name, content] of Object.entries(structure)) {
    const currentPath = path.join(basePath, name)

    if (!fs.existsSync(currentPath)) {
      console.log(chalk.red(`❌ Missing directory: ${currentPath}`))
      allValid = false
      continue
    }

    if (Array.isArray(content)) {
      // Check files
      content.forEach(file => {
        const filePath = path.join(currentPath, file)
        if (!fs.existsSync(filePath)) {
          console.log(chalk.red(`❌ Missing file: ${filePath}`))
          allValid = false
        } else {
          console.log(chalk.green(`✓ Found: ${filePath}`))
        }
      })
    } else {
      // Recurse into subdirectories
      allValid = checkDirectory(content, currentPath) && allValid
    }
  }

  return allValid
}

function checkConfigFiles() {
  let allValid = true

  for (const [section, files] of Object.entries(configFiles)) {
    files.forEach(file => {
      const filePath = path.join(process.cwd(), section, file)
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`❌ Missing config file: ${filePath}`))
        allValid = false
      } else {
        console.log(chalk.green(`✓ Found config: ${filePath}`))
      }
    })
  }

  return allValid
}

function checkPermissions() {
  const uploadPaths = {
    backend: ['uploads', 'temp']
  }

  let allValid = true

  for (const [section, paths] of Object.entries(uploadPaths)) {
    paths.forEach(dir => {
      const dirPath = path.join(process.cwd(), section, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(chalk.yellow(`Created directory: ${dirPath}`))
      }

      try {
        fs.accessSync(dirPath, fs.constants.W_OK)
        console.log(chalk.green(`✓ Write permissions OK: ${dirPath}`))
      } catch (err) {
        console.log(chalk.red(`❌ Write permissions missing: ${dirPath}`))
        allValid = false
      }
    })
  }

  return allValid
}

console.log(chalk.blue('Checking project structure...'))
const projectRoot = path.join(dirname(__dirname))
const structureValid = checkDirectory(requiredStructure, projectRoot)
console.log('\nChecking config files...')
const configValid = checkConfigFiles()
console.log('\nChecking permissions...')
const permissionsValid = checkPermissions()

if (structureValid && configValid && permissionsValid) {
  console.log(chalk.green.bold('\n✨ All checks passed!'))
  process.exit(0)
} else {
  console.log(chalk.red.bold('\n❌ Some checks failed. Please fix the issues above.'))
  process.exit(1)
}
