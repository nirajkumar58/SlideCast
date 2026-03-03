import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import storage from '../utils/gridStorageNew.js'; // Updated import
import File from '../models/File.js';
import { convertToPDF } from '../utils/converter.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import dotenv from 'dotenv';
import pkg from 'mongodb'; // Default import
const { GridFSBucket } = pkg; // Destructure GridFSBucket

dotenv.config();

const router = express.Router();

// GridFS setup
let gfs;

mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('GridFS connection established');
});

// Upload and convert PPT to PDF
router.post('/convert', multer({ storage }).single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create file record
    const newFile = new File({
      originalName: req.file.originalname,
      pptFileId: req.file.id,
      fileSize: req.file.size,
      status: 'processing'
    });

    // Get the uploaded file from GridFS
    const downloadStream = gfs.openDownloadStream(req.file.id);
    const chunks = [];

    downloadStream.on('data', chunk => chunks.push(chunk));
    downloadStream.on('error', error => {
      throw error;
    });

    downloadStream.on('end', async () => {
      try {
        // Convert to PDF
        const pdfBuffer = await convertToPDF(Buffer.concat(chunks));
        
        // Upload PDF to GridFS
        const uploadStream = gfs.openUploadStream(`${Date.now()}-${req.file.originalname}.pdf`);
        uploadStream.end(pdfBuffer);
        
        const uploadPromise = new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });

        // Update file record with PDF file ID
        await uploadPromise;
        newFile.pdfFileId = uploadStream.id;
        newFile.status = 'converting';
        await newFile.save();

        // Send initial response after PDF conversion
        const response = {
          message: 'File uploaded and conversion started',
          fileId: newFile._id,
          shareableLink: newFile.shareableLink,
          status: newFile.status,
          progress: {
            pdfConverted: true,
            textExtracted: false,
            totalSlides: 0,
            currentStep: 'Extracting text from slides...'
          }
        };
        res.status(201).json(response);

        // Log status for debugging
        console.log('File conversion started:', {
          fileId: newFile._id,
          shareableLink: newFile.shareableLink,
          status: response.status,
          progress: response.progress
        });

        // Extract text with better error handling
        try {
          console.log('Starting text extraction for file:', newFile._id);
          const slides = await extractTextFromPDF(pdfBuffer);
          
          if (!slides || !slides.length) {
            throw new Error('No text content extracted from slides');
          }

          console.log(`Extracted ${slides.length} slides from PDF`);
          
          newFile.slides = slides.map((text, index) => ({
            number: index,
            textContent: text
          }));
          newFile.status = 'completed';
          await newFile.save();
          
          console.log('File processing completed:', {
            fileId: newFile._id,
            slideCount: slides.length,
            status: 'completed'
          });
        } catch (error) {
          console.error('Text extraction error:', error);
          newFile.status = 'failed';
          await newFile.save();
          throw error;
        }
      } catch (error) {
        newFile.status = 'failed';
        await newFile.save();
        throw error;
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert file' });
  }
});

// Get file info
router.get('/:shareableLink/info', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.status === 'failed') {
      return res.status(400).json({ error: 'File conversion failed' });
    }

    // Check if slides are extracted
    const hasSlidesExtracted = file.slides && file.slides.length > 0;
    const detailedStatus = hasSlidesExtracted ? 'completed' : file.status;

    res.json({
      originalName: file.originalName,
      status: detailedStatus,
      createdAt: file.createdAt,
      fileSize: file.fileSize,
      expiresAt: new Date(file.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)),
      progress: {
        pdfConverted: file.pdfFileId ? true : false,
        textExtracted: hasSlidesExtracted,
        totalSlides: hasSlidesExtracted ? file.slides.length : 0
      }
    });
  } catch (error) {
    console.error('File info retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve file information' });
  }
});

// Get slides
router.get('/:shareableLink/slides', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Return appropriate response based on file status
    switch (file.status) {
      case 'completed':
        return res.json({
          status: 'completed',
          slides: file.slides.map(slide => ({
            number: slide.number,
            textContent: slide.textContent,
            audioFileId: slide.audioFileId,
            enhancements: slide.enhancements
          }))
        });
      case 'converting':
        return res.json({
          status: 'converting',
          message: 'File is being processed',
          progress: 'Extracting text from slides...'
        });
      case 'failed':
        return res.status(500).json({
          status: 'failed',
          error: 'File processing failed'
        });
      default:
        return res.json({
          status: file.status,
          message: 'File is being processed'
        });
    }
  } catch (error) {
    console.error('Slides retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve slides' });
  }
});

// View file
router.get('/:shareableLink/view', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.status !== 'completed') {
      return res.status(400).json({ error: 'File conversion is not yet complete' });
    }

    const downloadStream = gfs.openDownloadStream(file.pdfFileId);
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.originalName}.pdf"`);
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// Download file
router.get('/:shareableLink/download', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const downloadStream = gfs.openDownloadStream(file.pdfFileId);
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${file.originalName}.pdf"`);
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
