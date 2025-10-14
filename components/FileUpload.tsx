import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, FileTextIcon, ZapIcon } from './Icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onNavigateToHistory: () => void;
  hasHistory: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onNavigateToHistory, hasHistory }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);
  
  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
      // Reset input value to allow re-selecting the same file later
      e.target.value = '';
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
        onFileUpload(selectedFile);
    }
  };

  const handleRemoveFile = () => {
      setSelectedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {hasHistory && (
          <div className="flex justify-end mb-4">
              <button
                  onClick={onNavigateToHistory}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                  Ver Histórico de Análises &rarr;
              </button>
          </div>
      )}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Analise Seus Documentos Regulatórios
        </h2>
        
        {!selectedFile ? (
            <>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Faça o upload de arquivos PDF, DOCX ou TXT para extrair, analisar e transformar requisitos complexos em ações claras.
                </p>
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative block w-full border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.docx,.txt"
                        onChange={handleChange}
                    />
                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-4 block text-sm font-medium text-gray-900 dark:text-gray-100">
                        Arraste e solte o arquivo aqui
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">ou</span>
                    <label
                        htmlFor="file-upload"
                        className="mt-2 inline-block cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                        Selecione um Arquivo
                    </label>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">PDF, DOCX, TXT até 500MB</p>
                </div>
            </>
        ) : (
            <div className="mt-8">
                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <FileTextIcon className="h-8 w-8 text-indigo-500 mr-4 flex-shrink-0" />
                    <div className="text-left flex-grow">
                        <p className="font-semibold text-gray-900 dark:text-white truncate" title={selectedFile.name}>{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={handleRemoveFile} className="ml-4 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-500 font-semibold flex-shrink-0">Trocar arquivo</button>
                </div>

                <button
                    onClick={handleAnalyzeClick}
                    className="mt-8 w-full flex items-center justify-center px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                >
                    <ZapIcon className="h-6 w-6 mr-3" />
                    Analisar Documento
                </button>
            </div>
        )}
      </div>
    </div>
  );
};