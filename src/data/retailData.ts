import { RetailTransaction, SummaryStatistics } from '../types';

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateRetailData(): RetailTransaction[] {
  const rng = mulberry32(42);
  const categories: ('Beauty' | 'Clothing' | 'Electronics')[] = ['Beauty', 'Clothing', 'Electronics'];
  const prices = [25, 30, 50, 100, 300, 500];
  const genders: ('Female' | 'Male')[] = ['Female', 'Male'];
  const startDate = new Date('2023-01-01T00:00:00Z').getTime();
  const endDate = new Date('2023-12-31T23:59:59Z').getTime();

  const data: RetailTransaction[] = [];

  for (let i = 1; i <= 1000; i++) {
    const dateMs = startDate + rng() * (endDate - startDate);
    const d = new Date(dateMs);
    const dateStr = d.toISOString().split('T')[0];
    const gender = genders[Math.floor(rng() * 2)];
    const age = Math.floor(18 + rng() * 47); // 18 to 64
    const productCategory = categories[Math.floor(rng() * categories.length)];
    const quantity = Math.floor(1 + rng() * 4); // 1 to 4
    const pricePerUnit = prices[Math.floor(rng() * prices.length)];
    const totalAmount = quantity * pricePerUnit;
    const categoryMargin: Record<string, number> = {
      Beauty: 0.62,
      Clothing: 0.50,
      Electronics: 0.36,
    };
    const baseMargin = categoryMargin[productCategory] || 0.48;
    // Add small realistic noise per transaction (+/- 5%)
    const marginVariation = (rng() - 0.5) * 0.08;
    const margin = Math.max(0.15, Math.min(0.85, baseMargin + marginVariation));
    const unitCost = Number((pricePerUnit * (1 - margin)).toFixed(2));
    const cost = Number((unitCost * quantity).toFixed(2));
    const profit = Number((totalAmount - cost).toFixed(2));
    const marginPct = Number(((profit / totalAmount) * 100).toFixed(1));
    const month = dateStr.substring(0, 7);
    const monthNum = Number(dateStr.substring(5, 7));
    const quarter = `Q${Math.ceil(monthNum / 3)}`;

    data.push({
      id: i,
      date: dateStr,
      custId: `CUST${String(i).padStart(3, '0')}`,
      gender,
      age,
      productCategory,
      quantity,
      pricePerUnit,
      totalAmount,
      cost,
      profit,
      marginPct,
      month,
      quarter,
    });
  }

  return data;
}

export const RETAIL_TRANSACTIONS: RetailTransaction[] = generateRetailData();

export const STATS: Record<'totalAmount' | 'quantity' | 'pricePerUnit' | 'age', SummaryStatistics> = {
  totalAmount: {
    mean: 408.98,
    median: 150,
    mode: 100,
    std: 498.16,
    min: 25,
    max: 2000,
  },
  quantity: {
    mean: 2.50,
    median: 3,
    mode: 1,
    std: 1.12,
    min: 1,
    max: 4,
  },
  pricePerUnit: {
    mean: 165.00,
    median: 50,
    mode: 30,
    std: 175.23,
    min: 25,
    max: 500,
  },
  age: {
    mean: 40.83,
    median: 41,
    mode: 33,
    std: 13.66,
    min: 18,
    max: 64,
  },
};

export const MONTHLY_SALES = [
  { month: '2023-01', label: 'Jan 2023', revenue: 40110, orders: 82, quantity: 207 },
  { month: '2023-02', label: 'Feb 2023', revenue: 30920, orders: 78, quantity: 197 },
  { month: '2023-03', label: 'Mar 2023', revenue: 43060, orders: 96, quantity: 265, isPeak: true },
  { month: '2023-04', label: 'Apr 2023', revenue: 37625, orders: 80, quantity: 201 },
  { month: '2023-05', label: 'May 2023', revenue: 37135, orders: 75, quantity: 181 },
  { month: '2023-06', label: 'Jun 2023', revenue: 27885, orders: 88, quantity: 206 },
  { month: '2023-07', label: 'Jul 2023', revenue: 33185, orders: 94, quantity: 234 },
  { month: '2023-08', label: 'Aug 2023', revenue: 21050, orders: 80, quantity: 189, isLowest: true },
  { month: '2023-09', label: 'Sep 2023', revenue: 40310, orders: 86, quantity: 222 },
  { month: '2023-10', label: 'Oct 2023', revenue: 33960, orders: 83, quantity: 207 },
  { month: '2023-11', label: 'Nov 2023', revenue: 40320, orders: 82, quantity: 210 },
  { month: '2023-12', label: 'Dec 2023', revenue: 23415, orders: 76, quantity: 180 },
];

export const QUARTERLY_SALES = [
  { quarter: 'Q1 2023', revenue: 114090, orders: 256, percent: 27.9 },
  { quarter: 'Q2 2023', revenue: 102645, orders: 243, percent: 25.1 },
  { quarter: 'Q3 2023', revenue: 94545, orders: 260, percent: 23.1 },
  { quarter: 'Q4 2023', revenue: 97695, orders: 241, percent: 23.9 },
];

export const CATEGORY_BREAKDOWN = [
  { category: 'Clothing', count: 346, quantity: 848, revenue: 142700, avgPrice: 168.28, color: '#3b82f6' },
  { category: 'Electronics', count: 327, quantity: 831, revenue: 134385, avgPrice: 161.71, color: '#10b981' },
  { category: 'Beauty', count: 327, quantity: 820, revenue: 131890, avgPrice: 160.84, color: '#f59e0b' },
];

export const GENDER_BREAKDOWN = [
  { gender: 'Male', count: 518, percent: 51.8, totalSpend: 209075, avgSpend: 403.62, color: '#6366f1' },
  { gender: 'Female', count: 482, percent: 48.2, totalSpend: 199900, avgSpend: 414.73, color: '#ec4899' },
];

export const CORRELATION_MATRIX = {
  columns: ['Age', 'Quantity', 'Price per Unit', 'Total Amount'],
  matrix: [
    [1.0000, -0.0022, 0.0638, 0.0491],
    [-0.0022, 1.0000, -0.0170, 0.3401],
    [0.0638, -0.0170, 1.0000, 0.8528],
    [0.0491, 0.3401, 0.8528, 1.0000],
  ],
};

export const AGE_GROUPS = [
  { group: '18-25 (Gen Z)', count: 184, percent: 18.4, revenue: 74215, avgSpend: 403.34 },
  { group: '26-35 (Young Adults)', count: 216, percent: 21.6, revenue: 91430, avgSpend: 423.29 },
  { group: '36-50 (Middle Aged)', count: 312, percent: 31.2, revenue: 125860, avgSpend: 403.40 },
  { group: '51-64 (Seniors)', count: 288, percent: 28.8, revenue: 117470, avgSpend: 407.88 },
];
