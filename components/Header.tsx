import React from 'react';
// FIX: Corrected import paths to be relative
import { LogOutIcon } from './Icons';
import { AppView } from '../types';

interface HeaderProps {
    onNavigateHome: () => void;
    currentView: AppView;
    isAuthenticated: boolean;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, currentView, isAuthenticated, onLogout }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
          <img src="https://bipbrasil.com.br/wp-content/uploads/2022/12/logo-bip-consulting-red.png" alt="BIP Consulting Logo" className="h-8 w-auto" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            Análise Regulatória Inteligente
          </h1>
        </div>
        <div className="flex items-center gap-4">
            {currentView !== AppView.HISTORY && (
                <button
                    onClick={onNavigateHome}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                >
                    Voltar ao Histórico
                </button>
            )}
             {isAuthenticated && (
                <button
                    onClick={onLogout}
                    className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    title="Sair"
                >
                    <LogOutIcon className="h-5 w-5" />
                </button>
             )}
        </div>
      </div>
    </header>
  );
};