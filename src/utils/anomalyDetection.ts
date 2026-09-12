import { RetailTransaction } from '../types';

export interface CategoryAnomalyDriver {
  category: string;
  revenue: number;
  pctContribution: number;
  categoryDeviationPct: number;
}

export interface SalesAnomaly {
  id: string;
  period: string; // e.g. "2023-05"
  periodLabel: string; // e.g. "May 2023"
  type: 'spike' | 'drop';
  severity: 'high' | 'medium';
  metricValue: number;
  expectedValue: number;
  deviationPct: number;
  momChangePct?: number;
  zScore: number;
  transactionCount: number;
  avgOrderValue: number;
  primaryDrivers: CategoryAnomalyDriver[];
  headline: string;
  diagnosticNote: string;
  recommendedAction: string;
}

export interface AnomalyReport {
  anomalies: SalesAnomaly[];
  totalSpikes: number;
  totalDrops: number;
  criticalCount: number;
  baselineMean: number;
  baselineStdDev: number;
  analyzedPeriodsCount: number;
  thresholdSensitivity: 'standard' | 'sensitive';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getPeriodLabel(periodKey: string): string {
  // periodKey format: "YYYY-MM" or "MM"
  if (periodKey.includes('-')) {
    const [year, monthStr] = periodKey.split('-');
    const mIdx = parseInt(monthStr, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${MONTH_NAMES[mIdx]} ${year}`;
    }
    return periodKey;
  }
  const mIdx = parseInt(periodKey, 10) - 1;
  if (mIdx >= 0 && mIdx < 12) {
    return MONTH_NAMES[mIdx];
  }
  return periodKey;
}

/**
 * Detects sales anomalies (spikes and drops) in retail transaction datasets.
 * Employs rolling Z-score statistical divergence, % mean variance,
 * and Month-over-Month (MoM) delta analysis.
 */
export function detectSalesAnomalies(
  transactions: RetailTransaction[],
  sensitivity: 'standard' | 'sensitive' = 'standard'
): AnomalyReport {
  if (!transactions || transactions.length === 0) {
    return {
      anomalies: [],
      totalSpikes: 0,
      totalDrops: 0,
      criticalCount: 0,
      baselineMean: 0,
      baselineStdDev: 0,
      analyzedPeriodsCount: 0,
      thresholdSensitivity: sensitivity,
    };
  }

  // 1. Group transactions by period (YYYY-MM)
  const periodMap = new Map<
    string,
    {
      revenue: number;
      orders: number;
      units: number;
      categoryRevenue: Map<string, number>;
    }
  >();

  transactions.forEach((tx) => {
    // tx.date e.g. "2023-05-14"
    const periodKey = tx.date && tx.date.length >= 7 ? tx.date.substring(0, 7) : 'Unknown';
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        revenue: 0,
        orders: 0,
        units: 0,
        categoryRevenue: new Map(),
      });
    }

    const rec = periodMap.get(periodKey)!;
    rec.revenue += tx.totalAmount;
    rec.orders += 1;
    rec.units += tx.quantity;

    const cat = tx.productCategory || 'Uncategorized';
    rec.categoryRevenue.set(cat, (rec.categoryRevenue.get(cat) || 0) + tx.totalAmount);
  });

  const sortedPeriods = Array.from(periodMap.keys()).sort();
  const periodsData = sortedPeriods.map((pKey) => {
    const p = periodMap.get(pKey)!;
    return {
      period: pKey,
      periodLabel: getPeriodLabel(pKey),
      revenue: p.revenue,
      orders: p.orders,
      units: p.units,
      aov: p.orders > 0 ? p.revenue / p.orders : 0,
      categoryRevenue: p.categoryRevenue,
    };
  });

  // Calculate baseline mean and standard deviation of revenue
  const revValues = periodsData.map((p) => p.revenue);
  const n = revValues.length;
  if (n === 0) {
    return {
      anomalies: [],
      totalSpikes: 0,
      totalDrops: 0,
      criticalCount: 0,
      baselineMean: 0,
      baselineStdDev: 0,
      analyzedPeriodsCount: 0,
      thresholdSensitivity: sensitivity,
    };
  }

  const mean = revValues.reduce((sum, v) => sum + v, 0) / n;
  const variance =
    n > 1
      ? revValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  // Calculate category baselines across whole dataset
  const catOverallMap = new Map<string, number>();
  transactions.forEach((tx) => {
    const cat = tx.productCategory || 'Uncategorized';
    catOverallMap.set(cat, (catOverallMap.get(cat) || 0) + tx.totalAmount);
  });
  const catAvgPerPeriod = new Map<string, number>();
  catOverallMap.forEach((totalCatRev, cat) => {
    catAvgPerPeriod.set(cat, totalCatRev / n);
  });

  // Sensitivity thresholds
  // Standard: z >= 1.5 or |dev%| >= 28% or |mom| >= 30%
  // Sensitive: z >= 1.2 or |dev%| >= 18% or |mom| >= 20%
  const zSpikeThreshold = sensitivity === 'sensitive' ? 1.2 : 1.5;
  const zDropThreshold = sensitivity === 'sensitive' ? -1.2 : -1.5;
  const pctDevThreshold = sensitivity === 'sensitive' ? 18 : 28;
  const momThreshold = sensitivity === 'sensitive' ? 20 : 30;

  const anomalies: SalesAnomaly[] = [];

  for (let i = 0; i < periodsData.length; i++) {
    const p = periodsData[i];
    const zScore = stdDev > 0 ? (p.revenue - mean) / stdDev : 0;
    const deviationPct = mean > 0 ? ((p.revenue - mean) / mean) * 100 : 0;

    let momChangePct: number | undefined = undefined;
    if (i > 0 && periodsData[i - 1].revenue > 0) {
      momChangePct =
        ((p.revenue - periodsData[i - 1].revenue) / periodsData[i - 1].revenue) * 100;
    }

    const isSpike =
      zScore >= zSpikeThreshold ||
      deviationPct >= pctDevThreshold ||
      (momChangePct !== undefined && momChangePct >= momThreshold);

    const isDrop =
      zScore <= zDropThreshold ||
      deviationPct <= -pctDevThreshold ||
      (momChangePct !== undefined && momChangePct <= -momThreshold);

    if (isSpike || isDrop) {
      const type: 'spike' | 'drop' = isSpike ? 'spike' : 'drop';
      const absZ = Math.abs(zScore);
      const absDev = Math.abs(deviationPct);
      const severity: 'high' | 'medium' =
        absZ >= 1.8 || absDev >= 35 || (momChangePct !== undefined && Math.abs(momChangePct) >= 40)
          ? 'high'
          : 'medium';

      // Category drivers
      const primaryDrivers: CategoryAnomalyDriver[] = [];
      p.categoryRevenue.forEach((catRev, cat) => {
        const catBaseline = catAvgPerPeriod.get(cat) || (mean / 3);
        const catDev = catBaseline > 0 ? ((catRev - catBaseline) / catBaseline) * 100 : 0;
        const contrib = p.revenue > 0 ? (catRev / p.revenue) * 100 : 0;

        primaryDrivers.push({
          category: cat,
          revenue: catRev,
          pctContribution: contrib,
          categoryDeviationPct: catDev,
        });
      });

      // Sort drivers by deviation impact
      primaryDrivers.sort((a, b) =>
        type === 'spike'
          ? b.categoryDeviationPct - a.categoryDeviationPct
          : a.categoryDeviationPct - b.categoryDeviationPct
      );

      const topDriver = primaryDrivers[0];
      const topDriverDesc = topDriver
        ? `${topDriver.category} (${topDriver.categoryDeviationPct >= 0 ? '+' : ''}${topDriver.categoryDeviationPct.toFixed(1)}% vs norm)`
        : 'All categories';

      // Generate context-aware diagnostic notes and recommendations
      let headline = '';
      let diagnosticNote = '';
      let recommendedAction = '';

      if (type === 'spike') {
        headline = `Unusual Sales Spike in ${p.periodLabel} (+${deviationPct.toFixed(1)}% vs Baseline)`;
        diagnosticNote = `Total revenue surged to $${p.revenue.toLocaleString()} (baseline: $${Math.round(mean).toLocaleString()}) with a Z-score of +${zScore.toFixed(2)}σ. ${
          momChangePct !== undefined
            ? `MoM velocity increased by +${momChangePct.toFixed(1)}%. `
            : ''
        }Chiefly propelled by anomalous surge in ${topDriverDesc}.`;
        recommendedAction = `Investigate seasonal campaigns, marketing promotions, or inventory replenishment that fueled this lift. Ensure sufficient supply buffer and staff capacity for this recurring cycle next year.`;
      } else {
        headline = `Unusual Sales Contraction in ${p.periodLabel} (${deviationPct.toFixed(1)}% vs Baseline)`;
        diagnosticNote = `Revenue fell sharply to $${p.revenue.toLocaleString()} (baseline: $${Math.round(mean).toLocaleString()}) with a negative deviation of ${deviationPct.toFixed(1)}% (Z = ${zScore.toFixed(2)}σ). ${
          momChangePct !== undefined
            ? `MoM contraction reached ${momChangePct.toFixed(1)}%. `
            : ''
        }Heaviest dip observed in ${topDriverDesc}.`;
        recommendedAction = `Audit potential stockouts, product listing issues, or external market downturns during this period. Implement targeted promotional discounts or re-engagement offers to mitigate similar dips.`;
      }

      anomalies.push({
        id: `anomaly-${p.period}`,
        period: p.period,
        periodLabel: p.periodLabel,
        type,
        severity,
        metricValue: p.revenue,
        expectedValue: Math.round(mean),
        deviationPct,
        momChangePct,
        zScore,
        transactionCount: p.orders,
        avgOrderValue: p.aov,
        primaryDrivers,
        headline,
        diagnosticNote,
        recommendedAction,
      });
    }
  }

  // Sort anomalies chronologically
  anomalies.sort((a, b) => a.period.localeCompare(b.period));

  const totalSpikes = anomalies.filter((a) => a.type === 'spike').length;
  const totalDrops = anomalies.filter((a) => a.type === 'drop').length;
  const criticalCount = anomalies.filter((a) => a.severity === 'high').length;

  return {
    anomalies,
    totalSpikes,
    totalDrops,
    criticalCount,
    baselineMean: Math.round(mean),
    baselineStdDev: Math.round(stdDev),
    analyzedPeriodsCount: periodsData.length,
    thresholdSensitivity: sensitivity,
  };
}
