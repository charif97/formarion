
import React, { useRef } from 'react';
import type { StudySet } from '../types';
import { DownloadIcon, TrashIcon, ImportIcon } from './icons';
import { exportToJson, exportToAnkiTxt, importFromJson } from '../lib/exportAnki';

interface SettingsViewProps {
  studySets: StudySet[];
  onDeleteSet: (setId: string) => void;
  onImportSet: (set: StudySet) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  onNavigateToEvaluation: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ studySets, onDeleteSet, onImportSet, showToast, onNavigateToEvaluation }) => {
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleExportJson = (set: StudySet) => {
    try {
      exportToJson(set);
      showToast("JSON export started.", "success");
    } catch (error) {
      showToast("Failed to export JSON.", "error");
    }
  };
  
  const handleExportAnki = (set: StudySet) => {
    try {
      exportToAnkiTxt(set);
      showToast("Anki export started.", "success");
    } catch(error) {
        showToast("Failed to export for Anki.", "error");
    }
  };
  
  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const newSet = await importFromJson(file);
        onImportSet(newSet);
        showToast("Set imported successfully!", "success");
    } catch (error) {
        showToast((error as Error).message, "error");
    } finally {
        if(importFileRef.current) {
            importFileRef.current.value = "";
        }
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and data.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Profile</h2>
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <input type="text" value="Demo User" disabled className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input type="email" value="demo@example.com" disabled className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-600">Language</label>
              <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option>English</option>
                <option disabled>Français (coming soon)</option>
                <option disabled>Español (coming soon)</option>
              </select>
           </div>
        </div>
      </div>
      
       {/* AI Evaluation Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">AI Quality Assurance</h2>
        <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Run automated tests to evaluate the AI's generation quality.</p>
            <button onClick={onNavigateToEvaluation} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                Run Evaluation
            </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
         <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-700">Data Management</h2>
            <input 
                type="file" 
                ref={importFileRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileImport}
            />
            <button onClick={handleImportClick} className="flex items-center gap-2 text-sm bg-gray-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-gray-700 transition-colors">
                <ImportIcon className="w-4 h-4" />
                Import from JSON
            </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Download your study sets as JSON or Anki-compatible TXT files.</p>
        <div className="space-y-2">
            {studySets.length > 0 ? studySets.map(set => (
                <div key={set.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="truncate pr-4">{set.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleExportAnki(set)} className="flex items-center gap-2 text-sm bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600 transition-colors">
                            <DownloadIcon className="w-4 h-4" />
                            Anki (.txt)
                        </button>
                        <button onClick={() => handleExportJson(set)} className="flex items-center gap-2 text-sm bg-primary-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-primary-600 transition-colors">
                            <DownloadIcon className="w-4 h-4" />
                            JSON
                        </button>
                    </div>
                </div>
            )) : <p className="text-gray-500">You have no study sets to manage.</p>}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-xl shadow-md border-2 border-red-500">
        <h2 className="text-xl font-bold text-red-700 mb-4 border-b pb-2">Danger Zone</h2>
         <div className="space-y-2">
            {studySets.length > 0 ? studySets.map(set => (
                <div key={set.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-900 truncate pr-4">{set.title}</span>
                    <button onClick={() => onDeleteSet(set.id)} className="flex-shrink-0 flex items-center gap-2 text-sm bg-red-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-red-600 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )) : <p className="text-gray-500">You have no study sets to delete.</p>}
        </div>
      </div>
    </div>
  );
};