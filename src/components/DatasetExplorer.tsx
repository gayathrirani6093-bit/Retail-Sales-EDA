import React, { useState, useMemo } from 'react';
import { RetailTransaction } from '../types';
import {
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Check,
  Upload,
} from 'lucide-react';
import { downloadFile } from '../utils/exportIpynb';
import { SummaryStatisticsComponent } from './SummaryStatistics';
import { useData } from '../context/DataContext';

export const DatasetExplorer: React.FC = () => {
  const {
    transactions,
    datasetName,
    isCustomData,
    resetToDefault,
    setIsUploadModalOpen,
  } = useData();

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Explicit Filter Controls
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedQuantity, setSelectedQuantity] = useState<string>('All');
  
  // Sort and Pagination
  const [sortField, setSortField] = useState<keyof RetailTransaction>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  // Dynamic available categories and genders based on current transactions
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(transactions.map((t) => t.productCategory))).filter(Boolean);
    return ['All', ...cats.sort()];
  }, [transactions]);

  const availableGenders = useMemo(() => {
    const gens = Array.from(new Set(transactions.map((t) => t.gender))).filter(Boolean);
    return ['All', ...gens.sort()];
  }, [transactions]);

  // Filter logic including Transaction ID search, Customer ID, Date, and Product Category dropdown
  const filtered = useMemo(() => {
    return transactions.filter((row) => {
      // Category filter
      if (selectedCategory !== 'All' && row.productCategory !== selectedCategory) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'All' && row.gender !== selectedGender) {
        return false;
      }

      // Quantity filter
      if (selectedQuantity !== 'All' && row.quantity.toString() !== selectedQuantity) {
        return false;
      }

      // Search term: specifically matches Transaction ID, Customer ID, Category, Date, etc.
      if (searchTerm.trim() !== '') {
        const q = searchTerm.trim().toLowerCase();
        const matchesId = row.id.toString() === q || row.id.toString().includes(q);
        const matchesCustId = (row.custId || '').toLowerCase().includes(q);
        const matchesCategory = (row.productCategory || '').toLowerCase().includes(q);
        const matchesGender = (row.gender || '').toLowerCase().includes(q);
        const matchesDate = (row.date || '').includes(q);
        const matchesAmount = (row.totalAmount || '').toString().includes(q);

        return matchesId || matchesCustId || matchesCategory || matchesGender || matchesDate || matchesAmount;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedCategory, selectedGender, selectedQuantity]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [filtered, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof RetailTransaction) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedGender('All');
    setSelectedQuantity('All');
    setCurrentPage(1);
  };

  // Export processed (currently filtered and sorted) data as CSV
  const handleExportFilteredCsv = () => {
    // Generate CSV headers
    const headers = [
      'Transaction ID',
      'Date',
      'Customer ID',
      'Gender',
      'Age',
      'Product Category',
      'Quantity',
      'Price per Unit',
      'Total Amount',
    ];

    // Map each row to CSV line
    const csvRows = sorted.map((row) => [
      row.id,
      `"${row.date}"`,
      `"${row.custId}"`,
      `"${row.gender}"`,
      row.age,
      `"${row.productCategory}"`,
      row.quantity,
      row.pricePerUnit,
      row.totalAmount,
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create descriptive filename based on active filters
    const filterTag = selectedCategory !== 'All' ? `_${selectedCategory.toLowerCase()}` : '';
    const searchTag = searchTerm ? '_filtered' : '';
    const filename = `retail_sales_processed${filterTag}${searchTag}_${sorted.length}rows.csv`;

    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  // Raw original CSV download handler
  const handleDownloadOriginalCsv = () => {
    const a = document.createElement('a');
    a.href = '/retail_sales_dataset.csv';
    a.download = 'retail_sales_dataset.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Quick summary statistics for the filtered dataset
  const filteredMetrics = useMemo(() => {
    const totalRev = sorted.reduce((acc, row) => acc + row.totalAmount, 0);
    const totalUnits = sorted.reduce((acc, row) => acc + row.quantity, 0);
    const avgSpend = sorted.length > 0 ? totalRev / sorted.length : 0;
    return { totalRev, totalUnits, avgSpend };
  }, [sorted]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls Panel */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Retail Sales Dataset Explorer ({transactions.length.toLocaleString()} {isCustomData ? 'Custom' : 'Verified'} Transactions)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isCustomData
                ? `Currently inspecting custom uploaded dataset: "${datasetName}". Search by ID, filter by category/gender, or export processed records.`
                : 'Search by Transaction ID, filter by Product Category, and export the processed data directly to CSV.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Upload CSV Button */}
            <button
              id="explorer-upload-csv-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-95 whitespace-nowrap"
              title="Upload your own custom retail CSV dataset"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

            {/* Export Processed / Filtered CSV Button */}
            <button
              id="btn-export-processed-csv"
              onClick={handleExportFilteredCsv}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 whitespace-nowrap"
              title="Export currently filtered and sorted rows to CSV"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedExport ? 'Downloaded CSV!' : `Export Filtered CSV (${sorted.length})`}</span>
            </button>

            {/* Original dataset download or Reset */}
            {isCustomData ? (
              <button
                id="btn-reset-to-sample"
                onClick={resetToDefault}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition whitespace-nowrap"
                title="Reset to default 1,000 transaction dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            ) : (
              <button
                id="btn-download-raw-csv"
                onClick={handleDownloadOriginalCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition whitespace-nowrap"
                title="Download original unfiltered retail_sales_dataset.csv"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Raw (1,000)</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800">
          
          {/* Search Input: Transaction ID / Text Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Search Transaction ID or Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-input"
                type="text"
                placeholder="e.g. 42, CUST088, Clothing, 2023-05..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Product Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Product Category
            </label>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? `All Categories (${Math.max(1, availableCategories.length - 1)})` : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Customer Gender
            </label>
            <select
              id="filter-gender-select"
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {availableGenders.map((gen) => (
                <option key={gen} value={gen}>
                  {gen === 'All' ? 'All Genders' : gen}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters & Clear */}
          <div className="flex items-end">
            <button
              id="btn-reset-filters"
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-200">
              Matched Records: <span className="text-emerald-400">{sorted.length}</span> of {transactions.length.toLocaleString()}
            </span>
            <span>•</span>
            <span>Filtered Revenue: <strong className="text-slate-100">${filteredMetrics.totalRev.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Units: <strong className="text-slate-100">{filteredMetrics.totalUnits.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Avg Spend: <strong className="text-slate-100">${filteredMetrics.avgSpend.toFixed(2)}</strong></span>
          </div>

          <div className="text-[11px] text-slate-500">
            Click any column header to sort ascending / descending
          </div>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
              <tr>
                {[
                  { key: 'id', label: 'Transaction ID' },
                  { key: 'date', label: 'Date' },
                  { key: 'custId', label: 'Customer ID' },
                  { key: 'gender', label: 'Gender' },
                  { key: 'age', label: 'Age' },
                  { key: 'productCategory', label: 'Category' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: 'pricePerUnit', label: 'Price/Unit ($)' },
                  { key: 'totalAmount', label: 'Total ($)' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof RetailTransaction)}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-900 transition font-bold select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === col.key ? 'text-blue-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 0 ? 'bg-slate-900/50 hover:bg-slate-800/40' : 'bg-slate-950/40 hover:bg-slate-800/40'}
                  >
                    <td className="px-4 py-2.5 text-blue-400 font-semibold">{row.id}</td>
                    <td className="px-4 py-2.5 text-slate-300">{row.date}</td>
                    <td className="px-4 py-2.5 text-indigo-300 font-medium">{row.custId}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.gender === 'Female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {row.gender}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{row.age}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.productCategory === 'Clothing'
                            ? 'bg-blue-500/20 text-blue-300'
                            : row.productCategory === 'Electronics'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {row.productCategory}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200">{row.quantity}</td>
                    <td className="px-4 py-2.5 text-slate-300">${row.pricePerUnit}</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold">${row.totalAmount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-400">No transactions match your search filter.</p>
                      <p className="text-xs text-slate-500">
                        Try resetting your search query or choosing "All Categories".
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            {sorted.length > 0 ? (
              <>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} records
              </>
            ) : (
              '0 records found'
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-200">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics for Numerical Columns */}
      <SummaryStatisticsComponent
        data={sorted}
        title="Dataset Summary Statistics: Numerical Features"
        subtitle="Live calculations of Mean, Median, Mode, and Standard Deviation for Quantity, Price per Unit, and Total Amount."
      />
    </div>
  );
};
