import express from 'express';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import multer from 'multer';
import gridStorage from '../utils/gridStorage.js';
import File from '../models/File.js';
import { convertToPDF } from '../utils/converter.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const router = express.Router();
const { GridFSBucket } = mongodb;

// GridFS setup
let gfs;

mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('GridFS connection established');
});

// Initialize upload middleware
const upload = multer({
  storage: gridStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.ppt' && ext !== '.pptx') {
      cb(new Error('Only PowerPoint files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload and convert PPT to PDF
router.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', {
      originalName: req.file.originalname,
      size: req.file.size,
      id: req.file.id
    });

    const newFile = new File({
      originalName: req.file.originalname,
      pptFileId: req.file.id,
      fileSize: req.file.size,
      status: 'processing'
    });

    const downloadStream = gfs.openDownloadStream(req.file.id);
    const chunks = [];

    downloadStream.on('data', chunk => chunks.push(chunk));
    downloadStream.on('error', error => {
      console.error('Download error:', error);
      throw error;
    });

    downloadStream.on('end', async () => {
      try {
        console.log('Starting PDF conversion');
        const pdfBuffer = await convertToPDF(Buffer.concat(chunks));
        const uploadStream = gfs.openUploadStream(`${Date.now()}-${req.file.originalname}.pdf`);
        uploadStream.end(pdfBuffer);
        
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });

        newFile.pdfFileId = uploadStream.id;
        newFile.status = 'converting';
        await newFile.save();

        console.log('PDF conversion completed:', {
          fileId: newFile._id,
          pdfId: uploadStream.id
        });

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

        // Extract text in background
        try {
          console.log('Starting text extraction');
          const slides = await extractTextFromPDF(pdfBuffer);
          
          if (!slides?.length) {
            throw new Error('No slides extracted');
          }

          newFile.slides = slides.map((text, index) => ({
            number: index,
            textContent: text
          }));
          newFile.status = 'completed';
          await newFile.save();
          
          console.log('Processing completed:', {
            fileId: newFile._id,
            slides: slides.length
          });
        } catch (error) {
          console.error('Text extraction failed:', error);
          newFile.status = 'failed';
          await newFile.save();
        }
      } catch (error) {
        console.error('PDF conversion failed:', error);
        newFile.status = 'failed';
        await newFile.save();
      }
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Get file info
router.get('/:shareableLink/info', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const hasSlidesExtracted = file.slides && file.slides.length > 0;
    const detailedStatus = hasSlidesExtracted ? 'completed' : file.status;

    res.json({
      _id: file._id,
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
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file information' });
  }
});

// Get slides
router.get('/:shareableLink/slides', async (req, res) => {
  try {
    const file = await File.findOne({ shareableLink: req.params.shareableLink });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

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
      case 'failed':
        return res.status(500).json({
          status: 'failed',
          error: 'File processing failed'
        });
      default:
        return res.json({
          status: file.status,
          message: 'File is being processed',
          progress: {
            pdfConverted: file.pdfFileId ? true : false,
            textExtracted: false
          }
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

    if (!file.pdfFileId) {
      return res.status(400).json({ error: 'PDF not yet generated' });
    }

    const downloadStream = gfs.openDownloadStream(file.pdfFileId);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.originalName}.pdf"`);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('File viewing error:', error);
    res.status(500).json({ error: 'Failed to view file' });
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
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
