
import React, { useState, useMemo } from 'react';
import { Requirement, Priority, Area, Status } from '../types';
import { RequirementModal } from './RequirementModal';
import { PRIORITY_COLORS, AREA_COLORS, STATUS_COLORS } from '../constants';

interface RequirementsTableProps {
  requirements: Requirement[];
  onUpdateRequirement: (updatedRequirement: Requirement) => void;
}

type SortKey = keyof Requirement;
type SortDirection = 'asc' | 'desc';

const headers: { key: SortKey; label: string }[] = [
    { key: 'priority', label: 'Prioridade' },
    { key: 'requirementText', label: 'Requisito' },
    { key: 'area', label: 'Área' },
    { key: 'status', label: 'Status' },
    { key: 'responsible', label: 'Responsável' },
];

export const RequirementsTable: React.FC<RequirementsTableProps> = ({ requirements, onUpdateRequirement }) => {
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'priority', direction: 'desc' });

  const priorityOrder: { [key in Priority]: number } = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };

  const sortedRequirements = useMemo(() => {
    let sortableItems = [...requirements];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'priority') {
          const valA = priorityOrder[a.priority];
          const valB = priorityOrder[b.priority];
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [requirements, sortConfig, priorityOrder]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (req: Requirement) => {
    setSelectedRequirement(req);
  };

  const handleCloseModal = () => {
    setSelectedRequirement(null);
  };

  const handleSaveRequirement = (updatedReq: Requirement) => {
    onUpdateRequirement(updatedReq);
    handleCloseModal();
  };
    
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {headers.map((header) => (
                  <th key={header.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(header.key as SortKey)}>
                      <div className="flex items-center">
                          {header.label} {getSortIndicator(header.key as SortKey)}
                      </div>
                  </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRequirements.map((req) => (
              <tr key={req.id} onClick={() => handleRowClick(req)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold" style={{ color: PRIORITY_COLORS[req.priority] }}>{req.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">{req.requirementText}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{req.necessaryAction}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold" style={{ color: AREA_COLORS[req.area] }}>{req.area}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[req.status].bg} ${STATUS_COLORS[req.status].text}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{req.responsible}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRequirement && (
        <RequirementModal
          isOpen={!!selectedRequirement}
          onClose={handleCloseModal}
          requirement={selectedRequirement}
          onSave={handleSaveRequirement}
        />
      )}
    </>
  );
};
