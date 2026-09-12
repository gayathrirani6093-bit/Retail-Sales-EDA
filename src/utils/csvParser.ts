import { RetailTransaction } from '../types';

export interface CsvParseResult {
  success: boolean;
  transactions: RetailTransaction[];
  rowCount: number;
  columnsFound: string[];
  missingCrucialColumns: string[];
  message: string;
}

// Splits a CSV line into cells respecting quotes and escaped quotes
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Clean and normalize strings (remove wrapping quotes, extra whitespace)
function cleanField(val: string): string {
  if (!val) return '';
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1).trim();
  }
  return clean;
}

// Parse numeric value removing currencies and commas
function parseNumber(val: string, fallback = 0): number {
  if (!val) return fallback;
  const cleaned = val.replace(/[\$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

// Normalize date into YYYY-MM-DD
function normalizeDate(val: string, fallbackIndex = 1): string {
  if (!val) return `2023-01-${String((fallbackIndex % 28) + 1).padStart(2, '0')}`;
  
  const clean = cleanField(val);
  // Matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10);
  }

  // Matches MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
  const slashParts = clean.split(/[/\-]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      // YYYY/MM/DD
      const y = slashParts[0];
      const m = slashParts[1].padStart(2, '0');
      const d = slashParts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else if (slashParts[2].length === 4) {
      // MM/DD/YYYY or DD/MM/YYYY - detect whether part 0 or 1 is month
      const p0 = parseInt(slashParts[0], 10);
      const p1 = parseInt(slashParts[1], 10);
      const y = slashParts[2];
      if (p0 > 12 && p1 <= 12) {
        // DD/MM/YYYY
        return `${y}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
      } else {
        // MM/DD/YYYY
        return `${y}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
    }
  }

  const parsedDate = new Date(clean);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }

  return `2023-01-${String((fallbackIndex % 28) + 1).padStart(2, '0')}`;
}

export function parseRetailCsv(csvContent: string): CsvParseResult {
  if (!csvContent || !csvContent.trim()) {
    return {
      success: false,
      transactions: [],
      rowCount: 0,
      columnsFound: [],
      missingCrucialColumns: ['Dataset is empty'],
      message: 'The uploaded file is empty.',
    };
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      rowCount: 0,
      columnsFound: [],
      missingCrucialColumns: ['Insufficient data'],
      message: 'The CSV file contains only headers with no transaction records.',
    };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => cleanField(h).toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Header mapping with aliases
  const findIndex = (aliases: string[]): number => {
    return headers.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));
  };

  const idIdx = findIndex(['transactionid', 'invoice', 'id', 'orderid']);
  const dateIdx = findIndex(['date', 'invoicedate', 'orderdate', 'time', 'timestamp']);
  const custIdx = findIndex(['customerid', 'custid', 'clientid', 'customer', 'user']);
  const genderIdx = findIndex(['gender', 'sex']);
  const ageIdx = findIndex(['age', 'customerage']);
  const categoryIdx = findIndex(['productcategory', 'category', 'product', 'department', 'item']);
  const quantityIdx = findIndex(['quantity', 'qty', 'units', 'count', 'items']);
  const priceIdx = findIndex(['priceperunit', 'unitprice', 'price', 'rate', 'itemprice']);
  const totalIdx = findIndex(['totalamount', 'total', 'amount', 'sales', 'revenue', 'spend', 'subtotal']);
  const profitIdx = findIndex(['profit', 'netprofit', 'grossprofit', 'earnings', 'income', 'marginamount', 'gain']);
  const costIdx = findIndex(['cost', 'cogs', 'unitcost', 'totalcost', 'expense', 'expenses', 'purchaseprice']);
  const discountIdx = findIndex(['discount', 'discountpct', 'rebate', 'coupon']);

  const columnsFound: string[] = [];
  if (idIdx !== -1) columnsFound.push('Transaction ID');
  if (dateIdx !== -1) columnsFound.push('Date');
  if (custIdx !== -1) columnsFound.push('Customer ID');
  if (genderIdx !== -1) columnsFound.push('Gender');
  if (ageIdx !== -1) columnsFound.push('Age');
  if (categoryIdx !== -1) columnsFound.push('Category');
  if (quantityIdx !== -1) columnsFound.push('Quantity');
  if (priceIdx !== -1) columnsFound.push('Price per Unit');
  if (totalIdx !== -1) columnsFound.push('Total Amount');
  if (profitIdx !== -1) columnsFound.push('Profit');
  if (costIdx !== -1) columnsFound.push('Cost');
  if (discountIdx !== -1) columnsFound.push('Discount');

  const missingCrucialColumns: string[] = [];
  if (totalIdx === -1 && (quantityIdx === -1 || priceIdx === -1)) {
    missingCrucialColumns.push('Total Amount (or Quantity and Unit Price)');
  }

  const transactions: RetailTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rowId = idIdx !== -1 && row[idIdx] ? parseNumber(row[idIdx], i) : i;
    const dateStr = dateIdx !== -1 && row[dateIdx] ? normalizeDate(row[dateIdx], i) : `2023-01-${String((i % 28) + 1).padStart(2, '0')}`;
    const custId = custIdx !== -1 && row[custIdx] ? cleanField(row[custIdx]) : `CUST${String(i).padStart(3, '0')}`;
    
    let rawGender = genderIdx !== -1 && row[genderIdx] ? cleanField(row[genderIdx]) : 'Female';
    let gender = rawGender.toLowerCase().startsWith('m') ? 'Male' : rawGender.toLowerCase().startsWith('f') ? 'Female' : rawGender || 'Unspecified';

    const age = ageIdx !== -1 && row[ageIdx] ? Math.max(16, Math.min(100, Math.round(parseNumber(row[ageIdx], 35)))) : Math.floor(20 + (i % 45));
    
    let productCategory = categoryIdx !== -1 && row[categoryIdx] ? cleanField(row[categoryIdx]) : 'General';
    // Title-case category
    if (productCategory.length > 0) {
      productCategory = productCategory.charAt(0).toUpperCase() + productCategory.slice(1);
    }

    const quantity = quantityIdx !== -1 && row[quantityIdx] ? Math.max(1, Math.round(parseNumber(row[quantityIdx], 1))) : 1;
    let pricePerUnit = priceIdx !== -1 && row[priceIdx] ? parseNumber(row[priceIdx], 50) : 0;
    let totalAmount = totalIdx !== -1 && row[totalIdx] ? parseNumber(row[totalIdx], 0) : 0;

    // Harmonize price and total
    if (totalAmount <= 0 && pricePerUnit > 0) {
      totalAmount = quantity * pricePerUnit;
    } else if (pricePerUnit <= 0 && totalAmount > 0) {
      pricePerUnit = Number((totalAmount / quantity).toFixed(2));
    } else if (totalAmount <= 0 && pricePerUnit <= 0) {
      pricePerUnit = 50;
      totalAmount = quantity * pricePerUnit;
    }

    const month = dateStr.substring(0, 7);
    const monthNum = parseInt(dateStr.substring(5, 7), 10) || 1;
    const quarter = `Q${Math.ceil(monthNum / 3)}`;

    // Profit, cost, discount parsing or estimation
    let profit = profitIdx !== -1 && row[profitIdx] ? parseNumber(row[profitIdx], 0) : undefined;
    let cost = costIdx !== -1 && row[costIdx] ? parseNumber(row[costIdx], 0) : undefined;
    const discount = discountIdx !== -1 && row[discountIdx] ? parseNumber(row[discountIdx], 0) : undefined;

    if (profit === undefined) {
      if (cost !== undefined) {
        // If cost is unit cost or total cost
        const totalCost = cost > totalAmount ? cost : cost * quantity;
        profit = Number((totalAmount - totalCost).toFixed(2));
      } else {
        // Realistic category benchmark margin
        const catBenchmarks: Record<string, number> = {
          Beauty: 0.62,
          Clothing: 0.50,
          Electronics: 0.36,
        };
        const baseMargin = catBenchmarks[productCategory] || 0.45;
        // Deterministic pseudo-variation per row (+/- 6%)
        const rowVariation = (((i * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.08;
        const margin = Math.max(0.12, Math.min(0.88, baseMargin + rowVariation));
        const estimatedUnitCost = Number((pricePerUnit * (1 - margin)).toFixed(2));
        cost = Number((estimatedUnitCost * quantity).toFixed(2));
        profit = Number((totalAmount - cost).toFixed(2));
      }
    }

    if (cost === undefined) {
      cost = Number(Math.max(0, totalAmount - profit).toFixed(2));
    }

    const marginPct = totalAmount > 0 ? Number(((profit / totalAmount) * 100).toFixed(1)) : 0;

    transactions.push({
      id: typeof rowId === 'number' ? rowId : i,
      date: dateStr,
      custId,
      gender,
      age,
      productCategory,
      quantity,
      pricePerUnit: Number(pricePerUnit.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      marginPct,
      discount,
      month,
      quarter,
    });
  }

  if (transactions.length === 0) {
    return {
      success: false,
      transactions: [],
      rowCount: 0,
      columnsFound,
      missingCrucialColumns: ['No valid rows could be processed'],
      message: 'Could not parse any valid transaction rows from the CSV file.',
    };
  }

  return {
    success: true,
    transactions,
    rowCount: transactions.length,
    columnsFound,
    missingCrucialColumns,
    message: `Successfully processed ${transactions.length.toLocaleString()} transaction records.`,
  };
}
