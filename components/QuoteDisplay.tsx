
import React from 'react';
import { QuoteIcon } from './Icons';
import { Quote as QuoteData } from '../services/geminiService';

interface QuoteDisplayProps {
  quoteData: QuoteData | null;
  context?: string;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ quoteData, context }) => {
  if (!quoteData || !quoteData.quote) return null;

  const { quote, location } = quoteData;

  const hasLocation = location && (location.chapter || location.page || location.paragraph);

  return (
    <div className="mt-6 animate-fade-in space-y-6">
      {context && (
        <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-1">From the section about:</h3>
            <p className="text-slate-300 italic">"{context}"</p>
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Found Quote:</h3>
        <div className="bg-slate-700/50 p-6 rounded-lg border-l-4 border-sky-500 relative">
            <div className="absolute top-4 left-4 text-sky-600 opacity-20">
                <QuoteIcon />
            </div>
            <blockquote className="text-slate-100 text-lg italic leading-relaxed pl-8">
                {quote}
            </blockquote>
        </div>
      </div>

      {hasLocation && (
        <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Location:</h3>
            <div className="bg-slate-700/50 p-4 rounded-lg text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800 p-2 rounded-md">
                    <span className="text-xs text-slate-400 block">Chapter</span>
                    <span className="font-bold text-sky-400">{location.chapter || 'N/A'}</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-md">
                    <span className="text-xs text-slate-400 block">Page</span>
                    <span className="font-bold text-sky-400">{location.page || 'N/A'}</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-md">
                    <span className="text-xs text-slate-400 block">Paragraph</span>
                    <span className="font-bold text-sky-400">{location.paragraph || 'N/A'}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};