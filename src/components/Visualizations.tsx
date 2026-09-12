import React from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  MONTHLY_SALES,
  CATEGORY_BREAKDOWN,
  CORRELATION_MATRIX,
} from '../data/retailData';
import { ExportChartMenu } from './ExportChartMenu';

// Custom Tooltip component for dark aesthetic
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '', formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 pointer-events-none z-50">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const val = entry.value;
          const displayVal = formatter ? formatter(val, entry.name, entry) : `${prefix}${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name || 'Value'}:</span>
              </span>
              <span className="font-semibold text-slate-100">{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export interface MonthlyTrendChartProps {
  data?: Array<{
    month: string;
    label: string;
    revenue: number;
    orders: number;
    quantity: number;
    momGrowthPct?: number | null;
    momRevenueDelta?: number;
    isPeak?: boolean;
    isLowest?: boolean;
  }>;
  title?: string;
  subtitle?: string;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data = MONTHLY_SALES,
  title = 'Figure 1: Monthly Retail Revenue Trajectory (Jan – Dec 2023)',
  subtitle = 'Hover over any data point to inspect exact revenue, transaction volume, and items sold.',
}) => {
  // Find peak and lowest in current data
  let peakVal = -Infinity;
  let lowestVal = Infinity;
  let peakLabel = '';
  let lowestLabel = '';

  data.forEach((d) => {
    const shortLabel = d.label ? d.label.split(' ')[0] : 'Period';
    if (d.revenue > peakVal) {
      peakVal = d.revenue;
      peakLabel = `${shortLabel} ($${d.revenue.toLocaleString()})`;
    }
    if (d.revenue < lowestVal) {
      lowestVal = d.revenue;
      lowestLabel = `${shortLabel} ($${d.revenue.toLocaleString()})`;
    }
  });

  return (
    <div id="monthly-trend-chart-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-slate-200">
            {title}
          </h4>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {data.length > 2 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Peak: {peakLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Trough: {lowestLabel}
              </span>
            </div>
          )}
          <ExportChartMenu
            targetElementId="monthly-trend-chart-container"
            filename="monthly_retail_revenue_trajectory"
            chartTitle="Figure 1: Monthly Retail Revenue Trajectory"
          />
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
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
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload;
                const isPositive = point.momGrowthPct !== null && point.momGrowthPct !== undefined && point.momGrowthPct >= 0;
                return (
                  <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 pointer-events-none z-50 min-w-[200px]">
                    <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Monthly Revenue:</span>
                      <span className="font-semibold text-slate-100">${point.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Total Volume:</span>
                      <span className="font-semibold text-slate-100">{point.quantity.toLocaleString()} units</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Transactions:</span>
                      <span className="font-semibold text-slate-100">{point.orders} orders</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                      <span className="text-slate-400">MoM Sales Growth:</span>
                      {point.momGrowthPct !== null && point.momGrowthPct !== undefined ? (
                        <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{point.momGrowthPct.toFixed(1)}%
                          {point.momRevenueDelta ? ` (${point.momRevenueDelta > 0 ? '+' : ''}$${point.momRevenueDelta.toLocaleString()})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Baseline (N/A)</span>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Monthly Revenue"
              stroke="#38bdf8"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2, fill: '#0284c7' }}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.revenue === peakVal && data.length > 2) {
                  return (
                    <circle
                      key={`dot-${payload.month}`}
                      cx={cx}
                      cy={cy}
                      r={6.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                if (payload.revenue === lowestVal && data.length > 2) {
                  return (
                    <circle
                      key={`dot-${payload.month}`}
                      cx={cx}
                      cy={cy}
                      r={6.5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${payload.month}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export interface CustomerDistChartProps {
  genderData?: any[];
  ageData?: any[];
}

export const CustomerDistChart: React.FC<CustomerDistChartProps> = ({ genderData: customGenderData, ageData: customAgeData }) => {
  const defaultAgeDistributionData = [
    { range: '18-21', count: 76, group: 'Gen Z' },
    { range: '22-25', count: 108, group: 'Gen Z' },
    { range: '26-29', count: 112, group: 'Young Adults' },
    { range: '30-33', count: 104, group: 'Young Adults' },
    { range: '34-37', count: 98, group: 'Young Adults' },
    { range: '38-41', count: 102, group: 'Middle-Aged' },
    { range: '42-45', count: 95, group: 'Middle-Aged' },
    { range: '46-49', count: 88, group: 'Middle-Aged' },
    { range: '50-53', count: 101, group: 'Middle-Aged' },
    { range: '54-57', count: 96, group: 'Seniors' },
    { range: '58-61', count: 92, group: 'Seniors' },
    { range: '62-64', count: 88, group: 'Seniors' },
  ];

  const ageDistributionData = customAgeData || defaultAgeDistributionData;

  const defaultGenderSpendingData = [
    { gender: 'Female', avgSpend: 414.73, count: 482, share: '48.2%', totalSpend: 199900, fill: '#ec4899' },
    { gender: 'Male', avgSpend: 403.62, count: 518, share: '51.8%', totalSpend: 209075, fill: '#3b82f6' },
  ];

  const genderSpendingData = customGenderData || defaultGenderSpendingData;

  return (
    <div id="customer-dist-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Age Distribution with Tooltips */}
      <div id="customer-age-chart-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Customer Age Distribution (18–64)</h4>
            <p className="text-xs text-slate-400">Interactive histogram showing customer counts per 3-year age bin.</p>
          </div>
          <ExportChartMenu
            targetElementId="customer-age-chart-container"
            filename="customer_age_distribution"
            chartTitle="Customer Age Distribution (18–64)"
          />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistributionData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(val: number, _name: string, entry: any) => {
                      return `${val} shoppers (${entry.payload.group})`;
                    }}
                  />
                }
              />
              <Bar dataKey="count" name="Shoppers" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {ageDistributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count >= 105 ? '#818cf8' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gender Spending Comparison with Tooltips */}
      <div id="gender-spending-chart-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Average Spending per Transaction by Gender</h4>
            <p className="text-xs text-slate-400">Compares mean order values and total volume between genders.</p>
          </div>
          <ExportChartMenu
            targetElementId="gender-spending-chart-container"
            filename="gender_spending_comparison"
            chartTitle="Average Spending per Transaction by Gender"
          />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genderSpendingData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="gender" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                domain={[300, 450]}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(val: number, name: string, entry: any) => {
                      if (name === 'Average Spend') {
                        return `$${val.toFixed(2)} (${entry.payload.share} of total, ${entry.payload.count} orders)`;
                      }
                      return val;
                    }}
                  />
                }
              />
              <Bar dataKey="avgSpend" name="Average Spend" radius={[6, 6, 0, 0]}>
                {genderSpendingData.map((entry) => (
                  <Cell key={`gender-${entry.gender}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export interface CategoryRevenueChartProps {
  data?: any[];
}

export const CategoryRevenueChart: React.FC<CategoryRevenueChartProps> = ({ data: customCategoryData }) => {
  const categoryData = (customCategoryData || CATEGORY_BREAKDOWN).map((c: any) => ({
    category: c.category,
    revenue: c.revenue,
    quantity: c.quantity,
    count: c.count,
    avgPrice: c.avgPrice,
    color: c.color,
  }));

  return (
    <div id="category-revenue-charts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Category Revenue Chart */}
      <div id="cat-revenue-chart-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Total Revenue by Product Category ($)</h4>
            <p className="text-xs text-slate-400">Clothing leads with $142,700 (34.9% share of total revenue).</p>
          </div>
          <ExportChartMenu
            targetElementId="cat-revenue-chart-container"
            filename="category_total_revenue"
            chartTitle="Total Revenue by Product Category"
          />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(val: number, _name: string, entry: any) => {
                      return `$${val.toLocaleString()} (${entry.payload.count} orders, avg unit $${entry.payload.avgPrice})`;
                    }}
                  />
                }
              />
              <Bar dataKey="revenue" name="Total Revenue" radius={[0, 6, 6, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={`cat-rev-${entry.category}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Quantity Sold Chart */}
      <div id="cat-units-chart-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Total Units Sold by Product Category</h4>
            <p className="text-xs text-slate-400">Even volume distribution across apparel, tech, and cosmetics.</p>
          </div>
          <ExportChartMenu
            targetElementId="cat-units-chart-container"
            filename="category_units_sold"
            chartTitle="Total Units Sold by Product Category"
          />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickFormatter={(val) => `${val} units`}
              />
              <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(val: number, _name: string, entry: any) => {
                      return `${val} units (${entry.payload.count} orders, ${(val / (entry.payload.count || 1)).toFixed(2)}/cart)`;
                    }}
                  />
                }
              />
              <Bar dataKey="quantity" name="Units Sold" fill="#6366f1" radius={[0, 6, 6, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={`cat-qty-${entry.category}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export interface CorrelationHeatmapProps {
  data?: {
    columns: string[];
    matrix: number[][];
  };
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ data: customData }) => {
  const { columns, matrix } = customData || CORRELATION_MATRIX;

  const getBgColor = (val: number) => {
    if (val === 1.0) return 'bg-rose-600 text-white';
    if (val > 0.8) return 'bg-rose-500/90 text-white font-bold';
    if (val > 0.3) return 'bg-amber-500/80 text-white font-semibold';
    if (val > 0.05) return 'bg-slate-700 text-slate-200';
    if (val >= -0.05) return 'bg-slate-800 text-slate-300';
    return 'bg-blue-600 text-white';
  };

  return (
    <div id="correlation-heatmap-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Pearson Correlation Heatmap (Seaborn style: cmap='coolwarm')
          </h4>
          <p className="text-xs text-slate-400">
            Hover over cells to inspect pair relationship. Critical takeaway: Unit Price strongly determines Total Spend ($r = +0.8528$).
          </p>
        </div>
        <ExportChartMenu
          targetElementId="correlation-heatmap-container"
          filename="pearson_correlation_heatmap"
          chartTitle="Pearson Correlation Matrix (Heatmap)"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2.5 text-left text-slate-400 font-medium">Variable</th>
              {columns.map((col) => (
                <th key={col} className="p-2.5 font-semibold text-slate-200 border-b border-slate-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={columns[rIdx]} className="border-b border-slate-800/80">
                <td className="p-2.5 text-left font-semibold text-slate-300 whitespace-nowrap">
                  {columns[rIdx]}
                </td>
                {row.map((val, cIdx) => (
                  <td key={cIdx} className="p-2">
                    <div
                      className={`py-2.5 px-3 rounded-lg transition-transform hover:scale-105 cursor-pointer shadow-sm ${getBgColor(val)}`}
                      title={`${columns[rIdx]} vs ${columns[cIdx]}: r = ${val.toFixed(4)}`}
                    >
                      {val.toFixed(4)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-400 flex flex-wrap gap-4 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500"></span> Very Strong Positive (0.80 - 1.00)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500"></span> Moderate Positive (0.30 - 0.79)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800"></span> Negligible / Near Zero (-0.10 - 0.10)
        </span>
      </div>
    </div>
  );
};

export interface AdditionalVizChartProps {
  data?: Array<{
    category: string;
    Female: number;
    Male: number;
    [key: string]: string | number;
  }>;
}

export const AdditionalVizChart: React.FC<AdditionalVizChartProps> = ({ data: customData }) => {
  const defaultData = [
    { category: 'Beauty', Female: 400.32, Male: 406.41 },
    { category: 'Clothing', Female: 418.63, Male: 406.07 },
    { category: 'Electronics', Female: 425.46, Male: 398.24 },
  ];

  const data = customData && customData.length > 0 ? customData : defaultData;

  return (
    <div id="additional-viz-container" className="bg-slate-900/90 text-white rounded-xl p-5 border border-slate-700 shadow-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Cross-Segment Insight: Average Spend ($) by Category & Gender
          </h4>
          <p className="text-xs text-slate-400">
            Interactive clustered bar chart: Female shoppers lead in Electronics (+$27.22) and Clothing (+$12.56).
          </p>
        </div>
        <ExportChartMenu
          targetElementId="additional-viz-container"
          filename="cross_segment_category_gender_spend"
          chartTitle="Cross-Segment Insight: Average Spend ($) by Category & Gender"
        />
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              domain={[350, 450]}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(val: number, name: string) => `$${val.toFixed(2)} per order (${name})`}
                />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
