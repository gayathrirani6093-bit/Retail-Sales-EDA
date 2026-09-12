import React, { useState, useRef, DragEvent } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { parseRetailCsv, CsvParseResult } from '../utils/csvParser';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

export const CsvUploadModal: React.FC = () => {
  const { isUploadModalOpen, setIsUploadModalOpen, uploadCsv, resetToDefault, isCustomData, datasetName } = useData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [pasteMode, setPasteMode] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleClose = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFileContent('');
    setParseResult(null);
    setErrorMessage('');
    setSuccessToast('');
  };

  const processCsvText = (text: string, fileName: string) => {
    setErrorMessage('');
    setSuccessToast('');
    const result = parseRetailCsv(text);
    setParseResult(result);
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setErrorMessage('Please upload a valid .csv file.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      processCsvText(text, file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    const content = pasteMode ? pastedText : fileContent;
    const name = pasteMode ? 'Pasted Dataset.csv' : (selectedFile?.name || 'Custom Dataset.csv');

    if (!content) {
      setErrorMessage('Please select a file or paste CSV content first.');
      return;
    }

    const res = uploadCsv(content, name);
    if (res.success) {
      setSuccessToast(res.message);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `Transaction ID,Date,Customer ID,Gender,Age,Product Category,Quantity,Price per Unit,Total Amount
1,2023-01-15,CUST001,Female,28,Beauty,2,50,100
2,2023-02-20,CUST002,Male,34,Clothing,3,100,300
3,2023-03-10,CUST003,Female,45,Electronics,1,500,500
4,2023-04-05,CUST004,Male,22,Beauty,2,25,50
5,2023-05-18,CUST005,Female,31,Clothing,4,50,200
6,2023-06-25,CUST006,Male,52,Electronics,2,300,600
7,2023-07-14,CUST007,Female,29,Beauty,1,100,100
8,2023-08-08,CUST008,Male,41,Clothing,2,300,600
9,2023-09-19,CUST009,Female,38,Electronics,1,300,300
10,2023-10-22,CUST010,Male,26,Clothing,3,50,150`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'retail_sales_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="csv-upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      <div
        id="csv-upload-modal-card"
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border p-6 overflow-hidden max-h-[90vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Import Custom Dataset</h3>
              <p className="text-xs text-slate-400">
                Upload your retail sales CSV file to analyze and update the dashboard live.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: File Drag & Drop vs Paste */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setPasteMode(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                !pasteMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setPasteMode(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                pasteMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste CSV Text
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV Template
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {!pasteMode ? (
            /* Drag and Drop Zone */
            <div
              id="csv-drop-zone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : isDark
                  ? 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />

              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-400">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-blue-400 font-semibold">Click to browse</span> or drag and drop your CSV here
                  </p>
                  <p className="text-xs text-slate-400">Supports comma-separated .csv or .txt files</p>
                </div>
              )}
            </div>
          ) : (
            /* Raw CSV Paste Box */
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Paste CSV rows (including header line):</label>
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  processCsvText(e.target.value, 'Pasted Data.csv');
                }}
                rows={6}
                placeholder="Transaction ID,Date,Customer ID,Gender,Age,Product Category,Quantity,Price per Unit,Total Amount&#10;1,2023-01-15,CUST001,Female,28,Beauty,2,50,100"
                className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          )}

          {/* Validation & Preview Panel */}
          {parseResult && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                parseResult.success
                  ? isDark
                    ? 'bg-slate-800/60 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {parseResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-semibold text-sm">
                    {parseResult.success
                      ? `${parseResult.rowCount.toLocaleString()} valid transactions detected`
                      : 'Data Parsing Error'}
                  </span>
                </div>
                {parseResult.success && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ready to Import
                  </span>
                )}
              </div>

              {parseResult.success && (
                <>
                  <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                    <span className="text-slate-400 mr-1">Detected Columns:</span>
                    {parseResult.columnsFound.map((col) => (
                      <span
                        key={col}
                        className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>

                  {/* Sample Preview Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-700/50 text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-800 text-slate-300">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Gender</th>
                          <th className="p-2">Age</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Unit $</th>
                          <th className="p-2">Total $</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {parseResult.transactions.slice(0, 3).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{r.date}</td>
                            <td className="p-2">{r.productCategory}</td>
                            <td className="p-2">{r.gender}</td>
                            <td className="p-2">{r.age}</td>
                            <td className="p-2">{r.quantity}</td>
                            <td className="p-2">${r.pricePerUnit}</td>
                            <td className="p-2 font-semibold text-emerald-400">${r.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Format Info Box */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-300">Flexible Header Detection:</p>
              <p>
                Columns can be named with standard names or common aliases (e.g. <em>Date</em>, <em>Category</em>,{' '}
                <em>Gender</em>, <em>Age</em>, <em>Quantity</em>, <em>Price per Unit</em>, <em>Total Amount</em>). If
                total amount is missing, it will automatically compute from quantity &times; unit price.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
          {isCustomData ? (
            <button
              onClick={() => {
                resetToDefault();
                handleClose();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Sample Dataset
            </button>
          ) : (
            <span className="text-xs text-slate-500">Currently analyzing default dataset</span>
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="confirm-import-csv-btn"
              disabled={!parseResult?.success}
              onClick={handleConfirmImport}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition shadow-lg ${
                parseResult?.success
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Import to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
