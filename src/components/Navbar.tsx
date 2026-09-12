import React from 'react';
import { ViewTab } from '../types';
import { BookOpen, BarChart3, Database, FileCheck, Download, Code2, Sun, Moon, Upload } from 'lucide-react';
import { generateJupyterNotebookJson, downloadFile } from '../utils/exportIpynb';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

interface NavbarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { totalRowCount, isCustomData, setIsUploadModalOpen } = useData();

  const handleDownloadIpynb = () => {
    const json = generateJupyterNotebookJson();
    downloadFile(json, 'retail_sales_eda.ipynb', 'application/json');
  };

  const handleDownloadCsv = () => {
    const a = document.createElement('a');
    a.href = '/retail_sales_dataset.csv';
    a.download = 'retail_sales_dataset.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <header
      id="main-header"
      className={`border-b sticky top-0 z-40 transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-bold leading-tight flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Retail Sales EDA
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-slate-950/70 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              id="tab-notebook"
              onClick={() => setCurrentTab('notebook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'notebook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Notebook & Code
            </button>

            <button
              id="tab-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Live EDA Dashboard
            </button>

            <button
              id="tab-dataset"
              onClick={() => setCurrentTab('dataset')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dataset'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Dataset ({totalRowCount.toLocaleString()} Rows)
              {isCustomData && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" title="Custom Dataset Loaded" />
              )}
            </button>

            <button
              id="tab-submission"
              onClick={() => setCurrentTab('submission')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'submission'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Submission Kit & README
            </button>
          </nav>

          {/* Action Downloads, Upload CSV & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Upload CSV Primary Action Button */}
            <button
              id="navbar-upload-csv-btn"
              onClick={() => {
                setIsUploadModalOpen(true);
              }}
              title="Upload your own custom retail CSV dataset"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload CSV</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle light or dark theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium border transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs text-slate-200">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline text-xs text-slate-700">Dark</span>
                </>
              )}
            </button>

            <button
              id="btn-download-csv"
              onClick={handleDownloadCsv}
              title="Download clean retail_sales_dataset.csv file"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                theme === 'dark'
                  ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border-slate-300'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              id="btn-download-ipynb"
              onClick={handleDownloadIpynb}
              title="Download complete ready-to-run Jupyter Notebook (.ipynb)"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download .ipynb</span>
              <span className="sm:hidden">.ipynb</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div
          className={`flex md:hidden items-center justify-around py-1.5 border-t text-xs transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => setCurrentTab('notebook')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg min-h-[44px] touch-manipulation transition ${
              currentTab === 'notebook'
                ? 'text-blue-500 font-bold bg-blue-500/10'
                : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Notebook</span>
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg min-h-[44px] touch-manipulation transition ${
              currentTab === 'dashboard'
                ? 'text-blue-500 font-bold bg-blue-500/10'
                : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentTab('dataset')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg min-h-[44px] touch-manipulation transition ${
              currentTab === 'dataset'
                ? 'text-blue-500 font-bold bg-blue-500/10'
                : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Dataset</span>
          </button>
          <button
            onClick={() => setCurrentTab('submission')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg min-h-[44px] touch-manipulation transition ${
              currentTab === 'submission'
                ? 'text-blue-500 font-bold bg-blue-500/10'
                : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>README</span>
          </button>
        </div>
      </div>
    </header>
  );
};
