import React, { useState } from 'react';
import { ViewTab } from './types';
import { Navbar } from './components/Navbar';
import { NotebookView } from './components/NotebookView';
import { DashboardView } from './components/DashboardView';
import { DatasetExplorer } from './components/DatasetExplorer';
import { SubmissionKit } from './components/SubmissionKit';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { CsvUploadModal } from './components/CsvUploadModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('notebook');
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentTab === 'notebook' && <NotebookView />}
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'dataset' && <DatasetExplorer />}
        {currentTab === 'submission' && <SubmissionKit />}
      </main>

      {/* Global CSV Upload Modal */}
      <CsvUploadModal />

      {/* Footer */}
      <footer
        className={`border-t py-6 text-xs transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Retail Sales Analytics
            </span>
            <span>•</span>
            <span>Exploratory Data Analysis (EDA)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('notebook')}
              className="hover:text-blue-500 transition"
            >
              10 Code Sections
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="hover:text-blue-500 transition"
            >
              Live Visuals
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('submission')}
              className="hover:text-blue-500 transition"
            >
              README.md & Submission
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}
