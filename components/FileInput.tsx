
import React from 'react';
import { UploadIcon } from './Icons';

interface FileInputProps {
  fileName: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ fileName, onChange }) => {
  return (
    <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
            Upload Book or File
        </label>
        <label
            htmlFor="file-upload"
            className="w-full flex flex-col items-center justify-center px-4 py-6 bg-slate-700 text-slate-300 rounded-lg border-2 border-dashed border-slate-600 cursor-pointer hover:bg-slate-600 hover:border-sky-500 transition"
        >
            <UploadIcon />
            <span className="mt-2 text-base leading-normal font-semibold">
                {fileName ? 'File Selected' : 'Select a file'}
            </span>
            <span className="text-xs text-slate-400 truncate max-w-full">
                {fileName || '.txt, .md, .pdf'}
            </span>
            <input id="file-upload" type="file" className="hidden" onChange={onChange} accept=".txt,.md,.pdf" />
        </label>
    </div>
  );
};