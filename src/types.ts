export interface RetailTransaction {
  id: number;
  date: string;
  custId: string;
  gender: string;
  age: number;
  productCategory: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  profit?: number;
  cost?: number;
  marginPct?: number;
  discount?: number;
  month: string;
  quarter: string;
}

export interface SummaryStatistics {
  mean: number;
  median: number;
  mode: number;
  std: number;
  min: number;
  max: number;
}

export interface NotebookSection {
  id: number;
  title: string;
  badge: string;
  summary: string;
  markdownExplanation: string;
  pythonCode: string;
  outputType: 'text' | 'table' | 'chart' | 'mixed';
  textOutput?: string;
  tableHeaders?: string[];
  tableRows?: (string | number)[][];
  chartType?: 'monthly_trend' | 'customer_dist' | 'category_revenue' | 'correlation_heatmap' | 'additional_viz';
}

export type ViewTab = 'notebook' | 'dashboard' | 'dataset' | 'submission';
