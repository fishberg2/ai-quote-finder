import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Section } from '../services/geminiService';

interface SectionSelectorProps {
  sections: Section[];
  onSelect: (section: Section) => void;
  isLoading: boolean;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({ sections, onSelect, isLoading }) => {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-200">
            Which of these scenes are you thinking of?
        </h3>
        <p className="text-slate-400 text-sm">Select a section below to pull the quote from it.</p>
      </div>
      <div className="space-y-3">
        {sections.map((section, index) => (
          <button
            key={index}
            onClick={() => onSelect(section)}
            disabled={isLoading}
            className="w-full text-left p-4 bg-slate-700 hover:bg-sky-900/50 border border-slate-600 hover:border-sky-500 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
          >
            <p className="text-slate-200">{section.summary}</p>
            {(section.location.chapter || section.location.page) && (
                 <p className="text-xs text-sky-400/80 mt-2">
                    Est. Location: 
                    {section.location.chapter && ` Chapter ${section.location.chapter}`}
                    {section.location.chapter && section.location.page && ', '}
                    {section.location.page && ` Page ${section.location.page}`}
                 </p>
            )}
          </button>
        ))}
      </div>
      {isLoading && (
        <div className="flex items-center justify-center text-slate-300 pt-2">
            <LoadingSpinner />
            <span>Finding the exact quote...</span>
        </div>
      )}
    </div>
  );
};
