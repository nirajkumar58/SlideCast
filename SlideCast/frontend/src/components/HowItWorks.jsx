import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  SpeakerWaveIcon, 
  CpuChipIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Upload Your Presentation',
      description: 'Start by uploading your PowerPoint file (PPT or PPTX format). Our system securely processes your file and prepares it for conversion.',
      icon: DocumentTextIcon,
      color: 'bg-primary-500',
    },
    {
      id: 2,
      title: 'AI Content Analysis',
      description: 'Our advanced AI analyzes your slides, extracting text, understanding context, and identifying key points to create a coherent narrative.',
      icon: CpuChipIcon,
      color: 'bg-accent-500',
    },
    {
      id: 3,
      title: 'Audio Generation',
      description: 'The system converts your content into natural-sounding audio, adding appropriate pacing, emphasis, and transitions between topics.',
      icon: SpeakerWaveIcon,
      color: 'bg-primary-500',
    },
    {
      id: 4,
      title: 'Listen & Share',
      description: 'Access your audio presentation through our interactive player. Download the files or share them directly with your audience.',
      icon: UserGroupIcon,
      color: 'bg-accent-500',
    },
  ];

  const faqs = [
    {
      question: 'What file formats are supported?',
      answer: 'We currently support PowerPoint files in both .ppt and .pptx formats. Support for additional formats like PDF and Google Slides is coming soon.',
    },
    {
      question: 'How long does the conversion process take?',
      answer: 'The conversion time depends on the size and complexity of your presentation. Most presentations are processed within 2-5 minutes.',
    },
    {
      question: 'Can I customize the voice used for narration?',
      answer: 'Yes, you can choose from multiple voice options including different accents, genders, and speaking styles to match your content.',
    },
    {
      question: 'Is my presentation data secure?',
      answer: 'Absolutely. We use industry-standard encryption and security practices. Your files are processed securely and deleted after 30 days unless you choose to save them.',
    },
    {
      question: 'What is the difference between the conversion modes?',
      answer: 'Overview mode creates a concise summary of your entire presentation. Per-slide mode generates detailed audio for each individual slide. Dual narration creates a conversation-style presentation between two voices.',
    },
  ];

  return (
    <div className="bg-white dark:bg-secondary-900">
      {/* Hero Section */}
      <div className="relative gradient-mesh-bg py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-secondary-900 dark:text-white sm:text-5xl md:text-6xl">
              How SlideCast Works
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-secondary-600 dark:text-secondary-300">
              SlideCast uses cutting-edge artificial intelligence to transform your presentations into natural-sounding audio narratives in just a few simple steps.
            </p>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">The Process</h2>
            <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white sm:text-4xl">
              Four simple steps to audio conversion
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-secondary-200 dark:bg-secondary-700 -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.id} className="relative">
                  <div className="card card-hover p-6 text-center h-full flex flex-col items-center">
                    <div className={`flex items-center justify-center w-16 h-16 ${step.color} text-white rounded-full mb-4 relative z-10`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-secondary-900 rounded-full flex items-center justify-center border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-bold z-20">
                      {step.id}
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-secondary-600 dark:text-secondary-300 flex-grow">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/upload" className="btn-primary inline-flex items-center">
              Try It Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-secondary-50 dark:bg-secondary-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">Our Technology</h2>
              <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white">
                Powered by advanced AI
              </p>
              <p className="mt-4 text-lg text-secondary-600 dark:text-secondary-300">
                SlideCast uses cutting-edge artificial intelligence to transform your presentations into natural-sounding audio narratives.
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-accent-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-white">Natural Language Processing</h3>
                    <p className="mt-1 text-secondary-600 dark:text-secondary-300">
                      Our AI understands the context and meaning of your content, not just the words.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-accent-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-white">Advanced Text-to-Speech</h3>
                    <p className="mt-1 text-secondary-600 dark:text-secondary-300">
                      High-quality voice synthesis with natural intonation, pacing, and emphasis.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-accent-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-white">Content Enhancement</h3>
                    <p className="mt-1 text-secondary-600 dark:text-secondary-300">
                      Automatically adds transitions, examples, and context to make your content more engaging.
                    </p>
                  </div>
                </div>
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
                    src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="AI technology visualization"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">FAQ</h2>
            <p className="mt-2 text-3xl font-extrabold text-secondary-900 dark:text-white sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {faqs.map((faq, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-white">{faq.question}</h3>
                    <p className="mt-2 text-secondary-600 dark:text-secondary-300">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mb-4">
              <LightBulbIcon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Have more questions?</h3>
            <p className="mt-2 text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto">
              If you couldn't find the answer to your question, feel free to reach out to our support team.
            </p>
            <div className="mt-6">
              <a href="mailto:support@slidecast.com" className="btn-outline">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700 dark:bg-primary-800">
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
                Start Converting
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks; 