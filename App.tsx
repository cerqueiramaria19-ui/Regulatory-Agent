
import React, { useState, useCallback, useEffect } from 'react';
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
  const [history, setHistory] = useState<SavedAnalysis[]>(() => getAnalysisHistory());
  const [currentAnalysis, setCurrentAnalysis] = useState<SavedAnalysis | null>(null);
  const [currentComparisonGroup, setCurrentComparisonGroup] = useState<SavedAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingFileName, setProcessingFileName] = useState<string>('');
  
  useEffect(() => {
    if (history.length > 0 && appView === AppView.UPLOAD) {
        setAppView(AppView.HISTORY);
    }
  }, [history.length]);

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
      setError('O arquivo selecionado está vazio.');
      setAppView(AppView.ERROR);
      return;
    }

    setAppView(AppView.PROCESSING);
    setError(null);
    setProcessingFileName(file.name);
    try {
      const hash = await calculateFileHash(file);
      
      // Read file as base64 to store it
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await analyzeDocument(file, instructions);
      const newAnalysis: SavedAnalysis = {
          ...result,
          id: Date.now(),
          fileName: file.name,
          analyzedAt: new Date().toLocaleString(),
          fileHash: hash,
          fileData: fileData,
      };
      const updatedHistory = saveAnalysisResult(newAnalysis);
      setHistory(updatedHistory);
      setCurrentAnalysis(newAnalysis);
      setAppView(AppView.DASHBOARD);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperatedo na comunicação com o servidor de IA.';
      setError(`Erro na Análise: ${errorMessage}`);
      console.error(err);
      setAppView(AppView.ERROR);
    }
  }, []);

  const handleNavigateHome = useCallback(() => {
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
      const updatedHistory = deleteAnalysisResult(id);
      setHistory(updatedHistory);
  }, []);

  const handleAnalysisUpdate = useCallback((updatedAnalysis: SavedAnalysis) => {
    const updatedHistory = updateAnalysisResult(updatedAnalysis);
    setHistory(updatedHistory);
    setCurrentAnalysis(updatedAnalysis);
  }, []);

  const handleViewComparison = useCallback((group: SavedAnalysis[]) => {
    setCurrentComparisonGroup(group);
    setAppView(AppView.COMPARISON);
  }, []);

  const renderContent = () => {
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
        return currentAnalysis ? <Dashboard analysis={currentAnalysis} onUpdate={handleAnalysisUpdate} /> : <p>Análise não encontrada.</p>;
      case AppView.COMPARISON:
        return currentComparisonGroup ? <ProvaRealView analyses={currentComparisonGroup} /> : <p>Grupo não encontrado.</p>;
      case AppView.ERROR:
        return (
          <div className="max-w-xl mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-red-500">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Falha no Processamento</h2>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded mb-6 text-left">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-mono whitespace-pre-wrap">{error}</p>
            </div>
            <p className="text-gray-500 mb-6 text-sm">Verifique sua conexão e se o arquivo não está protegido por senha ou corrompido.</p>
            <button
              onClick={handleNavigateToUpload}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Tentar Novamente
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
