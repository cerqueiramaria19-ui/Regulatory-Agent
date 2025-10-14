// FIX: Corrected import path to be relative
import { SavedAnalysis } from '../types';

const STORAGE_KEY = 'regulatoryAnalysisHistory';

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
    try {
        const currentHistory = getAnalysisHistory();
        const updatedHistory = [...currentHistory, newAnalysis];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error("Failed to save analysis result to localStorage", error);
        return getAnalysisHistory(); // Return existing history on failure
    }
};

/**
 * Updates an existing analysis in localStorage.
 * @param updatedAnalysis The analysis object with updated data.
 * @returns The updated array of SavedAnalysis objects.
 */
export const updateAnalysisResult = (updatedAnalysis: SavedAnalysis): SavedAnalysis[] => {
    try {
        const currentHistory = getAnalysisHistory();
        const updatedHistory = currentHistory.map(analysis =>
            analysis.id === updatedAnalysis.id ? updatedAnalysis : analysis
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error("Failed to update analysis result in localStorage", error);
        return getAnalysisHistory();
    }
};

/**
 * Deletes an analysis result from the history in localStorage by its ID.
 * @param analysisId The ID of the analysis to delete.
 * @returns The updated array of SavedAnalysis objects.
 */
export const deleteAnalysisResult = (analysisId: number): SavedAnalysis[] => {
    try {
        const currentHistory = getAnalysisHistory();
        const updatedHistory = currentHistory.filter(analysis => analysis.id !== analysisId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error("Failed to delete analysis result from localStorage", error);
        return getAnalysisHistory(); // Return existing history on failure
    }
};