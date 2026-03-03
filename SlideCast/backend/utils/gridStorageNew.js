import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import multerGridFSStorage from 'multer-gridfs-storage';

// Convert ESM URLs to paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Create storage engine for multer
const storage = new multerGridFSStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      try {
        const filename = `${Date.now()}-${file.originalname}`;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        console.log('Creating file in GridFS:', fileInfo);
        resolve(fileInfo);
      } catch (error) {
        console.error('Error creating file info:', error);
        reject(error);
      }
    });
  },
  options: {
    useUnifiedTopology: true
  }
});

// Add error handlers and logging
storage.on('connection', () => {
  console.log('GridFS storage connected successfully');
});

storage.on('connectionFailed', (err) => {
  console.error('GridFS storage connection failed:', err);
});

storage.on('file', (file) => {
  console.log('File saved to GridFS:', {
    filename: file.filename,
    id: file.id,
    size: file.size
  });
});

// Export configured storage
export default storage;
