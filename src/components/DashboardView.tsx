import React, { useState, useMemo, useEffect } from 'react';
import { 
  MonthlyTrendChart, 
  CategoryRevenueChart, 
  CustomerDistChart, 
  CorrelationHeatmap, 
  AdditionalVizChart 
} from './Visualizations';
import { SalesCorrelationHeatmap } from './SalesCorrelationHeatmap';
import { SummaryStatisticsComponent } from './SummaryStatistics';
import { SalesForecasting } from './SalesForecasting';
import { MonthOverMonthGrowth } from './MonthOverMonthGrowth';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  RotateCcw, 
  Calendar, 
  FileText, 
  Loader2, 
  Check, 
  Sparkles,
  SlidersHorizontal,
  Clock,
  Upload,
  Database,
  FileSpreadsheet,
  Printer,
  FileDown,
  AlertTriangle,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  aggregateMonthlyFromTransactions, 
  aggregateCategoriesFromTransactions, 
  aggregateGenderFromTransactions,
  aggregateAgeDistribution,
  aggregateCorrelationMatrix,
  aggregateCrossTabCategoryGender,
  calculateMonthOverMonthSummary
} from '../utils/dataAggregation';
import { 
  exportFullDeckPdf, 
  exportDashboardReportPdf, 
  DashboardReportMetrics 
} from '../utils/exportChart';
import { detectSalesAnomalies } from '../utils/anomalyDetection';
import { DataAnomalyAlerts } from './DataAnomalyAlerts';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export const DashboardView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    transactions,
    datasetName,
    isCustomData,
    resetToDefault,
    setIsUploadModalOpen,
    stats,
  } = useData();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('All');

  // Dynamic available categories and genders based on current active dataset
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(transactions.map((t) => t.productCategory))).filter(Boolean);
    return ['All', ...cats.sort()];
  }, [transactions]);

  const availableGenders = useMemo(() => {
    const gens = Array.from(new Set(transactions.map((t) => t.gender))).filter(Boolean);
    return ['All', ...gens.sort()];
  }, [transactions]);

  // Dynamic date boundaries
  const { minDatasetDate, maxDatasetDate } = useMemo(() => {
    if (transactions.length === 0) {
      return { minDatasetDate: '2023-01-01', maxDatasetDate: '2023-12-31' };
    }
    let min = transactions[0].date;
    let max = transactions[0].date;
    for (const t of transactions) {
      if (t.date < min) min = t.date;
      if (t.date > max) max = t.date;
    }
    return { minDatasetDate: min, maxDatasetDate: max };
  }, [transactions]);

  // Calendar Date Range Filter State
  const [startDate, setStartDate] = useState<string>('2023-01-01');
  const [endDate, setEndDate] = useState<string>('2023-12-31');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');

  // Sync date filters when dataset changes
  useEffect(() => {
    if (isCustomData) {
      setStartDate(minDatasetDate);
      setEndDate(maxDatasetDate);
      setSelectedCategory('All');
      setSelectedGender('All');
      setSelectedAgeGroup('All');
      setActiveDatePreset('all');
    }
  }, [isCustomData, minDatasetDate, maxDatasetDate]);

  // Presentation Deck Export State
  const [isExportingDeck, setIsExportingDeck] = useState<boolean>(false);
  const [deckExportSuccess, setDeckExportSuccess] = useState<boolean>(false);

  // Executive Dashboard PDF Report Export State
  const [isExportingReportPdf, setIsExportingReportPdf] = useState<boolean>(false);
  const [reportPdfSuccess, setReportPdfSuccess] = useState<boolean>(false);

  // Active view sub-tab: 'all' | 'historical' | 'predictive'
  const [activeTab, setActiveTab] = useState<'all' | 'historical' | 'predictive'>('all');

  // Apply Quick Date Preset
  const applyDatePreset = (preset: string) => {
    setActiveDatePreset(preset);
    switch (preset) {
      case 'all':
        setStartDate(minDatasetDate);
        setEndDate(maxDatasetDate);
        break;
      case 'q1':
        setStartDate('2023-01-01');
        setEndDate('2023-03-31');
        break;
      case 'q2':
        setStartDate('2023-04-01');
        setEndDate('2023-06-30');
        break;
      case 'q3':
        setStartDate('2023-07-01');
        setEndDate('2023-09-30');
        break;
      case 'q4':
        setStartDate('2023-10-01');
        setEndDate('2023-12-31');
        break;
      case 'summer':
        setStartDate('2023-07-01');
        setEndDate('2023-08-31');
        break;
      case 'h1':
        setStartDate('2023-01-01');
        setEndDate('2023-06-30');
        break;
      case 'h2':
        setStartDate('2023-07-01');
        setEndDate('2023-12-31');
        break;
      default:
        break;
    }
  };

  // Filtered dataset adhering to Category, Gender, Age, and Date Range
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      // Date Range Filter
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Category Filter
      if (selectedCategory !== 'All' && item.productCategory !== selectedCategory) return false;

      // Gender Filter
      if (selectedGender !== 'All' && item.gender !== selectedGender) return false;

      // Age Cohort Filter
      if (selectedAgeGroup !== 'All') {
        if (selectedAgeGroup === '18-25' && (item.age < 18 || item.age > 25)) return false;
        if (selectedAgeGroup === '26-35' && (item.age < 26 || item.age > 35)) return false;
        if (selectedAgeGroup === '36-50' && (item.age < 36 || item.age > 50)) return false;
        if (selectedAgeGroup === '51-64' && (item.age < 51 || item.age > 64)) return false;
      }
      return true;
    });
  }, [transactions, selectedCategory, selectedGender, selectedAgeGroup, startDate, endDate]);

  // Aggregated dynamic data feeds for visualizations
  const dynamicMonthly = useMemo(() => aggregateMonthlyFromTransactions(filteredData), [filteredData]);
  const momSummary = useMemo(() => calculateMonthOverMonthSummary(dynamicMonthly), [dynamicMonthly]);
  const dynamicCategories = useMemo(() => aggregateCategoriesFromTransactions(filteredData), [filteredData]);
  const dynamicGender = useMemo(() => aggregateGenderFromTransactions(filteredData), [filteredData]);
  const dynamicAgeBins = useMemo(() => aggregateAgeDistribution(filteredData), [filteredData]);
  const dynamicCorrelation = useMemo(() => aggregateCorrelationMatrix(filteredData), [filteredData]);
  const dynamicCrossTab = useMemo(() => aggregateCrossTabCategoryGender(filteredData), [filteredData]);

  // Dynamic KPI calculations
  const metrics = useMemo(() => {
    const totalRev = filteredData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const count = filteredData.length;
    const totalUnits = filteredData.reduce((acc, curr) => acc + curr.quantity, 0);
    const aov = count > 0 ? totalRev / count : 0;
    const avgAge = count > 0 ? filteredData.reduce((acc, curr) => acc + curr.age, 0) / count : 0;
    return { totalRev, count, totalUnits, aov, avgAge };
  }, [filteredData]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedGender('All');
    setSelectedAgeGroup('All');
    setStartDate(minDatasetDate);
    setEndDate(maxDatasetDate);
    setActiveDatePreset('all');
  };

  const isFiltered =
    selectedCategory !== 'All' ||
    selectedGender !== 'All' ||
    selectedAgeGroup !== 'All' ||
    startDate !== minDatasetDate ||
    endDate !== maxDatasetDate;

  // Export full dashboard slide presentation deck
  const handleExportFullDeck = async () => {
    setIsExportingDeck(true);
    const previousTab = activeTab;
    if (activeTab !== 'all') {
      setActiveTab('all');
      await new Promise((r) => setTimeout(r, 350));
    }

    const charts = [
      { id: 'monthly-trend-chart-container', title: '1. Monthly Retail Revenue Trajectory' },
      { id: 'mom-growth-chart-container', title: '2. Month-over-Month (MoM) Sales Growth Analysis' },
      { id: 'cat-revenue-chart-container', title: '3. Total Revenue by Product Category' },
      { id: 'cat-units-chart-container', title: '4. Total Units Sold by Product Category' },
      { id: 'customer-age-chart-container', title: '5. Customer Age Distribution' },
      { id: 'gender-spending-chart-container', title: '6. Average Spend by Gender Comparison' },
      { id: 'sales-correlation-heatmap-container', title: '7. Sales Metrics Correlation Heatmap Matrix' },
      { id: 'additional-viz-container', title: '8. Category Spending by Gender Cross-Tab' },
      { id: 'sales-forecasting-container', title: '9. Machine Learning Forecast | Dataset' },
    ];

    const success = await exportFullDeckPdf(
      charts,
      'retail_sales_analytics_presentation_deck',
      isDark
    );
    setIsExportingDeck(false);

    if (previousTab !== 'all') {
      setActiveTab(previousTab);
    }

    if (success) {
      setDeckExportSuccess(true);
      setTimeout(() => setDeckExportSuccess(false), 3000);
    }
  };

  // Export Executive PDF Document (Metrics + Anomalies + Visualizations)
  const handleDownloadReportPdf = async () => {
    setIsExportingReportPdf(true);
    const previousTab = activeTab;
    if (activeTab !== 'all') {
      setActiveTab('all');
      await new Promise((r) => setTimeout(r, 350));
    }

    const anomaliesReport = detectSalesAnomalies(filteredData, 'standard');
    const anomaliesSummary = anomaliesReport.anomalies.map(
      (a) => `${a.periodLabel}: ${a.type === 'spike' ? 'Surge' : 'Drop'} of $${a.metricValue.toLocaleString()} (${a.deviationPct >= 0 ? '+' : ''}${a.deviationPct.toFixed(1)}% vs norm)`
    );

    const reportMetrics: DashboardReportMetrics = {
      totalRevenue: metrics.totalRev,
      totalUnits: metrics.totalUnits,
      aov: metrics.aov,
      avgAge: metrics.avgAge,
      transactionCount: metrics.count,
      categoryFilter: selectedCategory,
      genderFilter: selectedGender,
      ageFilter: selectedAgeGroup,
      dateRange: `${startDate} to ${endDate}`,
      datasetName: datasetName,
      momGrowth: momSummary.latestGrowthPct !== null
        ? `${momSummary.latestGrowthPct >= 0 ? '+' : ''}${momSummary.latestGrowthPct.toFixed(1)}%`
        : 'N/A',
      anomaliesSummary,
    };

    const success = await exportDashboardReportPdf(
      reportMetrics,
      `retail_sales_analytics_report_${new Date().toISOString().slice(0, 10)}`,
      isDark
    );
    setIsExportingReportPdf(false);

    if (previousTab !== 'all') {
      setActiveTab(previousTab);
    }

    if (success) {
      setReportPdfSuccess(true);
      setTimeout(() => setReportPdfSuccess(false), 3000);
    }
  };

  // Trigger Native Clean Print Dialogue (or Save as PDF via browser print engine, with iframe fallback)
  const handlePrintReport = async () => {
    const previousTab = activeTab;
    if (activeTab !== 'all') {
      setActiveTab('all');
      await new Promise((r) => setTimeout(r, 350));
    }

    try {
      window.print();
      if (previousTab !== 'all') {
        setTimeout(() => setActiveTab(previousTab), 600);
      }
    } catch (e) {
      console.warn('Browser window.print() blocked by iframe sandbox, automatically falling back to PDF download:', e);
      if (previousTab !== 'all') {
        setActiveTab(previousTab);
      }
      await handleDownloadReportPdf();
    }
  };

  // Quick scroll to Monthly Trend when inspecting anomaly
  const handleSelectAnomalyPeriod = (_period: string) => {
    if (activeTab === 'predictive') {
      setActiveTab('all');
      setTimeout(() => {
        const el = document.getElementById('monthly-trend-chart-container');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else {
      const el = document.getElementById('monthly-trend-chart-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Export Deck Action Bar */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Interactive Analytics
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Live Date & Cohort Filtering
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Retail Sales Analytics & Forecasting Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect historical sales trajectories, customer segments, product performance, and forward-looking machine learning sales predictions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload CSV Primary Button */}
            <button
              id="dashboard-upload-csv-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload your own custom retail CSV dataset"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition active:scale-95 min-h-[40px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>

            {/* View Filter Mode Pill */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Views
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'historical' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Historical EDA
              </button>
              <button
                onClick={() => setActiveTab('predictive')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                  activeTab === 'predictive' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                Forecasting
              </button>
            </div>

            {/* Download as PDF Button */}
            <button
              id="btn-download-pdf-report"
              onClick={handleDownloadReportPdf}
              disabled={isExportingReportPdf}
              title="Download executive analytics report with current metrics, anomalies, and charts as a PDF"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md shadow-rose-600/20 transition disabled:opacity-50 min-h-[40px]"
            >
              {isExportingReportPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-200" />
                  <span>Generating PDF...</span>
                </>
              ) : reportPdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-300">PDF Saved!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download as PDF</span>
                </>
              )}
            </button>

            {/* Print Report Button */}
            <button
              id="btn-print-report"
              onClick={handlePrintReport}
              title="Print dashboard report or save as PDF via browser print dialogue"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 shadow-sm transition min-h-[40px]"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print Report</span>
            </button>

            {/* Export Deck (PDF) */}
            <button
              id="btn-export-full-deck-pdf"
              onClick={handleExportFullDeck}
              disabled={isExportingDeck}
              title="Download all 8 dashboard visualizations into a high-res PDF presentation deck"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl border border-slate-800 shadow-sm transition disabled:opacity-50 min-h-[40px]"
            >
              {isExportingDeck ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Deck...</span>
                </>
              ) : deckExportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Deck Saved!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Slides Deck</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dataset Status Banner if Custom Dataset is Active */}
        {isCustomData && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Active Custom Dataset: <strong>{datasetName}</strong> ({transactions.length.toLocaleString()} total rows). Dashboard and models are reflecting your uploaded records.
              </span>
            </div>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-medium transition shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Sample Dataset
            </button>
          </div>
        )}

        {/* Date Range Picker & Filter Controls */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
          
          {/* Top Row: Calendar Date Range Picker */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">Date Range Calendar Filter</span>
                <p className="text-[11px] text-slate-400">View sales trends between specific dates</p>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-[11px] text-slate-400">From:</span>
                <input
                  id="date-filter-start"
                  type="date"
                  min="2023-01-01"
                  max="2023-12-31"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none cursor-pointer"
                />
              </div>

              <span className="text-slate-500 text-xs font-bold">→</span>

              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-[11px] text-slate-400">To:</span>
                <input
                  id="date-filter-end"
                  type="date"
                  min="2023-01-01"
                  max="2023-12-31"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="bg-transparent text-xs text-slate-100 focus:outline-none cursor-pointer"
                />
              </div>

              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          {/* Date Range Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex-shrink-0">Presets:</span>
            {[
              { key: 'all', label: 'Full Year (2023)' },
              { key: 'q1', label: 'Q1 (Jan–Mar: Peak)' },
              { key: 'q2', label: 'Q2 (Apr–Jun)' },
              { key: 'q3', label: 'Q3 (Jul–Sep)' },
              { key: 'q4', label: 'Q4 (Oct–Dec)' },
              { key: 'summer', label: 'Summer Slump (Jul–Aug)' },
              { key: 'h1', label: 'H1 (Jan–Jun)' },
              { key: 'h2', label: 'H2 (Jul–Dec)' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => applyDatePreset(p.key)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition active:scale-95 ${
                  activeDatePreset === p.key
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Second Row: Category, Gender, Age Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Product Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? `All Categories (${Math.max(1, availableCategories.length - 1)})` : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Customer Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {availableGenders.map((gen) => (
                  <option key={gen} value={gen}>
                    {gen === 'All' ? 'All Genders' : gen}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Age Cohort
              </label>
              <select
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Ages</option>
                <option value="18-25">18–25 (Gen Z)</option>
                <option value="26-35">26–35 (Young Adults)</option>
                <option value="36-50">36–50 (Middle-Aged)</option>
                <option value="51-64">51–64 (Seniors)</option>
              </select>
            </div>
          </div>

          {/* Active Status Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>
              Showing <strong className="text-slate-200">{filteredData.length}</strong> matching transactions
              {' '}(between <strong className="text-blue-400">{startDate}</strong> and <strong className="text-blue-400">{endDate}</strong>)
            </span>
            <span className="text-slate-500 hidden sm:inline">
              All charts automatically recalculate on filter change
            </span>
          </div>
        </div>
      </div>

      {/* Automated Data Anomaly Alert Section (Spikes & Drops Detection) */}
      <DataAnomalyAlerts
        transactions={filteredData}
        onSelectPeriod={handleSelectAnomalyPeriod}
      />

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 sm:mb-2">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            ${metrics.totalRev.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.count > 0 ? `${metrics.count} transactions in sample` : '0 transactions'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 sm:mb-2">
            <span>MoM Sales Growth</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <div
              className={`text-xl sm:text-2xl font-black ${
                momSummary.latestGrowthPct === null
                  ? 'text-slate-300'
                  : momSummary.latestGrowthPct >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {momSummary.latestGrowthPct !== null
                ? `${momSummary.latestGrowthPct >= 0 ? '+' : ''}${momSummary.latestGrowthPct.toFixed(1)}%`
                : 'Baseline'}
            </div>
            {momSummary.latestGrowthPct !== null && (
              <span
                className={`text-xs font-bold ${
                  momSummary.latestGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {momSummary.latestGrowthPct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 inline" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 inline" />
                )}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {momSummary.latestGrowthPct !== null ? (
              <>
                <span
                  className={`font-semibold ${
                    momSummary.latestRevenueDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {momSummary.latestRevenueDelta >= 0 ? '+' : ''}${momSummary.latestRevenueDelta.toLocaleString()}
                </span>{' '}
                vs {momSummary.previousMonthLabel}
              </>
            ) : (
              '1st period in filter'
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 sm:mb-2">
            <span>Transactions Count</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {metrics.count.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.totalUnits.toLocaleString()} units sold
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 sm:mb-2">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            ${metrics.aov.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dataset Avg: ${stats.totalAmount.mean}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 sm:mb-2">
            <span>Mean Customer Age</span>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {metrics.avgAge.toFixed(1)} yrs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dataset Avg: {stats.age.mean} yrs
          </div>
        </div>
      </div>

      {/* Summary Statistics Component for Numerical Columns */}
      <SummaryStatisticsComponent
        data={filteredData}
        title="Numerical Features: Summary Statistics (Mean, Median, Mode, Std)"
        subtitle="Live central tendency and dispersion metrics across Quantity, Price per Unit, and Total Amount."
      />

      {/* Predictive Analytics & Sales Forecasting Section */}
      {(activeTab === 'all' || activeTab === 'predictive') && (
        <div>
          <SalesForecasting monthlyData={dynamicMonthly} />
        </div>
      )}

      {/* Core Analytical Visualizations (Dynamic to Date Range & Filters) */}
      {(activeTab === 'all' || activeTab === 'historical') && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <span>1. Sales Trajectory Over Time (Time Series)</span>
              </h3>
              <span className="text-xs text-slate-400">
                {dynamicMonthly.length} month(s) in active filter
              </span>
            </div>
            <MonthlyTrendChart
              data={dynamicMonthly}
              title={`Figure 1: Monthly Retail Revenue Trajectory (${startDate} to ${endDate})`}
              subtitle="Interactive time series reflecting your custom date range filter with exact revenue, orders, and units."
            />
          </div>

          <div>
            <MonthOverMonthGrowth
              monthlyData={dynamicMonthly}
              datasetName={datasetName}
              onSelectMonth={handleSelectAnomalyPeriod}
            />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span>3. Product Category Performance</span>
            </h3>
            <CategoryRevenueChart data={dynamicCategories} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span>4. Customer Demographic Insights</span>
            </h3>
            <CustomerDistChart genderData={dynamicGender} ageData={dynamicAgeBins} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span>5. Sales Metrics Correlation Heatmap & Bivariate Analysis</span>
            </h3>
            <SalesCorrelationHeatmap
              transactions={filteredData}
              datasetName={isCustomData ? datasetName : 'Active Dataset'}
            />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span>6. Category Spending by Gender</span>
            </h3>
            <AdditionalVizChart data={dynamicCrossTab} />
          </div>
        </div>
      )}
    </div>
  );
};
