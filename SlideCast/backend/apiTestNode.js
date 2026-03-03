import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Configure axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test file upload and conversion
const testFileUpload = async () => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test.ppt'));

    const response = await api.post('/convert', formData, {
      headers: formData.getHeaders()
    });
    console.log('File upload and conversion response:', response.data);
  } catch (error) {
    console.error('File upload and conversion error:', error);
  }
};

// Test file info retrieval
const testFileInfo = async (shareableLink) => {
  try {
    const response = await api.get(`/${shareableLink}/info`);
    console.log('File info response:', response.data);
  } catch (error) {
    console.error('File info retrieval error:', error);
  }
};

// Test file view
const testFileView = async (shareableLink) => {
  try {
    const response = await api.get(`/${shareableLink}/view`, { responseType: 'blob' });
    console.log('File view response:', response);
  } catch (error) {
    console.error('File view error:', error);
  }
};

// Test file download
const testFileDownload = async (shareableLink) => {
  try {
    const response = await api.get(`/${shareableLink}/download`, { responseType: 'blob' });
    console.log('File download response:', response);
  } catch (error) {
    console.error('File download error:', error);
  }
};

// Run tests
const runTests = async () => {
  await testFileUpload();
  const shareableLink = 'test-shareable-link'; // Replace with actual shareable link after upload
  await testFileInfo(shareableLink);
  await testFileView(shareableLink);
  await testFileDownload(shareableLink);
};

runTests();
