import React, { useState, useMemo } from 'react';
import { RetailTransaction } from '../types';
import {
  SALES_METRICS,
  SalesMetricKey,
  SalesMetricDefinition,
  calculateSalesCorrelation,
  CorrelationPairResult,
} from '../utils/dataAggregation';
import { ExportChartMenu } from './ExportChartMenu';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  SlidersHorizontal,
  Download,
  Check,
  Maximize2,
  DollarSign,
  Package,
  Layers,
  PieChart,
  Calendar,
  CircleDot,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';

export interface SalesCorrelationHeatmapProps {
  transactions: RetailTransaction[];
  datasetName?: string;
  onSelectCategory?: (category: string) => void;
}

type ColorTheme = 'coolwarm' | 'emerald_rose' | 'indigo_amber';

export const SalesCorrelationHeatmap: React.FC<SalesCorrelationHeatmapProps> = ({
  transactions,
  datasetName = 'Retail Sales Dataset',
}) => {
  // Available metric keys to toggle
  const [selectedKeys, setSelectedKeys] = useState<SalesMetricKey[]>([
    'pricePerUnit',
    'quantity',
    'totalAmount',
    'profit',
    'marginPct',
    'age',
  ]);

  const [colorTheme, setColorTheme] = useState<ColorTheme>('coolwarm');
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [selectedPairKey, setSelectedPairKey] = useState<string>('pricePerUnit__profit');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; id: number } | null>(null);

  // Compute dynamic correlation
  const correlationData = useMemo(() => {
    return calculateSalesCorrelation(transactions, selectedKeys);
  }, [transactions, selectedKeys]);

  const { metrics, matrix, pairDetails, topPairs, datasetSize } = correlationData;

  // Currently active pair detail for scatter drilldown
  const activePair: CorrelationPairResult | undefined = useMemo(() => {
    if (pairDetails[selectedPairKey]) {
      return pairDetails[selectedPairKey];
    }
    // Fallback to first non-diagonal pair
    if (topPairs.length > 0) {
      return topPairs[0];
    }
    return undefined;
  }, [pairDetails, selectedPairKey, topPairs]);

  // Toggle metric selection
  const handleToggleMetric = (key: SalesMetricKey) => {
    if (selectedKeys.includes(key)) {
      if (selectedKeys.length <= 2) return; // keep at least 2 metrics
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  // Presets
  const handleApplyPreset = (preset: 'all' | 'core_profit' | 'price_volume') => {
    if (preset === 'all') {
      setSelectedKeys(['pricePerUnit', 'quantity', 'totalAmount', 'profit', 'marginPct', 'age', 'cost']);
    } else if (preset === 'core_profit') {
      setSelectedKeys(['pricePerUnit', 'quantity', 'totalAmount', 'profit']);
    } else if (preset === 'price_volume') {
      setSelectedKeys(['pricePerUnit', 'quantity', 'totalAmount', 'profit', 'marginPct']);
    }
  };

  // Color mapping logic
  const getCellColor = (val: number, isSelected: boolean) => {
    // Normalization from [-1, 1]
    const clamped = Math.max(-1, Math.min(1, val));

    if (colorTheme === 'coolwarm') {
      // Seaborn coolwarm: Blue (-1) -> Slate (0) -> Coral/Rose (+1)
      if (clamped >= 0.85) return isSelected ? 'bg-rose-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-600 text-white';
      if (clamped >= 0.6) return isSelected ? 'bg-rose-500 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-500 text-white';
      if (clamped >= 0.3) return isSelected ? 'bg-rose-400/90 text-slate-950 font-bold ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-400/90 text-slate-950 font-bold';
      if (clamped >= 0.1) return isSelected ? 'bg-rose-900/60 text-rose-200 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-900/50 text-rose-200';
      if (clamped > -0.1) return isSelected ? 'bg-slate-800 text-slate-300 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-slate-800/80 text-slate-300';
      if (clamped > -0.3) return isSelected ? 'bg-blue-950/70 text-blue-200 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-blue-950/60 text-blue-200';
      if (clamped > -0.6) return isSelected ? 'bg-blue-700 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-blue-700 text-white';
      return isSelected ? 'bg-blue-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-blue-600 text-white';
    }

    if (colorTheme === 'emerald_rose') {
      // Financial: Rose (-1) -> Slate (0) -> Emerald (+1)
      if (clamped >= 0.85) return isSelected ? 'bg-emerald-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-emerald-600 text-white';
      if (clamped >= 0.6) return isSelected ? 'bg-emerald-500 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-emerald-500 text-white';
      if (clamped >= 0.3) return isSelected ? 'bg-emerald-400/90 text-slate-950 font-bold ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-emerald-400/90 text-slate-950 font-bold';
      if (clamped >= 0.1) return isSelected ? 'bg-emerald-950/70 text-emerald-200 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-emerald-950/50 text-emerald-200';
      if (clamped > -0.1) return isSelected ? 'bg-slate-800 text-slate-300 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-slate-800/80 text-slate-300';
      if (clamped > -0.3) return isSelected ? 'bg-rose-950/60 text-rose-200 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-950/50 text-rose-200';
      if (clamped > -0.6) return isSelected ? 'bg-rose-700 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-700 text-white';
      return isSelected ? 'bg-rose-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-rose-600 text-white';
    }

    // Indigo Amber
    if (clamped >= 0.85) return isSelected ? 'bg-indigo-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-indigo-600 text-white';
    if (clamped >= 0.6) return isSelected ? 'bg-indigo-500 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-indigo-500 text-white';
    if (clamped >= 0.3) return isSelected ? 'bg-indigo-400/90 text-slate-950 font-bold ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-indigo-400/90 text-slate-950 font-bold';
    if (clamped >= 0.1) return isSelected ? 'bg-indigo-950/70 text-indigo-200 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-indigo-950/50 text-indigo-200';
    if (clamped > -0.1) return isSelected ? 'bg-slate-800 text-slate-300 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-slate-800/80 text-slate-300';
    return isSelected ? 'bg-amber-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'bg-amber-600 text-white';
  };

  // Export Matrix to CSV
  const handleExportCsv = () => {
    const headerRow = ['Variable', ...metrics.map((m) => `"${m.label}"`)].join(',');
    const dataRows = matrix.map((row, i) => {
      const rowName = `"${metrics[i].label}"`;
      const vals = row.map((v) => v.toFixed(4)).join(',');
      return `${rowName},${vals}`;
    });

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_metrics_correlation_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Metric icon helper
  const getMetricIcon = (key: SalesMetricKey) => {
    switch (key) {
      case 'pricePerUnit':
        return <DollarSign className="w-3.5 h-3.5 text-blue-400" />;
      case 'quantity':
        return <Package className="w-3.5 h-3.5 text-emerald-400" />;
      case 'totalAmount':
        return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
      case 'profit':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'marginPct':
        return <PieChart className="w-3.5 h-3.5 text-purple-400" />;
      case 'age':
        return <Calendar className="w-3.5 h-3.5 text-cyan-400" />;
      case 'cost':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  // Scatter plot calculations
  const scatterStats = useMemo(() => {
    if (!activePair || activePair.samplePoints.length === 0) return null;
    const pts = activePair.samplePoints;
    const xVals = pts.map((p) => p.x);
    const yVals = pts.map((p) => p.y);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    // SVG coordinate space
    const width = 540;
    const height = 280;
    const padLeft = 65;
    const padBottom = 45;
    const padTop = 25;
    const padRight = 30;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const toSvgX = (val: number) => padLeft + ((val - minX) / spanX) * plotWidth;
    const toSvgY = (val: number) => padTop + plotHeight - ((val - minY) / spanY) * plotHeight;

    // Regression line end coordinates
    const regStartX = minX;
    const regStartY = activePair.slope * regStartX + activePair.intercept;
    const regEndX = maxX;
    const regEndY = activePair.slope * regEndX + activePair.intercept;

    return {
      pts,
      minX,
      maxX,
      minY,
      maxY,
      width,
      height,
      padLeft,
      padBottom,
      padTop,
      padRight,
      plotWidth,
      plotHeight,
      toSvgX,
      toSvgY,
      regP1: { x: toSvgX(regStartX), y: toSvgY(regStartY) },
      regP2: { x: toSvgX(regEndX), y: toSvgY(regEndY) },
    };
  }, [activePair]);

  return (
    <div
      id="sales-correlation-heatmap-container"
      className="bg-slate-900/95 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-6"
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Sales Metrics Correlation Heatmap</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Dynamic Real-Time
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Measures Pearson correlation coefficients ($r$) across pricing, volume, gross profit, and customer features.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dataset badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">{datasetName}</span>
            <span className="text-slate-400 font-mono">({datasetSize.toLocaleString()} rows)</span>
          </div>

          {/* Theme selector */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setColorTheme('coolwarm')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                colorTheme === 'coolwarm' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Seaborn coolwarm: Blue to Rose"
            >
              Coolwarm
            </button>
            <button
              onClick={() => setColorTheme('emerald_rose')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                colorTheme === 'emerald_rose' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Financial: Rose to Emerald"
            >
              Emerald
            </button>
            <button
              onClick={() => setColorTheme('indigo_amber')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                colorTheme === 'indigo_amber' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Indigo to Amber"
            >
              Indigo
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
            title="Download matrix as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV Matrix</span>
          </button>

          {/* Export Chart Menu */}
          <ExportChartMenu
            targetElementId="sales-correlation-heatmap-container"
            filename="sales_metrics_correlation_heatmap"
            chartTitle="Sales Metrics Correlation Heatmap Matrix"
          />
        </div>
      </div>

      {/* Metric selection pills & presets bar */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Include Sales Variables in Heatmap:</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({selectedKeys.length} of {SALES_METRICS.length} active)
            </span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => handleApplyPreset('core_profit')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
            >
              Core Sales & Profit
            </button>
            <button
              onClick={() => handleApplyPreset('price_volume')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
            >
              Price & Margin
            </button>
            <button
              onClick={() => handleApplyPreset('all')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
            >
              All Metrics
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {SALES_METRICS.map((metric) => {
            const isSelected = selectedKeys.includes(metric.key);
            return (
              <button
                key={metric.key}
                onClick={() => handleToggleMetric(metric.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 border ${
                  isSelected
                    ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
                title={metric.description}
              >
                {getMetricIcon(metric.key)}
                <span className="font-semibold">{metric.label}</span>
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Heatmap (Left) and Interactive Pair Drilldown (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Heatmap Matrix */}
        <div className="xl:col-span-7 bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-indigo-400" />
                Correlation Matrix ($r \in [-1, +1]$)
              </span>
              <span className="text-[11px] text-slate-400">
                Click any cell to inspect pairwise scatter plot & regression
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full text-xs text-center border-collapse table-fixed min-w-[480px]">
                <thead>
                  <tr>
                    <th className="p-2.5 text-left text-slate-400 font-semibold w-28">
                      Variable
                    </th>
                    {metrics.map((m, idx) => (
                      <th
                        key={m.key}
                        className={`p-2.5 font-bold text-slate-200 border-b border-slate-800 transition ${
                          hoveredCell && hoveredCell.c === idx ? 'bg-slate-800/60 text-white' : ''
                        }`}
                        title={m.label}
                      >
                        <div className="flex flex-col items-center gap-1 truncate">
                          {getMetricIcon(m.key)}
                          <span className="truncate text-[11px]">{m.shortLabel}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rIdx) => {
                    const rowMetric = metrics[rIdx];
                    return (
                      <tr
                        key={rowMetric.key}
                        className={`border-b border-slate-800/60 transition ${
                          hoveredCell && hoveredCell.r === rIdx ? 'bg-slate-900/40' : ''
                        }`}
                      >
                        <td className="p-2.5 text-left font-semibold text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 truncate">
                            {getMetricIcon(rowMetric.key)}
                            <span className="truncate">{rowMetric.shortLabel}</span>
                          </div>
                        </td>

                        {row.map((val, cIdx) => {
                          const colMetric = metrics[cIdx];
                          const pairKey = `${rowMetric.key}__${colMetric.key}`;
                          const isSelected = selectedPairKey === pairKey || selectedPairKey === `${colMetric.key}__${rowMetric.key}`;
                          const isDiagonal = rIdx === cIdx;

                          return (
                            <td key={colMetric.key} className="p-1 sm:p-1.5">
                              <button
                                onClick={() => {
                                  setSelectedPairKey(pairKey);
                                }}
                                onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-3 px-1 rounded-lg text-center font-mono font-bold transition-all transform hover:scale-105 active:scale-95 shadow-sm text-[11px] sm:text-xs cursor-pointer ${getCellColor(
                                  val,
                                  isSelected
                                )} ${isDiagonal ? 'opacity-90 font-black' : ''}`}
                                title={`${rowMetric.label} vs ${colMetric.label}: r = ${val.toFixed(4)}`}
                              >
                                {val >= 0 && !isDiagonal ? `+${val.toFixed(2)}` : val.toFixed(2)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Color scale legend */}
          <div className="pt-4 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">Scale:</span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                <span>Negative (-1.0)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block"></span>
                <span>Neutral (0.0)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className={`w-3 h-3 rounded ${colorTheme === 'emerald_rose' ? 'bg-emerald-500' : 'bg-rose-600'} inline-block`}></span>
                <span>Positive (+1.0)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Computed via Pearson sample covariance ($N = {datasetSize}$)
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Bivariate Scatter Plot & Regression Drilldown */}
        <div className="xl:col-span-5 bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between space-y-4">
          {activePair ? (
            <>
              <div>
                {/* Active pair title bar */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Inspected Relationship:
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          activePair.r >= 0.5
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : activePair.r >= 0.2
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : activePair.r > -0.2
                            ? 'bg-slate-700/30 text-slate-300 border-slate-700'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {activePair.strengthLabel}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                      <span>{activePair.varX.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activePair.varY.label}</span>
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Pearson Coeff:</div>
                    <div
                      className={`text-base sm:text-lg font-mono font-black ${
                        activePair.r >= 0.5
                          ? 'text-emerald-400'
                          : activePair.r <= -0.5
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {activePair.r >= 0 ? `+${activePair.r.toFixed(4)}` : activePair.r.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Regression Summary Stats */}
                <div className="grid grid-cols-3 gap-2 my-3">
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Variance ($R^2$)
                    </span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">
                      {(activePair.rSquared * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Significance
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {activePair.pValueText.split(' ')[0]} {activePair.pValueText.split(' ')[1]}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Fitted Slope ($m$)
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-mono truncate">
                      {activePair.slope >= 0 ? `+${activePair.slope.toFixed(2)}` : activePair.slope.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* SVG Scatter Plot & Regression Line */}
                {scatterStats && (
                  <div className="relative bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
                    <svg
                      viewBox={`0 0 ${scatterStats.width} ${scatterStats.height}`}
                      className="w-full h-48 sm:h-52 select-none"
                    >
                      {/* Grid lines */}
                      <line
                        x1={scatterStats.padLeft}
                        y1={scatterStats.padTop}
                        x2={scatterStats.padLeft}
                        y2={scatterStats.height - scatterStats.padBottom}
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <line
                        x1={scatterStats.padLeft}
                        y1={scatterStats.height - scatterStats.padBottom}
                        x2={scatterStats.width - scatterStats.padRight}
                        y2={scatterStats.height - scatterStats.padBottom}
                        stroke="#334155"
                        strokeWidth="1"
                      />

                      {/* X-axis tick labels */}
                      <text
                        x={scatterStats.padLeft}
                        y={scatterStats.height - scatterStats.padBottom + 16}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="start"
                      >
                        {activePair.varX.isCurrency ? '$' : ''}
                        {scatterStats.minX.toLocaleString()}
                        {activePair.varX.isPercent ? '%' : ''}
                      </text>
                      <text
                        x={scatterStats.width - scatterStats.padRight}
                        y={scatterStats.height - scatterStats.padBottom + 16}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {activePair.varX.isCurrency ? '$' : ''}
                        {scatterStats.maxX.toLocaleString()}
                        {activePair.varX.isPercent ? '%' : ''}
                      </text>

                      {/* Y-axis tick labels */}
                      <text
                        x={scatterStats.padLeft - 8}
                        y={scatterStats.padTop + 10}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {activePair.varY.isCurrency ? '$' : ''}
                        {scatterStats.maxY.toLocaleString()}
                        {activePair.varY.isPercent ? '%' : ''}
                      </text>
                      <text
                        x={scatterStats.padLeft - 8}
                        y={scatterStats.height - scatterStats.padBottom}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {activePair.varY.isCurrency ? '$' : ''}
                        {scatterStats.minY.toLocaleString()}
                        {activePair.varY.isPercent ? '%' : ''}
                      </text>

                      {/* Axis Titles */}
                      <text
                        x={scatterStats.padLeft + scatterStats.plotWidth / 2}
                        y={scatterStats.height - 10}
                        fill="#cbd5e1"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {activePair.varX.label} ({activePair.varX.unit})
                      </text>

                      {/* Scatter data points */}
                      {scatterStats.pts.map((pt) => {
                        const cx = scatterStats.toSvgX(pt.x);
                        const cy = scatterStats.toSvgY(pt.y);
                        const isHovered = hoveredPoint && hoveredPoint.id === pt.id;
                        return (
                          <circle
                            key={pt.id}
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 6 : 3.5}
                            fill={isHovered ? '#38bdf8' : '#818cf8'}
                            fillOpacity={isHovered ? 1 : 0.65}
                            stroke={isHovered ? '#ffffff' : '#4f46e5'}
                            strokeWidth={isHovered ? 2 : 1}
                            className="transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}

                      {/* Fitted linear regression line */}
                      <line
                        x1={scatterStats.regP1.x}
                        y1={scatterStats.regP1.y}
                        x2={scatterStats.regP2.x}
                        y2={scatterStats.regP2.y}
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                      />
                    </svg>

                    {/* Point hover tooltip */}
                    {hoveredPoint && (
                      <div className="absolute top-2 right-2 bg-slate-900/95 border border-slate-700 rounded-lg p-2 text-[11px] shadow-lg backdrop-blur-sm pointer-events-none">
                        <div className="text-slate-400 font-mono">Row #{hoveredPoint.id}</div>
                        <div className="text-slate-200">
                          {activePair.varX.shortLabel}:{' '}
                          <span className="font-bold text-white">
                            {activePair.varX.isCurrency ? '$' : ''}
                            {hoveredPoint.x.toLocaleString()}
                            {activePair.varX.isPercent ? '%' : ''}
                          </span>
                        </div>
                        <div className="text-slate-200">
                          {activePair.varY.shortLabel}:{' '}
                          <span className="font-bold text-white">
                            {activePair.varY.isCurrency ? '$' : ''}
                            {hoveredPoint.y.toLocaleString()}
                            {activePair.varY.isPercent ? '%' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Analytical & Business Insight Box */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Strategic Business Takeaway:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activePair.insight}
                </p>
                <div className="pt-1 text-[11px] text-slate-400 font-mono">
                  Equation: y = {activePair.slope >= 0 ? `+${activePair.slope.toFixed(2)}` : activePair.slope.toFixed(2)}x {activePair.intercept >= 0 ? `+ ${activePair.intercept.toFixed(2)}` : `- ${Math.abs(activePair.intercept).toFixed(2)}`}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span>Select a cell from the correlation matrix on the left.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Top Correlated Metric Pairs Rankings */}
      <div className="border-t border-slate-800 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Highest Ranked Metric Relationships (Sorted by Correlation Magnitude $|r|$)
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to load into scatter plot
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topPairs.slice(0, 6).map((pair) => {
            const pairKey = `${pair.varX.key}__${pair.varY.key}`;
            const isSelected = selectedPairKey === pairKey || selectedPairKey === `${pair.varY.key}__${pair.varX.key}`;
            const isPos = pair.r >= 0;

            return (
              <button
                key={pairKey}
                onClick={() => setSelectedPairKey(pairKey)}
                className={`p-3 rounded-xl text-left border transition active:scale-95 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{pair.varX.shortLabel}</span>
                    <span className="text-slate-500">&harr;</span>
                    <span>{pair.varY.shortLabel}</span>
                  </div>
                  <span
                    className={`text-xs font-mono font-black ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? `+${pair.r.toFixed(4)}` : pair.r.toFixed(4)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {/* Visual mini bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${
                        isPos ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(pair.r) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{pair.strengthLabel.split('(')[0]}</span>
                    <span className="font-mono text-indigo-300">R² = {(pair.rSquared * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
