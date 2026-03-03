import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import Home from './components/Home';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/audio/AudioPlayer';
import GoogleTtsTest from './components/audio/GoogleTtsTest';
import HowItWorks from './components/HowItWorks';
import { ProcessingProvider } from './context/ProcessingContext';

function App() {
  return (
    <ProcessingProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-secondary-50 dark:bg-secondary-900">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/status/:id" element={<ProcessingStatus />} />
              <Route path="/player/:id" element={<AudioPlayer />} />
              <Route path="/google-tts-test" element={<GoogleTtsTest />} />
              <Route path="/about" element={<HowItWorks />} />
            </Routes>
          </main>

          <Footer />
          
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </ProcessingProvider>
  );
}

export default App;
