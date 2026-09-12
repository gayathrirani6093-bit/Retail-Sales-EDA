import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Cleanly captures an HTML element and triggers browser download as PNG or JPG
 */
export async function exportChartAsImage(
  elementId: string,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  isDark: boolean = true
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for export.`);
    return false;
  }

  const bgColor = isDark ? '#0f172a' : '#ffffff';

  try {
    const options = {
      backgroundColor: bgColor,
      pixelRatio: 1.5,
      skipFonts: true,
      filter: (node: HTMLElement) => {
        // Exclude interactive export dropdowns or action buttons during capture
        if (node.classList && (node.classList.contains('no-export') || node.classList.contains('no-print'))) {
          return false;
        }
        return true;
      },
    };

    let dataUrl = '';
    if (format === 'jpeg') {
      dataUrl = await toJpeg(element, { ...options, quality: 0.95 });
    } else {
      dataUrl = await toPng(element, options);
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Failed to export chart as image:', err);
    return false;
  }
}

/**
 * Exports a single chart as a presentation-ready PDF page
 */
export async function exportChartAsPdf(
  elementId: string,
  filename: string,
  chartTitle: string = 'Retail Sales Analytics Chart',
  isDark: boolean = true
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return false;
  }

  const bgColor = isDark ? '#0f172a' : '#ffffff';

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: bgColor,
      pixelRatio: 1.5,
      skipFonts: true,
      filter: (node: HTMLElement) => {
        if (node.classList && (node.classList.contains('no-export') || node.classList.contains('no-print'))) {
          return false;
        }
        return true;
      },
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Dark header banner
    pdf.setFillColor(isDark ? 15 : 248, isDark ? 23 : 250, isDark ? 42 : 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header Title
    pdf.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(chartTitle, 15, 16);

    // Subtitle & Timestamp
    pdf.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const nowSingle = new Date();
    const formattedDateSingle = `${String(nowSingle.getDate()).padStart(2, '0')}/${String(nowSingle.getMonth() + 1).padStart(2, '0')}/${nowSingle.getFullYear()}`;
    pdf.text(
      `Retail Sales EDA | Generated: ${formattedDateSingle} | 1,000 Verified Transactions`,
      15,
      22
    );

    // Calculate dimensions to fit inside A4 landscape
    const marginX = 15;
    const marginTop = 26;
    const maxImgWidth = pageWidth - marginX * 2;
    const maxImgHeight = pageHeight - marginTop - 12;

    const elRect = element.getBoundingClientRect();
    const imgRatio = elRect.width / elRect.height;
    let finalWidth = maxImgWidth;
    let finalHeight = finalWidth / imgRatio;

    if (finalHeight > maxImgHeight) {
      finalHeight = maxImgHeight;
      finalWidth = finalHeight * imgRatio;
    }

    const posX = marginX + (maxImgWidth - finalWidth) / 2;
    const posY = marginTop;

    pdf.addImage(dataUrl, 'PNG', posX, posY, finalWidth, finalHeight);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(isDark ? 100 : 150, isDark ? 116 : 150, isDark ? 139 : 150);
    pdf.text('Retail Sales Exploratory Data Analysis (EDA) & Machine Learning Forecast', 15, pageHeight - 6);

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to export chart as PDF:', err);
    return false;
  }
}

/**
 * Exports all charts in the dashboard as a multi-page presentation deck PDF
 */
export async function exportFullDeckPdf(
  chartList: { id: string; title: string }[],
  filename: string,
  isDark: boolean = true
): Promise<boolean> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < chartList.length; i++) {
      const item = chartList[i];
      const element =
        document.getElementById(item.id) ||
        (item.id === 'correlation-heatmap-container' ? document.getElementById('sales-correlation-heatmap-container') : null) ||
        (item.id === 'sales-correlation-heatmap-container' ? document.getElementById('correlation-heatmap-container') : null);
      if (!element) continue;

      try {
        const dataUrl = await toPng(element, {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          pixelRatio: 1.5,
          skipFonts: true,
          filter: (node: HTMLElement) => {
            if (node.classList && (node.classList.contains('no-export') || node.classList.contains('no-print'))) {
              return false;
            }
            return true;
          },
        });

        if (pdf.getNumberOfPages() > 0 && i > 0) {
          pdf.addPage('a4', 'landscape');
        }

        // Fill background
        pdf.setFillColor(isDark ? 15 : 248, isDark ? 23 : 250, isDark ? 42 : 252);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Title & Slide Number
        pdf.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(item.title, 15, 16);

        pdf.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const nowDeck = new Date();
        const formattedDateDeck = `${String(nowDeck.getDate()).padStart(2, '0')}/${String(nowDeck.getMonth() + 1).padStart(2, '0')}/${nowDeck.getFullYear()}`;
        pdf.text(
          `Slide ${pdf.getNumberOfPages()} of ${chartList.length} | Date: ${formattedDateDeck}`,
          pageWidth - 15,
          16,
          { align: 'right' }
        );

        const marginX = 15;
        const marginTop = 24;
        const maxImgWidth = pageWidth - marginX * 2;
        const maxImgHeight = pageHeight - marginTop - 12;

        const elRect = element.getBoundingClientRect();
        const imgRatio = elRect.width / (elRect.height || 1);
        let finalWidth = maxImgWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > maxImgHeight) {
          finalHeight = maxImgHeight;
          finalWidth = finalHeight * imgRatio;
        }

        const posX = marginX + (maxImgWidth - finalWidth) / 2;
        const posY = marginTop;

        pdf.addImage(dataUrl, 'PNG', posX, posY, finalWidth, finalHeight);

        // Slide Footer
        pdf.setFontSize(8);
        pdf.setTextColor(isDark ? 100 : 150, isDark ? 116 : 150, isDark ? 139 : 150);
        pdf.text('Retail Sales EDA & Predictive Model', 15, pageHeight - 6);
      } catch (slideErr) {
        console.warn(`Failed to capture slide for ${item.id}:`, slideErr);
      }
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to export full deck PDF:', err);
    return false;
  }
}

export interface DashboardReportMetrics {
  totalRevenue: number;
  totalUnits: number;
  aov: number;
  avgAge: number;
  transactionCount: number;
  categoryFilter: string;
  genderFilter: string;
  ageFilter: string;
  dateRange: string;
  datasetName: string;
  momGrowth?: string;
  anomaliesSummary?: string[];
}

/**
 * Generates an executive-ready multi-page PDF report including metrics summary,
 * anomaly notifications, and rendered high-DPI charts.
 */
export async function exportDashboardReportPdf(
  metrics: DashboardReportMetrics,
  filename: string = 'Retail_Sales_Executive_Report',
  isDark: boolean = true
): Promise<boolean> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;

    // Safe chart capture helper with skipFonts to eliminate CORS font crashes
    const captureChartImage = async (
      elementId: string
    ): Promise<{ dataUrl: string; width: number; height: number } | null> => {
      const element =
        document.getElementById(elementId) ||
        (elementId === 'correlation-heatmap-container' ? document.getElementById('sales-correlation-heatmap-container') : null) ||
        (elementId === 'sales-correlation-heatmap-container' ? document.getElementById('correlation-heatmap-container') : null);
      if (!element) return null;
      try {
        const dataUrl = await toPng(element, {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          pixelRatio: 1.5,
          skipFonts: true,
          filter: (node: HTMLElement) => {
            if (
              node.classList &&
              (node.classList.contains('no-export') || node.classList.contains('no-print'))
            ) {
              return false;
            }
            return true;
          },
        });
        const rect = element.getBoundingClientRect();
        return {
          dataUrl,
          width: rect.width || 600,
          height: rect.height || 400,
        };
      } catch (err) {
        console.warn(`Chart capture skipped for #${elementId}:`, err);
        return null;
      }
    };

    // Helper: draw page background & header
    const initPage = (pageNumber: number, totalPages: number, pageTitle: string) => {
      pdf.setFillColor(isDark ? 15 : 248, isDark ? 23 : 250, isDark ? 42 : 252);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Full year date formatting (e.g. 11/09/2026)
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Top Header bar
      pdf.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text(pageTitle, margin, 14);

      // Sub-meta in top right header: right-aligned so full date and year (e.g. 11/09/2026) are never cut off
      pdf.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);

      const titleWidth = pdf.getTextWidth(pageTitle);
      let rightHeaderText = `Date: ${formattedDate}`;
      const candidateText = `Dataset: ${metrics.datasetName} | Date: ${formattedDate}`;
      const candidateWidth = pdf.getTextWidth(candidateText);

      // Only include dataset name if there is ample clearance (at least 15mm gap) and pageTitle does not already contain 'Dataset'
      if (!pageTitle.includes('Dataset') && (margin + titleWidth + 15 + candidateWidth < pageWidth - margin)) {
        rightHeaderText = candidateText;
      }

      pdf.text(rightHeaderText, pageWidth - margin, 14, { align: 'right' });

      // Bottom footer bar
      pdf.setDrawColor(isDark ? 51 : 226, isDark ? 65 : 232, isDark ? 85 : 240);
      pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      pdf.text(
        'Retail Sales Analytics & Machine Learning Forecasting Executive Report',
        margin,
        pageHeight - 6
      );
      pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    };

    // PAGE 1: Executive KPI Metrics + Anomaly Highlights + Monthly Trend
    initPage(1, 4, 'Executive Sales Summary & Trend Analysis');

    let currentY = 22;

    // Report Intro & Filter Context Card
    pdf.setFillColor(isDark ? 30 : 241, isDark ? 41 : 245, isDark ? 59 : 249);
    pdf.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(isDark ? 226 : 30, isDark ? 232 : 41, isDark ? 240 : 59);
    pdf.text('Active Analysis Filters & Cohort Scope:', margin + 4, currentY + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
    pdf.text(
      `Date Range: ${metrics.dateRange}   |   Product Category: ${metrics.categoryFilter}   |   Gender: ${metrics.genderFilter}   |   Age Cohort: ${metrics.ageFilter}`,
      margin + 4,
      currentY + 12
    );
    pdf.text(
      `Analyzed Volume: ${metrics.transactionCount.toLocaleString()} transactions evaluated across historical sales records.`,
      margin + 4,
      currentY + 17
    );

    currentY += 26;

    // KPI Metrics Cards Grid (5 boxes)
    const cardWidth = (pageWidth - margin * 2 - 12) / 5;
    const cardHeight = 20;

    const kpiCards = [
      { label: 'TOTAL REVENUE', value: `$${metrics.totalRevenue.toLocaleString()}`, color: [59, 130, 246] },
      { label: 'MOM GROWTH', value: metrics.momGrowth || 'N/A', color: [99, 102, 241] },
      { label: 'TOTAL UNITS', value: `${metrics.totalUnits.toLocaleString()}`, color: [16, 185, 129] },
      { label: 'AVG BASKET', value: `$${metrics.aov.toFixed(2)}`, color: [245, 158, 11] },
      { label: 'AVG AGE', value: `${metrics.avgAge.toFixed(1)} yrs`, color: [168, 85, 247] },
    ];

    kpiCards.forEach((card, idx) => {
      const cardX = margin + idx * (cardWidth + 3);
      pdf.setFillColor(isDark ? 30 : 255, isDark ? 41 : 255, isDark ? 59 : 255);
      pdf.setDrawColor(isDark ? 51 : 226, isDark ? 65 : 232, isDark ? 85 : 240);
      pdf.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
      pdf.text(card.label, cardX + 3, currentY + 6);

      pdf.setFontSize(11);
      pdf.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
      pdf.text(card.value, cardX + 3, currentY + 14);
    });

    currentY += cardHeight + 4;

    // Anomaly Alerts Summary (if available)
    if (metrics.anomaliesSummary && metrics.anomaliesSummary.length > 0) {
      pdf.setFillColor(isDark ? 45 : 254, isDark ? 26 : 243, isDark ? 14 : 199);
      pdf.setDrawColor(245, 158, 11);
      pdf.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(217, 119, 6);
      pdf.text('AUTOMATED DATA ANOMALY ALERTS (SPIKES & DROPS DETECTED)', margin + 4, currentY + 5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(isDark ? 254 : 120, isDark ? 243 : 53, isDark ? 199 : 15);
      
      const anomaliesText = metrics.anomaliesSummary.slice(0, 3).join('   |   ');
      pdf.text(anomaliesText, margin + 4, currentY + 11);
      pdf.text(
        'Statistical outliers identified via rolling Gaussian Z-score divergence and MoM volatility analysis.',
        margin + 4,
        currentY + 16
      );

      currentY += 24;
    }

    // Chart 1: Monthly Trend
    const monthlyCapture = await captureChartImage('monthly-trend-chart-container');
    if (monthlyCapture) {
      const maxH = pageHeight - currentY - 14;
      const imgWidth = pageWidth - margin * 2;
      const imgRatio = monthlyCapture.width / monthlyCapture.height;
      let imgH = imgWidth / imgRatio;
      if (imgH > maxH) imgH = maxH;

      pdf.addImage(monthlyCapture.dataUrl, 'PNG', margin, currentY, imgWidth, imgH);
    }

    // PAGE 2: Category Breakdown (Revenue & Units)
    pdf.addPage('a4', 'portrait');
    initPage(2, 4, 'Product Category Performance Breakdown');
    currentY = 22;

    const fullW = pageWidth - margin * 2;
    const catRevCapture = await captureChartImage('cat-revenue-chart-container');
    const catUnitsCapture = await captureChartImage('cat-units-chart-container');
    const halfH = (pageHeight - currentY - 24) / 2;

    if (catRevCapture) {
      const r = catRevCapture.width / catRevCapture.height;
      const h = Math.min(halfH, fullW / r);
      pdf.addImage(catRevCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
      currentY += h + 6;
    }

    if (catUnitsCapture) {
      const r = catUnitsCapture.width / catUnitsCapture.height;
      const h = Math.min(halfH, fullW / r);
      pdf.addImage(catUnitsCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
    }

    // PAGE 3: Customer Demographics (Age & Gender)
    pdf.addPage('a4', 'portrait');
    initPage(3, 4, 'Customer Demographic & Cohort Analysis');
    currentY = 22;

    const ageCapture = await captureChartImage('customer-age-chart-container');
    const genderCapture = await captureChartImage('gender-spending-chart-container');

    if (ageCapture) {
      const r = ageCapture.width / ageCapture.height;
      const h = Math.min(halfH, fullW / r);
      pdf.addImage(ageCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
      currentY += h + 6;
    }

    if (genderCapture) {
      const r = genderCapture.width / genderCapture.height;
      const h = Math.min(halfH, fullW / r);
      pdf.addImage(genderCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
    }

    // PAGE 4: Correlation Matrix & Sales Forecast
    pdf.addPage('a4', 'portrait');
    initPage(4, 4, 'Machine Learning Forecast | Dataset');
    currentY = 22;

    const corrCapture = await captureChartImage('correlation-heatmap-container');
    const forecastCapture = await captureChartImage('sales-forecasting-container');

    if (corrCapture) {
      const r = corrCapture.width / corrCapture.height;
      const h = Math.min(halfH, fullW / r);
      pdf.addImage(corrCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
      currentY += h + 6;
    }

    if (forecastCapture) {
      const maxRemainingH = pageHeight - currentY - 14;
      const r = forecastCapture.width / forecastCapture.height;
      const h = Math.min(maxRemainingH, fullW / r);
      pdf.addImage(forecastCapture.dataUrl, 'PNG', margin, currentY, fullW, h);
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to export dashboard report PDF:', err);
    return false;
  }
}

