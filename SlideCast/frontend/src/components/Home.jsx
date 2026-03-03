import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PresentationChartBarIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function Home() {
  const features = [
    {
      name: 'Smart Conversion',
      description: 'Advanced AI technology converts your presentations into natural-sounding audio narratives.',
      icon: PresentationChartBarIcon,
    },
    {
      name: 'Dual Narration',
      description: 'Engage your audience with dynamic conversations between a narrator and an expert.',
      icon: UserGroupIcon,
    },
    {
      name: 'Per-Slide Audio',
      description: 'Generate individual audio segments for each slide with perfect timing and flow.',
      icon: SpeakerWaveIcon,
    },
    {
      name: 'Real-time Processing',
      description: 'Watch as your presentation transforms into audio with our live processing status.',
      icon: ArrowPathIcon,
    },
    {
      name: 'Easy Upload',
      description: 'Simply drag and drop your PowerPoint files and let our system handle the rest.',
      icon: CloudArrowUpIcon,
    },
    {
      name: 'AI Enhancement',
      description: 'Our AI adds context, examples, and natural transitions to make your content more engaging.',
      icon: SparklesIcon,
    },
  ];

  const benefits = [
    'Accessibility for visually impaired users',
    'Learn while commuting or exercising',
    'Enhance presentations with professional narration',
    'Save time by listening instead of reading',
    'Improve information retention with audio learning'
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInFromRight {
          from { 
            opacity: 0;
            transform: translateX(30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          opacity: 0;
          animation: slideInFromRight 0.8s ease-out forwards;
        }
      `}</style>
      
      {/* Hero Section with animated gradient background */}
      <div className="relative gradient-mesh-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="mt-4 font-display animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="block text-secondary-900 dark:text-white">Transform Your Presentations</span>
              <span className="block gradient-text mt-2">Into Engaging Audio Narratives</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-secondary-600 dark:text-secondary-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Convert your PowerPoint presentations into dynamic audio content with our AI-powered platform. Perfect for learning, accessibility, and engaging content delivery.
            </p>
            <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12 gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <Link
                  to="/upload"
                className="btn-primary btn-lg group w-full sm:w-auto flex items-center justify-center"
                >
                  Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                className="mt-3 sm:mt-0 btn-outline w-full sm:w-auto"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

        {/* Decorative image */}
        <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-1/3">
          <div className="relative h-full">
            <svg
              className="absolute inset-0 h-full w-full text-primary-500/10 dark:text-primary-400/10 animate-slide-in-right"
              style={{ animationDelay: '0.7s' }}
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon points="0,0 100,0 50,100 0,100" />
            </svg>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white dark:bg-secondary-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">How It Works</h2>
            <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white sm:text-4xl">
              Three simple steps to audio conversion
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              {/* Connection line removed */}
              
              <div className="space-y-16">
                {/* Step 1 */}
                <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
                    <div className="md:order-2 mb-8 md:mb-0">
                      <div className="card card-hover p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="flex justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1586282391129-76a6df230234?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
                            alt="Upload your presentation" 
                            className="rounded-lg shadow-md w-full max-w-md object-cover h-64"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="md:order-1 relative">
                      <div className="md:pr-8">
                        <div className="flex md:hidden items-center mb-4">
                          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                            Upload Your Presentation
                          </h3>
                        </div>
                        <h3 className="hidden md:block text-xl font-bold text-secondary-900 dark:text-white">
                          Upload Your Presentation
                        </h3>
                        <p className="mt-4 text-secondary-600 dark:text-secondary-300">
                          Simply drag and drop your PowerPoint file onto our platform. We support both .ppt and .pptx formats, and your file is processed securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
                    <div className="mb-8 md:mb-0">
                      <div className="card card-hover p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="flex justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
                            alt="Choose conversion mode" 
                            className="rounded-lg shadow-md w-full max-w-md object-cover h-64"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="md:pl-8">
                        <div className="flex md:hidden items-center mb-4">
                          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                            Choose Conversion Mode
                          </h3>
                        </div>
                        <h3 className="hidden md:block text-xl font-bold text-secondary-900 dark:text-white">
                          Choose Conversion Mode
                        </h3>
                        <p className="mt-4 text-secondary-600 dark:text-secondary-300">
                          Select your preferred audio format: a comprehensive overview, detailed per-slide explanations, or an engaging conversation between experts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
                    <div className="md:order-2 mb-8 md:mb-0">
                      <div className="card card-hover p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="flex justify-center">
                          <img 
                            src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80" 
                            alt="Listen and share" 
                            className="rounded-lg shadow-md w-full max-w-md object-cover h-64"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="md:order-1 relative">
                      <div className="md:pr-8">
                        <div className="flex md:hidden items-center mb-4">
                          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                            Listen and Share
                          </h3>
                        </div>
                        <h3 className="hidden md:block text-xl font-bold text-secondary-900 dark:text-white">
                          Listen and Share
                        </h3>
                        <p className="mt-4 text-secondary-600 dark:text-secondary-300">
                          Enjoy your presentation as an engaging audio narrative. Download the audio files or share them directly with your audience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-secondary-50 dark:bg-secondary-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-base font-semibold tracking-wider text-primary-600 dark:text-primary-400 uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white tracking-tight sm:text-4xl">
            Everything you need to convert presentations
          </p>
            <p className="mt-5 max-w-prose mx-auto text-xl text-secondary-600 dark:text-secondary-300">
            Our platform offers a comprehensive suite of tools to transform your presentations into engaging audio content.
          </p>
          </div>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={feature.name} 
                  className="card card-hover p-6 animate-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                      <div>
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-lg font-medium text-secondary-900 dark:text-white">{feature.name}</h3>
                    <p className="mt-2 text-base text-secondary-600 dark:text-secondary-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white dark:bg-secondary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Benefits</h2>
              <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white">
                Why convert presentations to audio?
              </p>
              <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-300">
                Audio presentations offer numerous advantages over traditional formats, making your content more accessible and engaging.
              </p>
              <div className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-accent-500" />
                    </div>
                    <p className="ml-3 text-base text-secondary-600 dark:text-secondary-300">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link to="/upload" className="btn-primary">
                  Start Converting Now
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 dark:bg-primary-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-accent-300 dark:bg-accent-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="relative">
                  <img
                    className="relative rounded-lg shadow-xl"
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Team collaborating"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-primary-700 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-300">Convert your first presentation today.</span>
            </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/upload"
                className="btn-lg bg-white text-primary-700 hover:bg-primary-50"
                >
                Get Started
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 