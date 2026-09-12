import React, { useState, useMemo } from 'react';
import { RetailTransaction } from '../types';
import { 
  detectSalesAnomalies, 
  SalesAnomaly, 
  AnomalyReport 
} from '../utils/anomalyDetection';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  CheckCircle2,
  Bell,
  Eye,
  X
} from 'lucide-react';

interface DataAnomalyAlertsProps {
  transactions: RetailTransaction[];
  onSelectPeriod?: (period: string) => void;
}

export const DataAnomalyAlerts: React.FC<DataAnomalyAlertsProps> = ({
  transactions,
  onSelectPeriod,
}) => {
  const [sensitivity, setSensitivity] = useState<'standard' | 'sensitive'>('standard');
  const [filterType, setFilterType] = useState<'all' | 'spike' | 'drop'>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [expandedAnomalyId, setExpandedAnomalyId] = useState<string | null>(null);

  // Compute anomaly report dynamically whenever transactions or sensitivity change
  const report: AnomalyReport = useMemo(() => {
    return detectSalesAnomalies(transactions, sensitivity);
  }, [transactions, sensitivity]);

  const filteredAnomalies = useMemo(() => {
    if (filterType === 'all') return report.anomalies;
    return report.anomalies.filter((a) => a.type === filterType);
  }, [report.anomalies, filterType]);

  // If dismissed, show a compact restore pill so the user can easily re-open
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>
            Anomaly Alerts minimized ({report.anomalies.length} detected: {report.totalSpikes} spike{report.totalSpikes !== 1 ? 's' : ''}, {report.totalDrops} drop{report.totalDrops !== 1 ? 's' : ''}).
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-1 font-semibold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Alerts</span>
        </button>
      </div>
    );
  }

  // If no anomalies are detected
  if (report.anomalies.length === 0) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Data Anomaly Monitor:</strong> No abnormal sales spikes or drops detected in current dataset (all periods within baseline limits).
          </span>
        </div>
        <button
          onClick={() => setSensitivity(sensitivity === 'standard' ? 'sensitive' : 'standard')}
          className="text-[11px] font-medium text-emerald-200 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-1 rounded-lg transition"
        >
          Sensitivity: {sensitivity === 'standard' ? 'Standard' : 'High'}
        </button>
      </div>
    );
  }

  return (
    <div
      id="data-anomaly-alert-section"
      className="rounded-2xl border border-amber-500/30 bg-slate-950/80 backdrop-blur-md shadow-lg shadow-amber-500/5 overflow-hidden transition-all duration-300"
    >
      {/* Alert Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Automated Sales Anomaly Alert
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {report.anomalies.length} Outlier{report.anomalies.length !== 1 ? 's' : ''} Detected ({report.criticalCount} High-Severity)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              Unusual Revenue Spikes & Drops Identified
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Statistical baseline: <strong>${report.baselineMean.toLocaleString()}/mo</strong> avg (σ = ±${report.baselineStdDev.toLocaleString()}). Highlights periods deviating significantly from standard sales patterns.
            </p>
          </div>
        </div>

        {/* Controls: Filter Pills, Sensitivity, Collapse & Dismiss */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({report.anomalies.length})
            </button>
            <button
              onClick={() => setFilterType('spike')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                filterType === 'spike'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Spikes ({report.totalSpikes})
            </button>
            <button
              onClick={() => setFilterType('drop')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                filterType === 'drop'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Drops ({report.totalDrops})
            </button>
          </div>

          {/* Sensitivity Toggle */}
          <button
            onClick={() => setSensitivity(sensitivity === 'standard' ? 'sensitive' : 'standard')}
            title="Toggle between standard 1.5σ and high 1.2σ anomaly detection sensitivity"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Sensitivity: <strong className="text-amber-300">{sensitivity === 'standard' ? '1.5σ' : '1.2σ'}</strong></span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title={isCollapsed ? 'Expand anomaly breakdown' : 'Collapse anomaly breakdown'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Dismiss Alert Banner */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Dismiss anomaly notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Anomaly Cards Grid */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnomalies.map((anomaly) => {
              const isSpike = anomaly.type === 'spike';
              const isHighSeverity = anomaly.severity === 'high';
              const isExpanded = expandedAnomalyId === anomaly.id;

              return (
                <div
                  key={anomaly.id}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSpike
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isSpike
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isSpike ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isSpike ? 'SALES SPIKE' : 'SALES DROP'} ({anomaly.deviationPct >= 0 ? '+' : ''}
                          {anomaly.deviationPct.toFixed(1)}%)
                        </span>
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isHighSeverity
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {anomaly.severity} Severity
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{anomaly.periodLabel}</span>
                    </h4>

                    {/* Core Metric Comparison */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Actual Revenue</div>
                        <div
                          className={`text-base font-extrabold ${
                            isSpike ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ${anomaly.metricValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Expected Baseline</div>
                        <div className="text-base font-extrabold text-slate-300">
                          ${anomaly.expectedValue.toLocaleString()}
                        </div>
                      </div>
                      <div className="pt-1 border-t border-slate-800 col-span-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Z-Score: <strong className="text-slate-200">{anomaly.zScore >= 0 ? '+' : ''}{anomaly.zScore.toFixed(2)}σ</strong></span>
                        {anomaly.momChangePct !== undefined && (
                          <span>MoM Delta: <strong className={anomaly.momChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {anomaly.momChangePct >= 0 ? '+' : ''}{anomaly.momChangePct.toFixed(1)}%
                          </strong></span>
                        )}
                        <span>{anomaly.transactionCount} orders</span>
                      </div>
                    </div>

                    {/* Diagnostic Summary */}
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {anomaly.diagnosticNote}
                    </p>

                    {/* Key Category Drivers */}
                    {anomaly.primaryDrivers.length > 0 && (
                      <div className="mt-2.5">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>Category Breakdown</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {anomaly.primaryDrivers.slice(0, 3).map((driver) => (
                            <span
                              key={driver.category}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                            >
                              <strong className="text-slate-200">{driver.category}:</strong> ${driver.revenue.toLocaleString()} (
                              <span className={driver.categoryDeviationPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {driver.categoryDeviationPct >= 0 ? '+' : ''}{driver.categoryDeviationPct.toFixed(0)}%
                              </span>)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable Recommendation */}
                    {isExpanded && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/20 text-xs">
                        <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px] mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Actionable Recommendation</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {anomaly.recommendedAction}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedAnomalyId(isExpanded ? null : anomaly.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 font-medium transition"
                    >
                      {isExpanded ? 'Hide Details' : 'View Action Plan'}
                    </button>

                    {onSelectPeriod && (
                      <button
                        onClick={() => onSelectPeriod(anomaly.period)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                      >
                        <span>Inspect in Chart</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anomaly Methodological Context Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Calculated using Gaussian Z-score thresholds and Month-over-Month (MoM) volumetric deviation against the current active cohort.
              </span>
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
              Algorithm: Rolling σ-Delta + MoM
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
