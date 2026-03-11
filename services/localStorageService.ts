// FIX: Corrected import path to be relative
import { SavedAnalysis } from '../types';

const STORAGE_KEY = 'regulatoryAnalysisHistory';
const MAX_HISTORY_ITEMS = 10;
const MAX_ITEMS_WITH_FILE_DATA = 3;

/**
 * Cleans up history to fit within localStorage limits.
 * 1. Limits total items to MAX_HISTORY_ITEMS.
 * 2. Keeps fileData only for the most recent MAX_ITEMS_WITH_FILE_DATA items.
 */
const prepareHistoryForStorage = (history: SavedAnalysis[]): SavedAnalysis[] => {
    // Sort by ID (timestamp) descending to get most recent first
    const sorted = [...history].sort((a, b) => b.id - a.id);
    
    // Limit total items
    const limited = sorted.slice(0, MAX_HISTORY_ITEMS);
    
    // Remove fileData from older items to save space
    return limited.map((item, index) => {
        if (index >= MAX_ITEMS_WITH_FILE_DATA && item.fileData) {
            const { fileData, ...rest } = item;
            return rest as SavedAnalysis;
        }
        return item;
    });
};

/**
 * Attempts to save history to localStorage with fallback mechanisms.
 */
const persistHistory = (history: SavedAnalysis[]): boolean => {
    let dataToSave = prepareHistoryForStorage(history);
    
    while (dataToSave.length > 0) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn("LocalStorage quota exceeded, attempting to prune oldest item...");
                // Remove the oldest item (last in our sorted list)
                dataToSave.pop();
            } else {
                throw error;
            }
        }
    }
    return false;
};

/**
 * Retrieves the analysis history from localStorage.
 * @returns An array of SavedAnalysis objects.
 */
export const getAnalysisHistory = (): SavedAnalysis[] => {
    try {
        const storedHistory = localStorage.getItem(STORAGE_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
        console.error("Failed to parse analysis history from localStorage", error);
        return [];
    }
};

/**
 * Saves a new analysis result to the history in localStorage.
 * @param newAnalysis The new analysis result to save.
 * @returns The updated array of SavedAnalysis objects.
 */
export const saveAnalysisResult = (newAnalysis: SavedAnalysis): SavedAnalysis[] => {
    const currentHistory = getAnalysisHistory();
    const updatedHistory = [newAnalysis, ...currentHistory]; // Add to start
    
    const success = persistHistory(updatedHistory);
    if (!success) {
        console.error("Failed to save analysis result even after pruning.");
    }
    
    return getAnalysisHistory(); // Return what's actually in storage
};

/**
 * Updates an existing analysis in localStorage.
 * @param updatedAnalysis The analysis object with updated data.
 * @returns The updated array of SavedAnalysis objects.
 */
export const updateAnalysisResult = (updatedAnalysis: SavedAnalysis): SavedAnalysis[] => {
    const currentHistory = getAnalysisHistory();
    const updatedHistory = currentHistory.map(analysis =>
        analysis.id === updatedAnalysis.id ? updatedAnalysis : analysis
    );
    
    persistHistory(updatedHistory);
    return getAnalysisHistory();
};

/**
 * Deletes an analysis result from the history in localStorage by its ID.
 * @param analysisId The ID of the analysis to delete.
 * @returns The updated array of SavedAnalysis objects.
 */
export const deleteAnalysisResult = (analysisId: number): SavedAnalysis[] => {
    const currentHistory = getAnalysisHistory();
    const updatedHistory = currentHistory.filter(analysis => analysis.id !== analysisId);
    
    persistHistory(updatedHistory);
    return updatedHistory;
};
