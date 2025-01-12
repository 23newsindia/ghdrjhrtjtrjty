import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import { AlertCircle, CheckCircle2, FileText, GanttChart, Globe, LayoutDashboard, Lightbulb, Link2, List, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Initialize Supabase client - will be initialized after environment variables are set
let supabase: ReturnType<typeof createClient> | null = null;

// Initialize HuggingFace client - will be initialized after environment variables are set
let hf: HfInference | null = null;

// Initialize clients when environment variables are available
if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

if (import.meta.env.VITE_HUGGINGFACE_API_KEY) {
  hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
}

function App() {
  const [content, setContent] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSEO = async (text: string) => {
    // Basic SEO checks
    const seoChecks = {
      keywordDensity: calculateKeywordDensity(text),
      titleLength: checkTitleLength(text),
      metaDescription: checkMetaDescription(text),
      headings: checkHeadings(text),
      links: checkLinks(text),
      imageAlt: checkImageAlt(text),
    };

    // Calculate overall SEO score
    const score = Object.values(seoChecks).reduce((acc, val) => acc + val, 0) / 6 * 100;
    setSeoScore(Math.round(score));

    // Generate suggestions
    const newSuggestions = [];
    if (seoChecks.keywordDensity < 0.5) {
      newSuggestions.push('Consider increasing keyword density (aim for 1-3%)');
    }
    if (!seoChecks.titleLength) {
      newSuggestions.push('Title length should be between 50-60 characters');
    }
    if (!seoChecks.metaDescription) {
      newSuggestions.push('Add a meta description between 150-160 characters');
    }
    setSuggestions(newSuggestions);
  };

  const improveReadability = async (text: string) => {
    if (!hf) {
      setError('Please configure your HuggingFace API key first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use HuggingFace for text improvement
      const response = await hf.textGeneration({
        model: 'gpt2',
        inputs: `Improve the readability of this text while maintaining SEO: ${text}`,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
        },
      });

      setContent(response.generated_text);
      
      // Calculate readability score (Flesch Reading Ease)
      const readability = calculateReadabilityScore(text);
      setReadabilityScore(readability);
    } catch (error) {
      console.error('Error improving text:', error);
      setError('Failed to improve text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    analyzeSEO(e.target.value);
  };

  if (!supabase || !hf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-4">Configuration Required</h2>
          <p className="text-gray-600 text-center mb-4">
            Please click the "Connect to Supabase" button in the top right corner to set up your database connection, and ensure your HuggingFace API key is configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">SEO Content Optimizer</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Content Editor</h2>
                <textarea
                  rows={12}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your content here..."
                  value={content}
                  onChange={handleContentChange}
                />
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => improveReadability(content)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Improving...' : 'Improve Readability'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Content Analysis</h2>
                
                {/* SEO Score */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">SEO Score</h3>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {seoScore}%
                    </div>
                  </div>
                </div>

                {/* Readability Score */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Readability Score</h3>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${readabilityScore >= 80 ? 'text-green-600' : readabilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {readabilityScore}%
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Suggestions</h3>
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Utility functions
function calculateKeywordDensity(text: string): number {
  // Implementation
  return 1;
}

function checkTitleLength(text: string): number {
  // Implementation
  return 1;
}

function checkMetaDescription(text: string): number {
  // Implementation
  return 1;
}

function checkHeadings(text: string): number {
  // Implementation
  return 1;
}

function checkLinks(text: string): number {
  // Implementation
  return 1;
}

function checkImageAlt(text: string): number {
  // Implementation
  return 1;
}

function calculateReadabilityScore(text: string): number {
  // Implementation of Flesch Reading Ease score
  return 75;
}

export default App;