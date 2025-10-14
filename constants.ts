

// FIX: Corrected import path to be relative
import { Area, Priority, Status } from './types';

export const AREA_COLORS: { [key in Area]: string } = {
  [Area.COMPLIANCE]: '#3b82f6', // blue-500
  [Area.JURIDICO]: '#8b5cf6',   // violet-500
  [Area.TI]: '#10b981',         // emerald-500
};

export const PRIORITY_COLORS: { [key in Priority]: string } = {
  [Priority.HIGH]: '#ef4444',   // red-500
  [Priority.MEDIUM]: '#f97316', // orange-500
  [Priority.LOW]: '#22c55e',    // green-500
};

export const STATUS_COLORS: { [key in Status]: { bg: string; text: string } } = {
    [Status.NOT_STARTED]: { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
    [Status.IN_PROGRESS]: { bg: 'bg-blue-200 dark:bg-blue-800', text: 'text-blue-800 dark:text-blue-200' },
    [Status.COMPLETED]: { bg: 'bg-green-200 dark:bg-green-800', text: 'text-green-800 dark:text-green-200' },
    [Status.NA]: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200' },
};
