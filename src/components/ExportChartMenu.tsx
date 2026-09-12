import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, FileText, Check, Loader2, ChevronDown } from 'lucide-react';
import { exportChartAsImage, exportChartAsPdf } from '../utils/exportChart';
import { useTheme } from '../context/ThemeContext';

interface ExportChartMenuProps {
  targetElementId: string;
  filename: string;
  chartTitle?: string;
  className?: string;
  label?: string;
}

export const ExportChartMenu: React.FC<ExportChartMenuProps> = ({
  targetElementId,
  filename,
  chartTitle = 'Retail Analytics Chart',
  className = '',
  label = 'Export',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'jpg' | 'pdf' | null>(null);
  const [successFormat, setSuccessFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    setExportingFormat(format);
    setIsOpen(false);

    let success = false;
    if (format === 'pdf') {
      success = await exportChartAsPdf(targetElementId, filename, chartTitle, isDark);
    } else {
      success = await exportChartAsImage(
        targetElementId,
        filename,
        format === 'jpg' ? 'jpeg' : 'png',
        isDark
      );
    }

    setExportingFormat(null);
    if (success) {
      setSuccessFormat(format.toUpperCase());
      setTimeout(() => setSuccessFormat(null), 2500);
    }
  };

  return (
    <div className={`relative inline-block no-export ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exportingFormat !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 transition disabled:opacity-50"
        title="Download graph as PNG, JPG, or PDF"
      >
        {exportingFormat ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span className="text-[11px]">Saving {exportingFormat.toUpperCase()}...</span>
          </>
        ) : successFormat ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-emerald-400">{successFormat} Saved!</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">{label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 divide-y divide-slate-800">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Image Formats
          </div>
          <div className="py-1">
            <button
              onClick={() => handleExport('png')}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Image className="w-3.5 h-3.5 text-sky-400" />
              <span>PNG Image (High-Res)</span>
            </button>
            <button
              onClick={() => handleExport('jpg')}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <Image className="w-3.5 h-3.5 text-emerald-400" />
              <span>JPG Image (Compressed)</span>
            </button>
          </div>

          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Document
          </div>
          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 text-left transition text-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF Presentation Slide</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
