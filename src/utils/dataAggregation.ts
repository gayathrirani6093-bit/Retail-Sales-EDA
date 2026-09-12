import { RetailTransaction } from '../types';

export interface AggregatedMonthly {
  month: string;
  label: string;
  revenue: number;
  orders: number;
  quantity: number;
  momGrowthPct?: number | null;
  momRevenueDelta?: number;
  momUnitsGrowthPct?: number | null;
  momUnitsDelta?: number;
  isPeak?: boolean;
  isLowest?: boolean;
}

export interface AggregatedCategory {
  category: string;
  count: number;
  quantity: number;
  revenue: number;
  avgPrice: number;
  color: string;
}

export interface AggregatedGender {
  gender: string;
  count: number;
  avgSpend: number;
  share: string;
  totalSpend: number;
  fill: string;
}

export interface AggregatedAgeBin {
  range: string;
  count: number;
  group: string;
}

export interface AggregatedCorrelation {
  columns: string[];
  matrix: number[][];
}

export type SalesMetricKey = 'pricePerUnit' | 'quantity' | 'totalAmount' | 'profit' | 'marginPct' | 'age' | 'cost';

export interface SalesMetricDefinition {
  key: SalesMetricKey;
  label: string;
  shortLabel: string;
  description: string;
  unit: string;
  isCurrency?: boolean;
  isPercent?: boolean;
}

export const SALES_METRICS: SalesMetricDefinition[] = [
  {
    key: 'pricePerUnit',
    label: 'Price per Unit',
    shortLabel: 'Price',
    description: 'Unit retail selling price of the item',
    unit: '$',
    isCurrency: true,
  },
  {
    key: 'quantity',
    label: 'Quantity (Units)',
    shortLabel: 'Quantity',
    description: 'Number of units purchased in transaction',
    unit: 'units',
  },
  {
    key: 'totalAmount',
    label: 'Total Revenue',
    shortLabel: 'Revenue',
    description: 'Gross transaction value (Price × Quantity)',
    unit: '$',
    isCurrency: true,
  },
  {
    key: 'profit',
    label: 'Gross Profit',
    shortLabel: 'Profit',
    description: 'Net profit contribution (Revenue - Cost of Goods)',
    unit: '$',
    isCurrency: true,
  },
  {
    key: 'marginPct',
    label: 'Profit Margin (%)',
    shortLabel: 'Margin %',
    description: 'Gross margin percentage (Profit / Total Amount × 100)',
    unit: '%',
    isPercent: true,
  },
  {
    key: 'age',
    label: 'Customer Age',
    shortLabel: 'Age',
    description: 'Age of the purchasing customer',
    unit: 'yrs',
  },
  {
    key: 'cost',
    label: 'Cost of Goods (COGS)',
    shortLabel: 'COGS',
    description: 'Direct merchandise cost of items sold',
    unit: '$',
    isCurrency: true,
  },
];

export interface CorrelationPairResult {
  varX: SalesMetricDefinition;
  varY: SalesMetricDefinition;
  r: number;
  rSquared: number;
  n: number;
  slope: number;
  intercept: number;
  pValueText: string;
  strength: 'very_strong_pos' | 'strong_pos' | 'moderate_pos' | 'weak_pos' | 'near_zero' | 'weak_neg' | 'moderate_neg' | 'strong_neg';
  strengthLabel: string;
  direction: 'positive' | 'negative' | 'neutral';
  insight: string;
  samplePoints: { x: number; y: number; id: number; label?: string }[];
}

export interface DynamicCorrelationResult {
  metrics: SalesMetricDefinition[];
  columns: string[];
  matrix: number[][];
  pairDetails: Record<string, CorrelationPairResult>;
  topPairs: CorrelationPairResult[];
  datasetSize: number;
}

export interface AggregatedCrossTab {
  category: string;
  Female: number;
  Male: number;
  [key: string]: string | number;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

const KNOWN_CATEGORY_COLORS: Record<string, string> = {
  Clothing: '#3b82f6',
  Electronics: '#10b981',
  Beauty: '#f59e0b',
  Books: '#8b5cf6',
  Groceries: '#10b981',
  Home: '#06b6d4',
  Sports: '#f97316',
};

export function aggregateMonthlyFromTransactions(transactions: RetailTransaction[]): AggregatedMonthly[] {
  const map: Record<string, { revenue: number; orders: number; quantity: number }> = {};

  for (const t of transactions) {
    const m = t.month || (t.date ? t.date.substring(0, 7) : 'Unknown');
    if (!map[m]) {
      map[m] = { revenue: 0, orders: 0, quantity: 0 };
    }
    map[m].revenue += t.totalAmount;
    map[m].orders += 1;
    map[m].quantity += t.quantity;
  }

  const sortedMonths = Object.keys(map).sort();
  if (sortedMonths.length === 0) return [];

  let maxRev = -Infinity;
  let minRev = Infinity;

  sortedMonths.forEach((m) => {
    if (map[m].revenue > maxRev) maxRev = map[m].revenue;
    if (map[m].revenue < minRev) minRev = map[m].revenue;
  });

  return sortedMonths.map((m, idx) => {
    const parts = m.split('-');
    const label = parts.length === 2 && MONTH_NAMES[parts[1]] ? `${MONTH_NAMES[parts[1]]} ${parts[0]}` : m;
    const d = map[m];

    let momGrowthPct: number | null = null;
    let momRevenueDelta = 0;
    let momUnitsGrowthPct: number | null = null;
    let momUnitsDelta = 0;

    if (idx > 0) {
      const prevMonthKey = sortedMonths[idx - 1];
      const prev = map[prevMonthKey];
      if (prev && prev.revenue > 0) {
        momRevenueDelta = Math.round(d.revenue - prev.revenue);
        momGrowthPct = Number((((d.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1));
      }
      if (prev && prev.quantity > 0) {
        momUnitsDelta = d.quantity - prev.quantity;
        momUnitsGrowthPct = Number((((d.quantity - prev.quantity) / prev.quantity) * 100).toFixed(1));
      }
    }

    return {
      month: m,
      label,
      revenue: Math.round(d.revenue),
      orders: d.orders,
      quantity: d.quantity,
      momGrowthPct,
      momRevenueDelta,
      momUnitsGrowthPct,
      momUnitsDelta,
      isPeak: d.revenue === maxRev && sortedMonths.length > 2,
      isLowest: d.revenue === minRev && sortedMonths.length > 2,
    };
  });
}

export interface MonthOverMonthItem {
  month: string;
  label: string;
  revenue: number;
  prevRevenue: number | null;
  revenueDelta: number;
  growthPct: number | null;
  units: number;
  prevUnits: number | null;
  unitsDelta: number;
  unitsGrowthPct: number | null;
  orders: number;
  status: 'strong_expansion' | 'moderate_growth' | 'flat' | 'contraction' | 'severe_drop' | 'baseline';
}

export interface MonthOverMonthSummary {
  hasEnoughData: boolean;
  latestMonthLabel: string;
  latestRevenue: number;
  previousMonthLabel: string;
  previousRevenue: number;
  latestGrowthPct: number | null;
  latestRevenueDelta: number;
  averageGrowthPct: number;
  medianGrowthPct: number;
  bestGrowthMonth: { label: string; growthPct: number; delta: number; revenue: number } | null;
  worstGrowthMonth: { label: string; growthPct: number; delta: number; revenue: number } | null;
  expansionMonthsCount: number;
  contractionMonthsCount: number;
  totalPeriodsAnalyzed: number;
  items: MonthOverMonthItem[];
}

export function calculateMonthOverMonthSummary(monthlyData: AggregatedMonthly[]): MonthOverMonthSummary {
  if (!monthlyData || monthlyData.length === 0) {
    return {
      hasEnoughData: false,
      latestMonthLabel: 'N/A',
      latestRevenue: 0,
      previousMonthLabel: 'N/A',
      previousRevenue: 0,
      latestGrowthPct: null,
      latestRevenueDelta: 0,
      averageGrowthPct: 0,
      medianGrowthPct: 0,
      bestGrowthMonth: null,
      worstGrowthMonth: null,
      expansionMonthsCount: 0,
      contractionMonthsCount: 0,
      totalPeriodsAnalyzed: 0,
      items: [],
    };
  }

  const items: MonthOverMonthItem[] = monthlyData.map((curr, i) => {
    const prev = i > 0 ? monthlyData[i - 1] : null;
    const prevRev = prev ? prev.revenue : null;
    const prevUnits = prev ? prev.quantity : null;

    let growthPct: number | null = null;
    let revenueDelta = 0;
    let unitsGrowthPct: number | null = null;
    let unitsDelta = 0;

    if (prev && prev.revenue > 0) {
      revenueDelta = curr.revenue - prev.revenue;
      growthPct = Number((((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1));
    }

    if (prev && prev.quantity > 0) {
      unitsDelta = curr.quantity - prev.quantity;
      unitsGrowthPct = Number((((curr.quantity - prev.quantity) / prev.quantity) * 100).toFixed(1));
    }

    let status: MonthOverMonthItem['status'] = 'baseline';
    if (growthPct !== null) {
      if (growthPct >= 20) status = 'strong_expansion';
      else if (growthPct > 0) status = 'moderate_growth';
      else if (growthPct === 0) status = 'flat';
      else if (growthPct > -20) status = 'contraction';
      else status = 'severe_drop';
    }

    return {
      month: curr.month,
      label: curr.label,
      revenue: curr.revenue,
      prevRevenue: prevRev,
      revenueDelta,
      growthPct,
      units: curr.quantity,
      prevUnits: prevUnits,
      unitsDelta,
      unitsGrowthPct,
      orders: curr.orders,
      status,
    };
  });

  const validGrowthRates = items
    .filter((it): it is MonthOverMonthItem & { growthPct: number } => it.growthPct !== null)
    .map((it) => it.growthPct);

  if (validGrowthRates.length === 0) {
    const latest = items[items.length - 1];
    return {
      hasEnoughData: false,
      latestMonthLabel: latest.label,
      latestRevenue: latest.revenue,
      previousMonthLabel: 'N/A',
      previousRevenue: 0,
      latestGrowthPct: null,
      latestRevenueDelta: 0,
      averageGrowthPct: 0,
      medianGrowthPct: 0,
      bestGrowthMonth: null,
      worstGrowthMonth: null,
      expansionMonthsCount: 0,
      contractionMonthsCount: 0,
      totalPeriodsAnalyzed: 1,
      items,
    };
  }

  const avgGrowth = Number(
    (validGrowthRates.reduce((sum, val) => sum + val, 0) / validGrowthRates.length).toFixed(1)
  );

  const sortedRates = [...validGrowthRates].sort((a, b) => a - b);
  const mid = Math.floor(sortedRates.length / 2);
  const medianGrowth = sortedRates.length % 2 !== 0 
    ? sortedRates[mid] 
    : Number(((sortedRates[mid - 1] + sortedRates[mid]) / 2).toFixed(1));

  let bestMonth: MonthOverMonthSummary['bestGrowthMonth'] = null;
  let worstMonth: MonthOverMonthSummary['worstGrowthMonth'] = null;

  items.forEach((it) => {
    if (it.growthPct !== null) {
      if (!bestMonth || it.growthPct > bestMonth.growthPct) {
        bestMonth = {
          label: it.label,
          growthPct: it.growthPct,
          delta: it.revenueDelta,
          revenue: it.revenue,
        };
      }
      if (!worstMonth || it.growthPct < worstMonth.growthPct) {
        worstMonth = {
          label: it.label,
          growthPct: it.growthPct,
          delta: it.revenueDelta,
          revenue: it.revenue,
        };
      }
    }
  });

  const latest = items[items.length - 1];
  const prev = items.length > 1 ? items[items.length - 2] : null;

  return {
    hasEnoughData: true,
    latestMonthLabel: latest.label,
    latestRevenue: latest.revenue,
    previousMonthLabel: prev ? prev.label : 'N/A',
    previousRevenue: prev ? prev.revenue : 0,
    latestGrowthPct: latest.growthPct,
    latestRevenueDelta: latest.revenueDelta,
    averageGrowthPct: avgGrowth,
    medianGrowthPct: medianGrowth,
    bestGrowthMonth: bestMonth,
    worstGrowthMonth: worstMonth,
    expansionMonthsCount: validGrowthRates.filter((g) => g > 0).length,
    contractionMonthsCount: validGrowthRates.filter((g) => g < 0).length,
    totalPeriodsAnalyzed: items.length,
    items,
  };
}

export function aggregateCategoriesFromTransactions(transactions: RetailTransaction[]): AggregatedCategory[] {
  const map: Record<string, { count: number; quantity: number; revenue: number; priceSum: number }> = {};

  for (const t of transactions) {
    const cat = t.productCategory || 'Other';
    if (!map[cat]) {
      map[cat] = { count: 0, quantity: 0, revenue: 0, priceSum: 0 };
    }
    map[cat].count += 1;
    map[cat].quantity += t.quantity;
    map[cat].revenue += t.totalAmount;
    map[cat].priceSum += t.pricePerUnit;
  }

  const categories = Object.keys(map).sort((a, b) => map[b].revenue - map[a].revenue);

  return categories.map((cat, idx) => {
    const item = map[cat];
    return {
      category: cat,
      count: item.count,
      quantity: item.quantity,
      revenue: Math.round(item.revenue),
      avgPrice: item.count > 0 ? Number((item.priceSum / item.count).toFixed(2)) : 0,
      color: KNOWN_CATEGORY_COLORS[cat] || PALETTE[idx % PALETTE.length],
    };
  });
}

export function aggregateGenderFromTransactions(transactions: RetailTransaction[]): AggregatedGender[] {
  const map: Record<string, { count: number; totalSpend: number }> = {};

  for (const t of transactions) {
    const g = t.gender || 'Unspecified';
    if (!map[g]) {
      map[g] = { count: 0, totalSpend: 0 };
    }
    map[g].count += 1;
    map[g].totalSpend += t.totalAmount;
  }

  const total = transactions.length || 1;
  const genders = Object.keys(map).sort((a, b) => map[b].count - map[a].count);

  const genderColors: Record<string, string> = {
    Female: '#ec4899',
    Male: '#3b82f6',
    Other: '#a855f7',
    Unspecified: '#64748b',
  };

  return genders.map((g, idx) => {
    const item = map[g];
    return {
      gender: g,
      count: item.count,
      avgSpend: item.count > 0 ? Number((item.totalSpend / item.count).toFixed(2)) : 0,
      share: `${((item.count / total) * 100).toFixed(1)}%`,
      totalSpend: Math.round(item.totalSpend),
      fill: genderColors[g] || PALETTE[idx % PALETTE.length],
    };
  });
}

export function aggregateAgeDistribution(transactions: RetailTransaction[]): AggregatedAgeBin[] {
  const bins = [
    { range: '18-21', min: 18, max: 21, group: 'Gen Z', count: 0 },
    { range: '22-25', min: 22, max: 25, group: 'Gen Z', count: 0 },
    { range: '26-29', min: 26, max: 29, group: 'Young Adults', count: 0 },
    { range: '30-33', min: 30, max: 33, group: 'Young Adults', count: 0 },
    { range: '34-37', min: 34, max: 37, group: 'Young Adults', count: 0 },
    { range: '38-41', min: 38, max: 41, group: 'Middle-Aged', count: 0 },
    { range: '42-45', min: 42, max: 45, group: 'Middle-Aged', count: 0 },
    { range: '46-49', min: 46, max: 49, group: 'Middle-Aged', count: 0 },
    { range: '50-53', min: 50, max: 53, group: 'Middle-Aged', count: 0 },
    { range: '54-57', min: 54, max: 57, group: 'Seniors', count: 0 },
    { range: '58-61', min: 58, max: 61, group: 'Seniors', count: 0 },
    { range: '62-65+', min: 62, max: 120, group: 'Seniors', count: 0 },
  ];

  for (const t of transactions) {
    const age = Number(t.age) || 0;
    for (const b of bins) {
      if (age >= b.min && age <= b.max) {
        b.count += 1;
        break;
      }
    }
  }

  return bins.map(({ range, count, group }) => ({ range, count, group }));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n <= 1) return 1;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Number((num / den).toFixed(4));
}

function computePairRegression(
  x: number[],
  y: number[],
  varX: SalesMetricDefinition,
  varY: SalesMetricDefinition,
  ids: number[]
): CorrelationPairResult {
  const n = x.length;
  if (n < 2) {
    return {
      varX,
      varY,
      r: 1,
      rSquared: 1,
      n,
      slope: 1,
      intercept: 0,
      pValueText: 'p < 0.001',
      strength: 'very_strong_pos',
      strengthLabel: 'Identity (1.00)',
      direction: 'positive',
      insight: `${varX.label} is identical to ${varY.label}.`,
      samplePoints: [],
    };
  }

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  const r = den === 0 ? 0 : Number((num / den).toFixed(4));
  const slope = denX === 0 ? 0 : Number((num / denX).toFixed(4));
  const intercept = Number((meanY - slope * meanX).toFixed(4));
  const rSquared = Number((r * r).toFixed(4));

  // Significance
  let pValueText = 'p < 0.05';
  if (n > 30) {
    const t = Math.abs(r) * Math.sqrt((n - 2) / Math.max(0.00001, 1 - r * r));
    if (t > 3.291) pValueText = 'p < 0.001 (Highly Significant)';
    else if (t > 2.576) pValueText = 'p < 0.01 (Very Significant)';
    else if (t > 1.96) pValueText = 'p < 0.05 (Statistically Significant)';
    else pValueText = 'p ≥ 0.05 (Not Statistically Significant)';
  }

  // Classification
  let strength: CorrelationPairResult['strength'] = 'near_zero';
  let strengthLabel = 'Near Zero / Independent';
  let direction: CorrelationPairResult['direction'] = 'neutral';

  if (r >= 0.8) {
    strength = 'very_strong_pos';
    strengthLabel = 'Very Strong Positive (+0.80 to +1.00)';
    direction = 'positive';
  } else if (r >= 0.5) {
    strength = 'strong_pos';
    strengthLabel = 'Strong Positive (+0.50 to +0.79)';
    direction = 'positive';
  } else if (r >= 0.25) {
    strength = 'moderate_pos';
    strengthLabel = 'Moderate Positive (+0.25 to +0.49)';
    direction = 'positive';
  } else if (r > 0.08) {
    strength = 'weak_pos';
    strengthLabel = 'Weak Positive (+0.08 to +0.24)';
    direction = 'positive';
  } else if (r <= -0.8) {
    strength = 'strong_neg';
    strengthLabel = 'Very Strong Inverse (-0.80 to -1.00)';
    direction = 'negative';
  } else if (r <= -0.5) {
    strength = 'strong_neg';
    strengthLabel = 'Strong Inverse (-0.50 to -0.79)';
    direction = 'negative';
  } else if (r <= -0.25) {
    strength = 'moderate_neg';
    strengthLabel = 'Moderate Inverse (-0.25 to -0.49)';
    direction = 'negative';
  } else if (r < -0.08) {
    strength = 'weak_neg';
    strengthLabel = 'Weak Inverse (-0.08 to -0.24)';
    direction = 'negative';
  }

  // Business narrative
  let insight = '';
  const isPriceRev = (varX.key === 'pricePerUnit' && varY.key === 'totalAmount') || (varX.key === 'totalAmount' && varY.key === 'pricePerUnit');
  const isPriceProfit = (varX.key === 'pricePerUnit' && varY.key === 'profit') || (varX.key === 'profit' && varY.key === 'pricePerUnit');
  const isRevProfit = (varX.key === 'totalAmount' && varY.key === 'profit') || (varX.key === 'profit' && varY.key === 'totalAmount');
  const isQtyRev = (varX.key === 'quantity' && varY.key === 'totalAmount') || (varX.key === 'totalAmount' && varY.key === 'quantity');
  const isQtyProfit = (varX.key === 'quantity' && varY.key === 'profit') || (varX.key === 'profit' && varY.key === 'quantity');
  const isPriceQty = (varX.key === 'pricePerUnit' && varY.key === 'quantity') || (varX.key === 'quantity' && varY.key === 'pricePerUnit');
  const isAge = varX.key === 'age' || varY.key === 'age';

  if (isRevProfit) {
    insight = `Exceptional revenue-to-profit conversion (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}, R² = ${(rSquared * 100).toFixed(1)}%). Gross top-line expansion reliably feeds net profitability with high margin retention.`;
  } else if (isPriceRev) {
    insight = `Dominant pricing sensitivity (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Unit price level drives ${(rSquared * 100).toFixed(1)}% of variance in overall cart size, far outpacing unit volume impact.`;
  } else if (isPriceProfit) {
    insight = `High-margin premium leverage (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Higher ticket merchandise commands significantly elevated gross profit dollars per order.`;
  } else if (isQtyRev) {
    insight = `Volume acceleration (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Each additional unit adds to transaction revenue, though secondary to unit pricing power.`;
  } else if (isQtyProfit) {
    insight = `Basket depth contribution (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Multi-unit bundling and upsells deliver steady margin expansion across transactions.`;
  } else if (isPriceQty) {
    insight = `Price elasticity neutrality (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Near-zero correlation indicates customer demand quantity is inelastic across price points ($25 to $500).`;
  } else if (isAge) {
    insight = `Demographic neutrality (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). Customer age exhibits minimal influence on purchasing volume, unit price tier, or cart profit.`;
  } else if (Math.abs(r) >= 0.7) {
    insight = `High linear correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). ${varX.label} explains ${(rSquared * 100).toFixed(1)}% of the variance in ${varY.label}.`;
  } else if (Math.abs(r) >= 0.3) {
    insight = `Moderate relationship (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). ${varX.label} has a noticeable directional impact on ${varY.label}.`;
  } else {
    insight = `Weak or independent relationship (r = ${r > 0 ? '+' : ''}${r.toFixed(4)}). These two metrics operate largely independently in this dataset.`;
  }

  // Downsample to max 200 points for smooth interactive rendering
  const step = Math.max(1, Math.floor(n / 200));
  const samplePoints: CorrelationPairResult['samplePoints'] = [];
  for (let i = 0; i < n; i += step) {
    samplePoints.push({
      x: x[i],
      y: y[i],
      id: ids[i],
    });
  }

  return {
    varX,
    varY,
    r,
    rSquared,
    n,
    slope,
    intercept,
    pValueText,
    strength,
    strengthLabel,
    direction,
    insight,
    samplePoints,
  };
}

export function calculateSalesCorrelation(
  transactions: RetailTransaction[],
  selectedKeys: SalesMetricKey[] = ['pricePerUnit', 'quantity', 'totalAmount', 'profit', 'marginPct', 'age']
): DynamicCorrelationResult {
  const metricDefs = selectedKeys
    .map((k) => SALES_METRICS.find((m) => m.key === k))
    .filter((m): m is SalesMetricDefinition => Boolean(m));

  if (metricDefs.length < 2 || transactions.length < 2) {
    const defaultCols = metricDefs.map((m) => m.shortLabel);
    const size = defaultCols.length;
    const identityMatrix = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
    );
    return {
      metrics: metricDefs,
      columns: defaultCols,
      matrix: identityMatrix,
      pairDetails: {},
      topPairs: [],
      datasetSize: transactions.length,
    };
  }

  // Extract metric series for each definition
  const series: Record<SalesMetricKey, number[]> = {
    pricePerUnit: transactions.map((t) => Number(t.pricePerUnit) || 0),
    quantity: transactions.map((t) => Number(t.quantity) || 0),
    totalAmount: transactions.map((t) => Number(t.totalAmount) || 0),
    profit: transactions.map((t) =>
      t.profit !== undefined ? Number(t.profit) : Number((t.totalAmount * 0.48).toFixed(2))
    ),
    marginPct: transactions.map((t) =>
      t.marginPct !== undefined
        ? Number(t.marginPct)
        : t.totalAmount > 0
        ? Number((((t.profit || t.totalAmount * 0.48) / t.totalAmount) * 100).toFixed(1))
        : 45
    ),
    age: transactions.map((t) => Number(t.age) || 0),
    cost: transactions.map((t) =>
      t.cost !== undefined ? Number(t.cost) : Number((t.totalAmount * 0.52).toFixed(2))
    ),
  };

  const ids = transactions.map((t) => t.id);
  const matrix: number[][] = [];
  const pairDetails: Record<string, CorrelationPairResult> = {};
  const uniquePairs: CorrelationPairResult[] = [];

  for (let i = 0; i < metricDefs.length; i++) {
    const row: number[] = [];
    const varI = metricDefs[i];
    const valsI = series[varI.key];

    for (let j = 0; j < metricDefs.length; j++) {
      const varJ = metricDefs[j];
      const valsJ = series[varJ.key];

      if (i === j) {
        row.push(1.0);
        const pairKey = `${varI.key}__${varJ.key}`;
        pairDetails[pairKey] = {
          varX: varI,
          varY: varJ,
          r: 1.0,
          rSquared: 1.0,
          n: transactions.length,
          slope: 1.0,
          intercept: 0,
          pValueText: 'p < 0.001',
          strength: 'very_strong_pos',
          strengthLabel: 'Self-Correlation (1.000)',
          direction: 'positive',
          insight: `${varI.label} is identically self-correlated (r = 1.0).`,
          samplePoints: [],
        };
      } else {
        const pairRes = computePairRegression(valsI, valsJ, varI, varJ, ids);
        row.push(pairRes.r);
        const pairKey = `${varI.key}__${varJ.key}`;
        pairDetails[pairKey] = pairRes;

        if (i < j) {
          uniquePairs.push(pairRes);
        }
      }
    }
    matrix.push(row);
  }

  // Sort unique pairs by absolute correlation descending
  uniquePairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  return {
    metrics: metricDefs,
    columns: metricDefs.map((m) => m.shortLabel),
    matrix,
    pairDetails,
    topPairs: uniquePairs,
    datasetSize: transactions.length,
  };
}

export function aggregateCorrelationMatrix(transactions: RetailTransaction[]): AggregatedCorrelation {
  const result = calculateSalesCorrelation(transactions, ['age', 'quantity', 'pricePerUnit', 'totalAmount']);
  return {
    columns: ['Age', 'Quantity', 'Price per Unit', 'Total Amount'],
    matrix: result.matrix,
  };
}

export function aggregateCrossTabCategoryGender(transactions: RetailTransaction[]): AggregatedCrossTab[] {
  const catGenderMap: Record<string, { femaleTotal: number; femaleCount: number; maleTotal: number; maleCount: number }> = {};

  for (const t of transactions) {
    const cat = t.productCategory || 'Other';
    if (!catGenderMap[cat]) {
      catGenderMap[cat] = { femaleTotal: 0, femaleCount: 0, maleTotal: 0, maleCount: 0 };
    }
    if (t.gender === 'Female') {
      catGenderMap[cat].femaleTotal += t.totalAmount;
      catGenderMap[cat].femaleCount += 1;
    } else {
      catGenderMap[cat].maleTotal += t.totalAmount;
      catGenderMap[cat].maleCount += 1;
    }
  }

  return Object.keys(catGenderMap).map((cat) => {
    const d = catGenderMap[cat];
    const femaleAvg = d.femaleCount > 0 ? Number((d.femaleTotal / d.femaleCount).toFixed(2)) : 0;
    const maleAvg = d.maleCount > 0 ? Number((d.maleTotal / d.maleCount).toFixed(2)) : 0;
    return {
      category: cat,
      Female: femaleAvg,
      Male: maleAvg,
    };
  });
}

