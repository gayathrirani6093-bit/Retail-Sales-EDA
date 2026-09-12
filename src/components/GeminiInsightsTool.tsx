import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Copy, ArrowRight, Lightbulb, TrendingUp, Compass, FileText } from 'lucide-react';

export interface GeneratedInsight {
  id: number;
  title: string;
  metric: string;
  finding: string;
  businessImpact: string;
}

export interface GeneratedRecommendation {
  id: number;
  category: string;
  action: string;
  expectedOutcome: string;
}

export interface GeneratedData {
  summary: string;
  insights: GeneratedInsight[];
  recommendations: GeneratedRecommendation[];
  pythonCodeSnippet: string;
  markdownText: string;
}

interface GeminiInsightsToolProps {
  onApplyToNotebook?: (data: GeneratedData) => void;
}

export const GeminiInsightsTool: React.FC<GeminiInsightsToolProps> = ({ onApplyToNotebook }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [focusArea, setFocusArea] = useState<string>('All Core Insights (Seasonal, Pricing, Demographics)');
  const [results, setResults] = useState<GeneratedData | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);

    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusArea }),
      });

      const json = await res.json().catch(() => null);

      if (json && json.success && json.data) {
        setResults(json.data);
        setSource(json.source || 'gemini');
        setModel(json.model || null);
        setNotice(json.notice || null);
      } else if (!res.ok) {
        throw new Error(json?.error || `Server returned HTTP ${res.status}`);
      } else {
        throw new Error(json?.error || 'Failed to generate insights');
      }
    } catch (err: any) {
      console.error('Insight generation error:', err);
      setError(err.message || 'Error communicating with analytics endpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (results && onApplyToNotebook) {
      onApplyToNotebook(results);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div id="gemini-insights-tool" className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Gemini AI Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono">gemini-3.8-flash</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              AI-Powered Actionable Business Insights Generator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deeply inspects the 1,000 retail transactions to generate grounded executive takeaways and auto-populate Section 9 & 10 of your Jupyter Notebook.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-generate-ai-insights"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Dataset...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Actionable Insights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Focus Area Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-400 mb-1.5">
            Select Analytical Lens / Strategic Focus:
          </label>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All Core Insights (Seasonal, Pricing, Demographics)">
              Comprehensive (Seasonal Volatility, Unit Price Driver, Customer Demographics)
            </option>
            <option value="Seasonal Demand Volatility & Counter-Cyclical Measures">
              Focus on Seasonal Volatility (March Peak vs August Trough)
            </option>
            <option value="Pricing Power, Skewness, and Upsell Elasticity">
              Focus on Pricing Tiers & Unit Price Correlation (r = 0.8528)
            </option>
            <option value="Demographic Targeting (Young Adults 26-35 & Female Shoppers)">
              Focus on Demographic Segments & High-Value Baskets
            </option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Clicking <strong>Auto-Populate Notebook</strong> will overwrite the Markdown & Code cells in Section 9 & 10.</span>
          </div>
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="space-y-6 pt-2">
          {/* Engine Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">
                {source === 'gemini'
                  ? `AI Generated via ${model || 'Gemini 3.8 Flash'}`
                  : 'Synthesized by Grounded Retail Econometric Engine'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              1,000 Records Analyzed • 100% Data Grounded
            </span>
          </div>

          {notice && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Executive Summary */}
          <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              Executive Synthesis
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{results.summary}</p>
          </div>

          {/* 5 Quantified Insights */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400" />
              Synthesized Data-Backed Findings (5 Points)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {results.insights.map((ins) => (
                <div
                  key={ins.id}
                  className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-400">Insight #{ins.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {ins.metric}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-100">{ins.title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{ins.finding}</p>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <strong className="text-slate-300">Operational Impact:</strong> {ins.businessImpact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Strategic Business Recommendations (3 Actions)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {results.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {rec.category}
                  </span>
                  <p className="text-xs text-slate-200 font-semibold pt-1">{rec.action}</p>
                  <div className="text-[11px] text-emerald-400 pt-1 border-t border-slate-800/80">
                    <strong>Target Outcome:</strong> {rec.expectedOutcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-populate Controls and Export */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Ready to integrate?</span> Auto-populate Section 9 (Insights) and Section 10 (Recommendations) inside your interactive notebook.
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-copy-ai-markdown"
                onClick={() => handleCopy(results.markdownText, 'markdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              >
                {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'markdown' ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>

              <button
                id="btn-copy-ai-code"
                onClick={() => handleCopy(results.pythonCodeSnippet, 'code')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              >
                {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'code' ? 'Copied Python' : 'Copy Python'}</span>
              </button>

              <button
                id="btn-auto-populate-notebook"
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/25 transition active:scale-95"
              >
                {applied ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span>{applied ? 'Populated in Notebook!' : 'Auto-Populate Notebook'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
