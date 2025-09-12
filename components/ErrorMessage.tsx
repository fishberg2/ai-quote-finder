
import React from 'react';
import { AlertIcon } from './Icons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md relative flex items-start gap-3 animate-fade-in" role="alert">
      <div className="flex-shrink-0 pt-1">
        <AlertIcon />
      </div>
      <div>
        <strong className="font-bold block">Error</strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
};
