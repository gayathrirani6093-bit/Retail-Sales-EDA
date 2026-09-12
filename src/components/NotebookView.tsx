import React, { useState } from 'react';
import { NOTEBOOK_SECTIONS } from '../data/notebookContent';
import { NotebookSection } from '../types';
import { 
  MonthlyTrendChart, 
  CustomerDistChart, 
  CategoryRevenueChart, 
  CorrelationHeatmap, 
  AdditionalVizChart 
} from './Visualizations';
import { GeminiInsightsTool, GeneratedData } from './GeminiInsightsTool';
import { 
  Check, 
  Copy, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Terminal, 
  Layers, 
  Sparkles, 
  Download,
  Info
} from 'lucide-react';
import { generateJupyterNotebookJson, downloadFile } from '../utils/exportIpynb';

export const NotebookView: React.FC = () => {
  const [sections, setSections] = useState<NotebookSection[]>(NOTEBOOK_SECTIONS);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'step' | 'full'>('step');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAiTool, setShowAiTool] = useState<boolean>(true);

  const currentSection = sections.find((s) => s.id === activeStep) || sections[0];

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handler when user applies generated AI insights to auto-populate Notebook Sections 9 & 10
  const handleApplyAiInsights = (aiData: GeneratedData) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === 9) {
          return {
            ...sec,
            markdownExplanation: aiData.markdownText,
            pythonCode: aiData.pythonCodeSnippet,
            textOutput: `=== AI-POPULATED BUSINESS INSIGHTS ===\n${aiData.insights
              .map((ins) => `[${ins.id}] ${ins.title}: ${ins.metric} - ${ins.finding}`)
              .join('\n')}`,
          };
        }
        if (sec.id === 10) {
          const recText = aiData.recommendations
            .map((rec) => `• [${rec.category}] ${rec.action} (Target: ${rec.expectedOutcome})`)
            .join('\n\n');
          return {
            ...sec,
            markdownExplanation: `### 10. Business Recommendations (AI-Synthesized)\n\n${recText}`,
            pythonCode: `# Step 10: Executive AI Recommendations\nrecommendations = [\n${aiData.recommendations
              .map((r) => `    {"category": "${r.category}", "action": "${r.action}"}`)
              .join(',\n')}\n]\nfor r in recommendations:\n    print(f"[{r['category']}] {r['action']}")`,
            textOutput: `=== EXECUTIVE ACTIONABLE RECOMMENDATIONS ===\n${aiData.recommendations
              .map((r) => `[${r.category}] ${r.action}`)
              .join('\n')}`,
          };
        }
        return sec;
      })
    );

    // Jump user directly to Step 9 to view populated content
    setActiveStep(9);
    const el = document.getElementById('notebook-section-9');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderVisualOutput = (section: NotebookSection) => {
    if (section.chartType === 'monthly_trend') {
      return <MonthlyTrendChart />;
    }
    if (section.chartType === 'customer_dist') {
      return <CustomerDistChart />;
    }
    if (section.chartType === 'category_revenue') {
      return <CategoryRevenueChart />;
    }
    if (section.chartType === 'correlation_heatmap') {
      return <CorrelationHeatmap />;
    }
    if (section.chartType === 'additional_viz') {
      return <AdditionalVizChart />;
    }
    return null;
  };

  const renderSectionCard = (section: NotebookSection) => {
    const isCopied = copiedId === section.id;

    return (
      <div
        key={section.id}
        id={`notebook-section-${section.id}`}
        className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-8"
      >
        {/* Section Header Bar */}
        <div className="bg-slate-850 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {section.badge}
            </span>
            <h3 className="text-lg font-bold text-slate-100">{section.title}</h3>
          </div>

          <button
            id={`btn-copy-code-${section.id}`}
            onClick={() => handleCopy(section.pythonCode, section.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Markdown Cell */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Jupyter Markdown Cell (Concept & Explanations)
            </div>
            <div className="text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-sans">
              {section.markdownExplanation}
            </div>
          </div>

          {/* Code Cell */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                Python 3 (ipykernel)
              </span>
              <span>Cell [{section.id}]</span>
            </div>
            <div className="p-4 overflow-x-auto font-mono text-xs text-blue-200 bg-slate-950/90 leading-relaxed">
              <pre className="whitespace-pre">{section.pythonCode}</pre>
            </div>
          </div>

          {/* Output Cell */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Cell Execution Output:
            </div>

            {section.outputType === 'text' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                {section.textOutput}
              </div>
            )}

            {section.outputType === 'table' && section.tableHeaders && section.tableRows && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <tr>
                      {section.tableHeaders.map((h, i) => (
                        <th key={i} className="px-4 py-2.5 font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {section.tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-950/60' : 'bg-slate-900/40'}>
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {section.outputType === 'chart' && (
              <div className="space-y-4">
                {renderVisualOutput(section)}
                {section.textOutput && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 overflow-x-auto whitespace-pre">
                    {section.textOutput}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Interactive Notebook
            </span>
            <span className="text-xs text-slate-400">10 Structured Sections</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            EDA on Retail Sales Data: Python & Jupyter Notebook
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete beginner-friendly notebook replicating the real Jupyter environment with conceptual markdown, verified Python code, and interactive visual outputs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAiTool(!showAiTool)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{showAiTool ? 'Hide AI Tool' : 'Gemini Insights Tool'}</span>
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('step')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'step' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Step-by-Step Focus
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'full' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Notebook
            </button>
          </div>

          <button
            onClick={() => {
              const json = generateJupyterNotebookJson();
              downloadFile(json, 'retail_sales_eda.ipynb', 'application/json');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export .ipynb</span>
          </button>
        </div>
      </div>

      {/* Gemini AI Actionable Insights Tool */}
      {showAiTool && (
        <GeminiInsightsTool onApplyToNotebook={handleApplyAiInsights} />
      )}

      {/* Stepper Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-2 scrollbar-thin">
        {sections.map((s) => (
          <button
            key={s.id}
            id={`step-pill-${s.id}`}
            onClick={() => {
              setActiveStep(s.id);
              if (viewMode === 'full') {
                const el = document.getElementById(`notebook-section-${s.id}`);
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeStep === s.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              activeStep === s.id ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-400'
            }`}>
              {s.id}
            </span>
            <span>{s.title.includes('. ') ? s.title.split('. ')[1] : s.title}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {viewMode === 'step' ? (
        <div>
          {renderSectionCard(currentSection)}

          {/* Next / Previous Stepper Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
            <button
              disabled={activeStep === 1}
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeStep === 1
                  ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900 border border-slate-800'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Step
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Section {activeStep} of {sections.length}
            </span>

            <button
              disabled={activeStep === sections.length}
              onClick={() => setActiveStep((prev) => Math.min(sections.length, prev + 1))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeStep === sections.length
                  ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900 border border-slate-800'
                  : 'text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20'
              }`}
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => renderSectionCard(section))}
        </div>
      )}
    </div>
  );
};
