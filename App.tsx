
import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { findSections, findQuoteInSection, Section, Quote } from './services/geminiService';
import { FileInput } from './components/FileInput';
import { QuoteDisplay } from './components/QuoteDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { BookIcon, SearchIcon, ResetIcon } from './components/Icons';
import { SectionSelector } from './components/SectionSelector';


// Set worker source for pdfjs. It's important to set this before using the library.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

type AppStep = 'upload' | 'sections' | 'result';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [bookVersion, setBookVersion] = useState<string>('');
  const [quoteDescription, setQuoteDescription] = useState<string>('');
  
  const [step, setStep] = useState<AppStep>('upload');
  const [suggestedSections, setSuggestedSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [foundQuote, setFoundQuote] = useState<Quote | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        handleReset();
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setIsLoading(true);
        setError(null);
        try {
            let text: string;
            if (selectedFile.type === 'application/pdf') {
                text = await extractTextFromPdf(selectedFile);
            } else {
                text = await extractTextFromTxt(selectedFile);
            }
            if (!text.trim()) {
                throw new Error('The file seems to be empty or text could not be extracted.');
            }
            setFileContent(text);
        } catch(err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while processing the file.';
            setError(errorMessage);
            setFile(null);
            setFileName('');
        } finally {
            setIsLoading(false);
        }
    }
  };

  const extractTextFromPdf = async (fileToProcess: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error("Failed to read PDF file."));
        }
        try {
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // The item is of type TextItem, which has a 'str' property.
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += `[Page ${i}]\n${pageText}\n\n`; // Add page markers
          }
          resolve(fullText);
        } catch (error) {
          console.error("Error parsing PDF:", error);
          reject(new Error("Could not parse the PDF file. It might be corrupted or protected."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read the file."));
      reader.readAsArrayBuffer(fileToProcess);
    });
  };

  const extractTextFromTxt = (fileToProcess: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        if (typeof fileContent === 'string') {
          resolve(fileContent);
        } else {
          reject(new Error('Could not read the text file content.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the uploaded text file.'));
      };
      reader.readAsText(fileToProcess);
    });
  };

  const handleFindSections = useCallback(async () => {
    if (!file || !fileContent) {
      setError('Please upload and process a book or file first.');
      return;
    }
    if (!quoteDescription.trim()) {
      setError('Please describe the quote you are looking for.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFoundQuote(null);
    setSuggestedSections([]);

    try {
      const sections = await findSections(fileContent, bookVersion, quoteDescription);
      if (sections.length === 0) {
        setError('Could not identify any relevant sections. Please try a different description.');
      } else {
        setSuggestedSections(sections);
        setStep('sections');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while finding sections.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [file, fileContent, bookVersion, quoteDescription]);

  const handleSelectSection = useCallback(async (section: Section) => {
    setIsLoading(true);
    setError(null);
    setFoundQuote(null);
    setSelectedSection(section);

    try {
        const result = await findQuoteInSection(fileContent, section, quoteDescription);
        if (!result || !result.quote) {
            setError('Could not find a matching quote in this section. Please try another section or start over.');
        } else {
            setFoundQuote(result);
        }
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching the quote.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setStep('result');
    }
  }, [fileContent, quoteDescription]);
  
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileContent('');
    setBookVersion('');
    setQuoteDescription('');
    setStep('upload');
    setSuggestedSections([]);
    setSelectedSection(null);
    setIsLoading(false);
    setError(null);
    setFoundQuote(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-sky-400 flex items-center justify-center gap-3">
            <BookIcon />
            Quote Finder AI
          </h1>
          <p className="text-slate-400 mt-2">
            Upload a document, describe a scene, and let AI pinpoint the quote.
          </p>
        </header>

        <main className="bg-slate-800 rounded-lg shadow-2xl p-6 md:p-8 space-y-6 border border-slate-700">
          {step === 'upload' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileInput fileName={fileName} onChange={handleFileChange} />
                    <div>
                        <label htmlFor="bookVersion" className="block text-sm font-medium text-slate-300 mb-2">
                            Book/File Version (Optional)
                        </label>
                        <input
                            id="bookVersion"
                            type="text"
                            value={bookVersion}
                            onChange={(e) => setBookVersion(e.target.value)}
                            placeholder="e.g., 2nd Edition, v1.3"
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        />
                    </div>
                </div>
              
                <div>
                    <label htmlFor="quoteDescription" className="block text-sm font-medium text-slate-300 mb-2">
                    Describe the Scene or Quote
                    </label>
                    <textarea
                    id="quoteDescription"
                    rows={4}
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    placeholder="e.g., 'The part where the protagonist talks about the stars...'"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                </div>

                <div>
                    <button
                    onClick={handleFindSections}
                    disabled={isLoading || !fileContent}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                    >
                    {isLoading ? (
                        <>
                        <LoadingSpinner />
                        {fileName ? 'Processing File...' : 'Waiting for file...'}
                        </>
                    ) : (
                        <>
                        <SearchIcon />
                        Find Sections
                        </>
                    )}
                    </button>
                </div>
            </>
          )}

          {step === 'sections' && (
            <SectionSelector
                sections={suggestedSections}
                onSelect={handleSelectSection}
                isLoading={isLoading}
             />
          )}

        {(step === 'sections' || step === 'result') && (
            <div className="pt-4 border-t border-slate-700/50">
                <button
                onClick={handleReset}
                className="w-full bg-slate-600 hover:bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                <ResetIcon />
                Start Over
                </button>
            </div>
        )}

        {error && <ErrorMessage message={error} />}

        {step === 'result' && foundQuote?.quote && (
          <QuoteDisplay quoteData={foundQuote} context={selectedSection?.summary} />
        )}
        
        </main>
        
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;