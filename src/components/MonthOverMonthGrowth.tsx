import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Table as TableIcon,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  AggregatedMonthly,
  calculateMonthOverMonthSummary,
  MonthOverMonthItem,
} from '../utils/dataAggregation';
import { ExportChartMenu } from './ExportChartMenu';

interface MonthOverMonthGrowthProps {
  monthlyData: AggregatedMonthly[];
  datasetName?: string;
  onSelectMonth?: (monthKey: string) => void;
}

export const MonthOverMonthGrowth: React.FC<MonthOverMonthGrowthProps> = ({
  monthlyData,
  datasetName,
  onSelectMonth,
}) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'units'>('revenue');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const summary = useMemo(() => {
    return calculateMonthOverMonthSummary(monthlyData);
  }, [monthlyData]);

  const chartData = useMemo(() => {
    return summary.items.map((item) => {
      const growthValue = metricMode === 'revenue' ? item.growthPct : item.unitsGrowthPct;
      const deltaValue = metricMode === 'revenue' ? item.revenueDelta : item.unitsDelta;
      const currentValue = metricMode === 'revenue' ? item.revenue : item.units;
      const prevValue = metricMode === 'revenue' ? item.prevRevenue : item.prevUnits;

      return {
        month: item.month,
        label: item.label,
        growth: growthValue,
        delta: deltaValue,
        current: currentValue,
        previous: prevValue,
        orders: item.orders,
        status: item.status,
      };
    });
  }, [summary, metricMode]);

  // If there's less than 2 months of data in the current filter
  if (!summary.hasEnoughData || summary.items.length < 2) {
    return (
      <div
        id="mom-growth-chart-container"
        className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Month-over-Month (MoM) Sales Growth
              </h3>
              <p className="text-xs text-slate-400">
                Velocity and percentage acceleration tracking across consecutive monthly accounting periods.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5 text-xs text-slate-300">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              Insufficient time series window for Month-over-Month calculation
            </p>
            <p className="text-slate-400 leading-relaxed">
              Month-over-Month (MoM) growth percentage requires at least 2 consecutive monthly cycles to compute delta velocity.
              The active date filter currently contains only{' '}
              <strong className="text-blue-400">{summary.items.length} month</strong> ({summary.latestMonthLabel}).
              Please expand your Date Range filter or choose a broader preset (such as &quot;All Dates&quot; or &quot;Full Year&quot;) to inspect MoM trajectory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const latestGrowth = metricMode === 'revenue' 
    ? summary.latestGrowthPct 
    : (summary.items[summary.items.length - 1]?.unitsGrowthPct ?? null);

  const latestDelta = metricMode === 'revenue'
    ? summary.latestRevenueDelta
    : (summary.items[summary.items.length - 1]?.unitsDelta ?? 0);

  const isLatestPositive = latestGrowth !== null && latestGrowth >= 0;

  return (
    <div
      id="mom-growth-chart-container"
      className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-6"
    >
      {/* Component Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Percent className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Velocity & Momentum Analysis
            </span>
            {datasetName && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {datasetName}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
            Month-over-Month (MoM) Sales Growth
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential percentage expansion and volumetric shifts across {summary.totalPeriodsAnalyzed} consecutive monthly cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Revenue vs Units Metric Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMetricMode('revenue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                metricMode === 'revenue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue ($)
            </button>
            <button
              onClick={() => setMetricMode('units')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                metricMode === 'units'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Volume (Units)
            </button>
          </div>

          {/* Chart vs Table View Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('chart')}
              title="View Visual Growth Bars"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'chart'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="View Detailed Monthly Ledger Table"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <ExportChartMenu
            targetElementId="mom-growth-chart-container"
            filename="month_over_month_sales_growth_report"
            chartTitle="Month-over-Month (MoM) Sales Growth Analysis"
          />
        </div>
      </div>

      {/* 4 Quick Executive Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Tile 1: Latest MoM Growth */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Latest MoM Rate</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {summary.latestMonthLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                latestGrowth === null
                  ? 'text-slate-300'
                  : isLatestPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {latestGrowth === null
                ? 'N/A'
                : `${isLatestPositive ? '+' : ''}${latestGrowth.toFixed(1)}%`}
            </span>
            {latestGrowth !== null && (
              <span
                className={`flex items-center text-xs font-semibold ${
                  isLatestPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isLatestPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {latestGrowth !== null ? (
              <>
                <strong className={isLatestPositive ? 'text-emerald-300' : 'text-rose-300'}>
                  {isLatestPositive ? '+' : ''}
                  {metricMode === 'revenue'
                    ? `$${latestDelta.toLocaleString()}`
                    : `${latestDelta.toLocaleString()} units`}
                </strong>{' '}
                vs {summary.previousMonthLabel}
              </>
            ) : (
              'Baseline period'
            )}
          </p>
        </div>

        {/* Tile 2: Average Monthly Velocity */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Average Monthly Growth</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                summary.averageGrowthPct >= 0 ? 'text-indigo-400' : 'text-amber-400'
              }`}
            >
              {summary.averageGrowthPct >= 0 ? '+' : ''}
              {summary.averageGrowthPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-400">{summary.expansionMonthsCount}</strong> expansions
            {' vs '}
            <strong className="text-rose-400">{summary.contractionMonthsCount}</strong> contractions
          </p>
        </div>

        {/* Tile 3: Best Expansion Month */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Peak Acceleration</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {summary.bestGrowthMonth ? `+${summary.bestGrowthMonth.growthPct}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {summary.bestGrowthMonth?.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {summary.bestGrowthMonth
              ? `+$${summary.bestGrowthMonth.delta.toLocaleString()} dollar surge`
              : 'N/A'}
          </p>
        </div>

        {/* Tile 4: Steepest Contraction */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Steepest Contraction</span>
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-rose-400">
              {summary.worstGrowthMonth ? `${summary.worstGrowthMonth.growthPct}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {summary.worstGrowthMonth?.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {summary.worstGrowthMonth
              ? `-$${Math.abs(summary.worstGrowthMonth.delta).toLocaleString()} dip`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Primary Display: Interactive Recharts Bar Chart */}
      {viewMode === 'chart' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              Positive MoM Growth (Expansion)
              <span className="w-2.5 h-2.5 rounded bg-rose-500 ml-3"></span>
              Negative MoM Growth (Contraction)
            </span>
            <span className="text-[11px] text-slate-500">
              Threshold Line: 0.0% Baseline
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="2 2" />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    const isPositive = data.growth !== null && data.growth >= 0;

                    return (
                      <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs text-slate-200 min-w-[200px] backdrop-blur-sm">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                          <strong className="text-white text-sm">{data.label}</strong>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              data.growth === null
                                ? 'bg-slate-800 text-slate-400'
                                : isPositive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {data.growth === null
                              ? 'Baseline'
                              : `${isPositive ? '+' : ''}${data.growth.toFixed(1)}% MoM`}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Current Month:</span>
                            <span className="font-mono font-semibold text-white">
                              {metricMode === 'revenue'
                                ? `$${data.current.toLocaleString()}`
                                : `${data.current.toLocaleString()} units`}
                            </span>
                          </div>

                          {data.previous !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Previous Month:</span>
                              <span className="font-mono text-slate-300">
                                {metricMode === 'revenue'
                                  ? `$${data.previous.toLocaleString()}`
                                  : `${data.previous.toLocaleString()} units`}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between border-t border-slate-800/80 pt-1 mt-1">
                            <span className="text-slate-400">Net Delta:</span>
                            <span
                              className={`font-mono font-bold ${
                                isPositive ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {data.delta > 0 ? '+' : ''}
                              {metricMode === 'revenue'
                                ? `$${data.delta.toLocaleString()}`
                                : `${data.delta.toLocaleString()} units`}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>Transaction Count:</span>
                            <span>{data.orders} orders</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="growth"
                  name="MoM Growth %"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                >
                  {chartData.map((entry, index) => {
                    const color =
                      entry.growth === null
                        ? '#64748b' // Baseline
                        : entry.growth >= 0
                        ? '#10b981' // Emerald
                        : '#f43f5e'; // Rose
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* Detailed Monthly Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Monthly Momentum Ledger
          </h4>
          <span className="text-[11px] text-slate-500">
            Click on any month to inspect on trajectory chart
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Accounting Period</th>
                <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                <th className="py-2.5 px-3 text-right">Prior Period</th>
                <th className="py-2.5 px-3 text-right">Net Dollar Variance</th>
                <th className="py-2.5 px-3 text-right">MoM Growth %</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-center">Velocity Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {summary.items.map((row, idx) => {
                const isPositive = row.growthPct !== null && row.growthPct >= 0;
                const isZero = row.growthPct === 0;

                return (
                  <tr
                    key={row.month}
                    onClick={() => onSelectMonth && onSelectMonth(row.month)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono w-4">
                        {idx + 1}.
                      </span>
                      {row.label}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200">
                      ${row.revenue.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {row.prevRevenue !== null ? `$${row.prevRevenue.toLocaleString()}` : '—'}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        row.growthPct === null
                          ? 'text-slate-500'
                          : isPositive
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.growthPct === null
                        ? '—'
                        : `${row.revenueDelta > 0 ? '+' : ''}$${row.revenueDelta.toLocaleString()}`}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {row.growthPct === null ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                          Baseline
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {isPositive ? '+' : ''}
                          {row.growthPct.toFixed(1)}%
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {row.units.toLocaleString()}
                      {row.unitsGrowthPct !== null && (
                        <span
                          className={`ml-1.5 text-[10px] ${
                            row.unitsGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({row.unitsGrowthPct >= 0 ? '+' : ''}
                          {row.unitsGrowthPct.toFixed(0)}%)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {row.status === 'strong_expansion' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Strong Surge (≥20%)
                        </span>
                      )}
                      {row.status === 'moderate_growth' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Moderate Expansion
                        </span>
                      )}
                      {row.status === 'flat' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          Flat
                        </span>
                      )}
                      {row.status === 'contraction' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Contraction
                        </span>
                      )}
                      {row.status === 'severe_drop' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Severe Drop (&lt;-20%)
                        </span>
                      )}
                      {row.status === 'baseline' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                          Initial Period
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
