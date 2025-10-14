
import React, { useState, useCallback, useEffect } from 'react';
// FIX: Corrected import paths to be relative
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProcessingView } from './components/ProcessingView';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { ProvaRealView } from './components/ProvaRealView';
import { Login } from './components/Login';
import { type SavedAnalysis, AppView } from './types';
import { analyzeDocument } from './services/geminiService';
import { getAnalysisHistory, saveAnalysisResult, deleteAnalysisResult, updateAnalysisResult } from './services/localStorageService';
import { calculateFileHash } from './services/fileHashingService';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appView, setAppView] = useState<AppView>(AppView.UPLOAD);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<SavedAnalysis | null>(null);
  const [currentComparisonGroup, setCurrentComparisonGroup] = useState<SavedAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingFileName, setProcessingFileName] = useState<string>('');
  
  // On initial load, get the analysis history from localStorage.
  useEffect(() => {
    const loadedHistory = getAnalysisHistory();
    setHistory(loadedHistory);
    // If history exists, show the history view. Otherwise, stay on the upload page.
    if (loadedHistory.length > 0) {
        setAppView(AppView.HISTORY);
    }
  }, []);

  const handleLogin = (user: string, pass: string): boolean => {
    if (user === 'bipfs' && pass === 'maria123') {
        setIsAuthenticated(true);
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleFileUpload = useCallback(async (file: File, instructions: string) => {
    if (file.size === 0) {
      setError('O arquivo selecionado está vazio e não pode ser analisado.');
      setAppView(AppView.ERROR);
      return;
    }

    setAppView(AppView.PROCESSING);
    setError(null);
    setProcessingFileName(file.name);
    try {
      const hash = await calculateFileHash(file);
      const result = await analyzeDocument(file, instructions);
      const newAnalysis: SavedAnalysis = {
          ...result,
          id: Date.now(),
          fileName: file.name,
          analyzedAt: new Date().toLocaleString(),
          fileHash: hash,
      };
      // Save the new analysis to localStorage and update the state.
      const updatedHistory = saveAnalysisResult(newAnalysis);
      setHistory(updatedHistory);
      setCurrentAnalysis(newAnalysis);
      setAppView(AppView.DASHBOARD);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha ao analisar o documento. ${errorMessage}. Por favor, tente novamente.`);
      console.error(err);
      setAppView(AppView.ERROR);
    }
  }, []);

  const handleNavigateHome = useCallback(() => {
    // When navigating home, always go to the history view if it's not empty.
    setAppView(history.length > 0 ? AppView.HISTORY : AppView.UPLOAD);
    setCurrentAnalysis(null);
    setCurrentComparisonGroup(null);
    setError(null);
  }, [history.length]);
  
  const handleNavigateToUpload = useCallback(() => {
    setAppView(AppView.UPLOAD);
  }, []);

  const handleViewAnalysis = useCallback((id: number) => {
    const analysisToView = history.find(h => h.id === id);
    if(analysisToView) {
        setCurrentAnalysis(analysisToView);
        setAppView(AppView.DASHBOARD);
    }
  }, [history]);
  
  const handleDeleteAnalysis = useCallback((id: number) => {
      // Delete from localStorage and update the state.
      const updatedHistory = deleteAnalysisResult(id);
      setHistory(updatedHistory);
  }, []);

  const handleAnalysisUpdate = useCallback((updatedAnalysis: SavedAnalysis) => {
    // Update in localStorage and update the state.
    const updatedHistory = updateAnalysisResult(updatedAnalysis);
    setHistory(updatedHistory);
    setCurrentAnalysis(updatedAnalysis);
  }, []);

  const handleViewComparison = useCallback((group: SavedAnalysis[]) => {
    setCurrentComparisonGroup(group);
    setAppView(AppView.COMPARISON);
  }, []);


  const renderContent = () => {
    // Render nothing until the view is determined by useEffect, to avoid flashing content.
    if (!appView && isAuthenticated) {
        return null;
    }
    switch (appView) {
      case AppView.HISTORY:
        return <HistoryView 
            history={history} 
            onView={handleViewAnalysis} 
            onDelete={handleDeleteAnalysis}
            onNavigateToUpload={handleNavigateToUpload}
            onViewComparison={handleViewComparison}
        />;
      case AppView.UPLOAD:
        return <FileUpload 
            onFileUpload={handleFileUpload} 
            onNavigateToHistory={handleNavigateHome} 
            hasHistory={history.length > 0} 
        />;
      case AppView.PROCESSING:
        return <ProcessingView fileName={processingFileName} />;
      case AppView.DASHBOARD:
        return currentAnalysis ? <Dashboard analysis={currentAnalysis} onUpdate={handleAnalysisUpdate} /> : <p>Nenhum resultado de análise encontrado.</p>;
      case AppView.COMPARISON:
        return currentComparisonGroup ? <ProvaRealView analyses={currentComparisonGroup} /> : <p>Nenhum grupo de comparação encontrado.</p>;
      case AppView.ERROR:
        return (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Ocorreu um Erro</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={handleNavigateHome}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Voltar ao Histórico
            </button>
          </div>
        );
      default:
        return <HistoryView 
            history={history} 
            onView={handleViewAnalysis} 
            onDelete={handleDeleteAnalysis}
            onNavigateToUpload={handleNavigateToUpload}
            onViewComparison={handleViewComparison}
        />;
    }
  };
  
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header 
        onNavigateHome={handleNavigateHome} 
        currentView={appView}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
