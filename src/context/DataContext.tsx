import React, { createContext, useContext, useState, useMemo } from 'react';
import { RetailTransaction, SummaryStatistics } from '../types';
import { generateRetailData } from '../data/retailData';
import { parseRetailCsv } from '../utils/csvParser';
import {
  aggregateMonthlyFromTransactions,
  aggregateCategoriesFromTransactions,
  aggregateGenderFromTransactions,
  aggregateAgeDistribution,
  aggregateCorrelationMatrix,
  aggregateCrossTabCategoryGender,
  AggregatedMonthly,
  AggregatedCategory,
  AggregatedGender,
  AggregatedAgeBin,
  AggregatedCorrelation,
  AggregatedCrossTab,
} from '../utils/dataAggregation';

function calculateStats(values: number[]): SummaryStatistics {
  if (values.length === 0) {
    return { mean: 0, median: 0, mode: 0, std: 0, min: 0, max: 0 };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = sorted[0];
  for (const v of sorted) {
    frequency[v] = (frequency[v] || 0) + 1;
    if (frequency[v] > maxFreq) {
      maxFreq = frequency[v];
      mode = v;
    }
  }

  const variance =
    values.length > 1
      ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1)
      : 0;
  const std = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    mode: Number(mode.toFixed(2)),
    std: Number(std.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

export interface DataContextType {
  transactions: RetailTransaction[];
  datasetName: string;
  isCustomData: boolean;
  totalRowCount: number;
  monthlySales: AggregatedMonthly[];
  categoryBreakdown: AggregatedCategory[];
  genderBreakdown: AggregatedGender[];
  ageDistribution: AggregatedAgeBin[];
  correlationMatrix: AggregatedCorrelation;
  crossTabCategoryGender: AggregatedCrossTab[];
  stats: Record<'totalAmount' | 'quantity' | 'pricePerUnit' | 'age', SummaryStatistics>;
  uploadCsv: (csvContent: string, fileName: string) => { success: boolean; message: string; count?: number };
  resetToDefault: () => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
}

const defaultData = generateRetailData();

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<RetailTransaction[]>(defaultData);
  const [datasetName, setDatasetName] = useState<string>('Standard Retail Sales Dataset (1,000 Records)');
  const [isCustomData, setIsCustomData] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const monthlySales = useMemo(() => aggregateMonthlyFromTransactions(transactions), [transactions]);
  const categoryBreakdown = useMemo(() => aggregateCategoriesFromTransactions(transactions), [transactions]);
  const genderBreakdown = useMemo(() => aggregateGenderFromTransactions(transactions), [transactions]);
  const ageDistribution = useMemo(() => aggregateAgeDistribution(transactions), [transactions]);
  const correlationMatrix = useMemo(() => aggregateCorrelationMatrix(transactions), [transactions]);
  const crossTabCategoryGender = useMemo(() => aggregateCrossTabCategoryGender(transactions), [transactions]);

  const stats = useMemo(() => {
    return {
      totalAmount: calculateStats(transactions.map((t) => t.totalAmount)),
      quantity: calculateStats(transactions.map((t) => t.quantity)),
      pricePerUnit: calculateStats(transactions.map((t) => t.pricePerUnit)),
      age: calculateStats(transactions.map((t) => t.age)),
    };
  }, [transactions]);

  const uploadCsv = (csvContent: string, fileName: string) => {
    const result = parseRetailCsv(csvContent);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    setTransactions(result.transactions);
    setDatasetName(fileName || 'Custom Imported Dataset');
    setIsCustomData(true);
    return {
      success: true,
      message: `Successfully loaded ${result.rowCount.toLocaleString()} rows from ${fileName}.`,
      count: result.rowCount,
    };
  };

  const resetToDefault = () => {
    setTransactions(defaultData);
    setDatasetName('Standard Retail Sales Dataset (1,000 Records)');
    setIsCustomData(false);
  };

  return (
    <DataContext.Provider
      value={{
        transactions,
        datasetName,
        isCustomData,
        totalRowCount: transactions.length,
        monthlySales,
        categoryBreakdown,
        genderBreakdown,
        ageDistribution,
        correlationMatrix,
        crossTabCategoryGender,
        stats,
        uploadCsv,
        resetToDefault,
        isUploadModalOpen,
        setIsUploadModalOpen,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
