
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Grid3X3, FileUp, Trash2, Plus, Minus, AlignLeft, AlignCenter, AlignRight, 
  Bold, Italic, Merge, Split, Download, Copy, Check, Zap, 
  LayoutTemplate, ChevronDown, Type, PaintBucket, Pipette, 
  Undo2, Redo2, FileText, Table as TableIcon, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, Search, Eraser, SortAsc, Calculator, Hash,
  Rows, Columns, FlipVertical2, CaseUpper, CaseLower, ListOrdered, XCircle, CopyPlus,
  Asterisk, Sigma, Superscript, Subscript, Variable, FlaskConical, Binary, SquarePlus,
  Pi, Infinity as InfIcon, ChevronRightSquare, Quote, Omega
} from 'lucide-react';
import { TableCell, ExportFormat, SelectionRange, Alignment, TablePreset } from './types';
import { DEFAULT_ROWS, DEFAULT_COLS, createEmptyCell, COLORS, BG_COLORS } from './constants';
import { generateLaTeX, generateHTML, generateMarkdown, generateCSV, generateJSON, generateWord, downloadExcel } from './services/generators';
import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'table_gen_pro_save';

const SYMBOL_LIBRARY = [
  {
    category: '常用学术符号',
    items: [
      { char: 'α', cmd: '\\alpha' }, { char: 'β', cmd: '\\beta' }, { char: 'γ', cmd: '\\gamma' },
      { char: 'δ', cmd: '\\delta' }, { char: 'θ', cmd: '\\theta' }, { char: 'μ', cmd: '\\mu' },
      { char: 'σ', cmd: '\\sigma' }, { char: 'λ', cmd: '\\lambda' }, { char: 'π', cmd: '\\pi' },
      { char: '∞', cmd: '\\infty' }, { char: '±', cmd: '\\pm' }, { char: '×', cmd: '\\times' },
      { char: '÷', cmd: '\\div' }, { char: '≈', cmd: '\\approx' }, { char: '≠', cmd: '\\neq' },
      { char: '≤', cmd: '\\le' }, { char: '≥', cmd: '\\ge' }
    ]
  },
  {
    category: '希腊字母 (小写)',
    items: [
      { char: 'α', cmd: '\\alpha' }, { char: 'β', cmd: '\\beta' }, { char: 'γ', cmd: '\\gamma' },
      { char: 'δ', cmd: '\\delta' }, { char: 'ε', cmd: '\\epsilon' }, { char: 'ζ', cmd: '\\zeta' },
      { char: 'η', cmd: '\\eta' }, { char: 'θ', cmd: '\\theta' }, { char: 'ι', cmd: '\\iota' },
      { char: 'κ', cmd: '\\kappa' }, { char: 'λ', cmd: '\\lambda' }, { char: 'μ', cmd: '\\mu' },
      { char: 'ν', cmd: '\\nu' }, { char: 'ξ', cmd: '\\xi' }, { char: 'ο', cmd: 'o' },
      { char: 'π', cmd: '\\pi' }, { char: 'ρ', cmd: '\\rho' }, { char: 'σ', cmd: '\\sigma' },
      { char: 'τ', cmd: '\\tau' }, { char: 'υ', cmd: '\\upsilon' }, { char: 'φ', cmd: '\\phi' },
      { char: 'χ', cmd: '\\chi' }, { char: 'ψ', cmd: '\\psi' }, { char: 'ω', cmd: '\\omega' },
    ]
  },
  {
    category: '希腊字母 (大写)',
    items: [
      { char: 'Γ', cmd: '\\Gamma' }, { char: 'Δ', cmd: '\\Delta' }, { char: 'Θ', cmd: '\\Theta' },
      { char: 'Λ', cmd: '\\Lambda' }, { char: 'Ξ', cmd: '\\Xi' }, { char: 'Π', cmd: '\\Pi' },
      { char: 'Σ', cmd: '\\Sigma' }, { char: 'Υ', cmd: '\\Upsilon' }, { char: 'Φ', cmd: '\\Phi' },
      { char: 'Ψ', cmd: '\\Psi' }, { char: 'Ω', cmd: '\\Omega' },
    ]
  },
  {
    category: '数学算子与微积分',
    items: [
      { char: '⋅', cmd: '\\cdot' }, { char: '×', cmd: '\\times' }, { char: '÷', cmd: '\\div' },
      { char: '±', cmd: '\\pm' }, { char: '∓', cmd: '\\mp' }, { char: '∗', cmd: '\\ast' },
      { char: '∘', cmd: '\\circ' }, { char: '∑', cmd: '\\sum' }, { char: '∏', cmd: '\\prod' },
      { char: '∫', cmd: '\\int' }, { char: '∬', cmd: '\\iint' }, { char: '∮', cmd: '\\oint' },
      { char: '√', cmd: '\\sqrt{}' }, { char: '∝', cmd: '\\propto' }, { char: '∞', cmd: '\\infty' },
      { char: '∇', cmd: '\\nabla' }, { char: '∂', cmd: '\\partial' }, { char: '∆', cmd: '\\Delta' },
    ]
  },
  {
    category: '深度学习与张量运算',
    items: [
      { char: 'ℒ', cmd: '\\mathcal{L}' }, { char: '𝔼', cmd: '\\mathbb{E}' }, { char: 'ℝ', cmd: '\\mathbb{R}' },
      { char: '𝟙', cmd: '\\mathbb{1}' }, { char: '⊗', cmd: '\\otimes' }, { char: '⊕', cmd: '\\oplus' },
      { char: '⊙', cmd: '\\odot' }, { char: '⊘', cmd: '\\oslash' }, { char: '⊛', cmd: '\\circledast' },
      { char: '⊤', cmd: '^{\\top}' }, { char: '⊥', cmd: '\\perp' }, { char: '‖', cmd: '\\|' },
    ]
  },
  {
    category: '逻辑与集合',
    items: [
      { char: '∈', cmd: '\\in' }, { char: '∉', cmd: '\\notin' }, { char: '∋', cmd: '\\ni' },
      { char: '∀', cmd: '\\forall' }, { char: '∃', cmd: '\\exists' }, { char: '∄', cmd: '\\nexists' },
      { char: '⊂', cmd: '\\subset' }, { char: '⊃', cmd: '\\supset' }, { char: '⊆', cmd: '\\subseteq' },
      { char: '⊇', cmd: '\\supseteq' }, { char: '∩', cmd: '\\cap' }, { char: '∪', cmd: '\\cup' },
      { char: '∅', cmd: '\\emptyset' }, { char: '∧', cmd: '\\wedge' }, { char: '∨', cmd: '\\vee' },
      { char: '¬', cmd: '\\neg' },
    ]
  },
  {
    category: '关系符号',
    items: [
      { char: '≈', cmd: '\\approx' }, { char: '≅', cmd: '\\cong' }, { char: '≡', cmd: '\\equiv' },
      { char: '≠', cmd: '\\neq' }, { char: '≤', cmd: '\\le' }, { char: '≥', cmd: '\\ge' },
      { char: '≪', cmd: '\\ll' }, { char: '≫', cmd: '\\gg' }, { char: '∼', cmd: '\\sim' },
      { char: '≃', cmd: '\\simeq' }, { char: '∝', cmd: '\\propto' },
    ]
  },
  {
    category: '箭头符号',
    items: [
      { char: '→', cmd: '\\rightarrow' }, { char: '←', cmd: '\\leftarrow' }, { char: '⇒', cmd: '\\Rightarrow' },
      { char: '⇐', cmd: '\\Leftarrow' }, { char: '⇔', cmd: '\\Leftrightarrow' }, { char: '↔', cmd: '\\leftrightarrow' },
      { char: '↑', cmd: '\\uparrow' }, { char: '↓', cmd: '\\downarrow' }, { char: '↗', cmd: '\\nearrow' },
      { char: '↘', cmd: '\\searrow' },
    ]
  }
];

export default function App() {
  // --- State Initialization ---
  const [past, setPast] = useState<TableCell[][][]>([]);
  const [present, setPresent] = useState<TableCell[][]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { console.error(e); }
    }
    return Array.from({ length: DEFAULT_ROWS }, () => Array.from({ length: DEFAULT_COLS }, createEmptyCell));
  });
  const [future, setFuture] = useState<TableCell[][][]>([]);

  const [selection, setSelection] = useState<SelectionRange | null>({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('latex');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [newRowsCount, setNewRowsCount] = useState(5);
  const [newColsCount, setNewColsCount] = useState(5);
  const [importText, setImportText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  // LaTeX Specific Settings
  const [latexCaption, setLatexCaption] = useState('Table Title');
  const [latexLabel, setLatexLabel] = useState('data');
  const [autoEscapeLatex, setAutoEscapeLatex] = useState(false);
  const [useTabularx, setUseTabularx] = useState(false);

  const editingStartValue = useRef<TableCell[][] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Auto Save ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(present));
  }, [present]);

  // --- Focus/Cursor Fix for Editing ---
  useEffect(() => {
    if (editingCell && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editingCell]);

  // --- Derived Data ---
  const outputCode = useMemo(() => {
    switch (activeFormat) {
      case 'latex': return generateLaTeX(present, { 
        caption: latexCaption, 
        label: latexLabel, 
        autoEscape: autoEscapeLatex,
        useTabularx: useTabularx
      });
      case 'html': return generateHTML(present);
      case 'markdown': return generateMarkdown(present);
      case 'csv': return generateCSV(present);
      case 'json': return generateJSON(present);
      case 'word': return "Word export is available via the 'Export File' button.";
      case 'excel': return "Excel export is available via the 'Export File' button.";
      default: return '';
    }
  }, [present, activeFormat, latexCaption, latexLabel, autoEscapeLatex, useTabularx]);

  const activeTextColor = useMemo(() => {
    if (!selection) return COLORS[0];
    return present[selection.startRow][selection.startCol].color || COLORS[0];
  }, [present, selection]);

  const activeBgColor = useMemo(() => {
    if (!selection) return BG_COLORS[0];
    return present[selection.startRow][selection.startCol].backgroundColor || BG_COLORS[0];
  }, [present, selection]);

  const selectionStats = useMemo(() => {
    if (!selection) return null;
    let sum = 0, count = 0, numCount = 0;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (present[r][c].hidden) continue;
        const val = present[r][c].text.trim();
        if (val !== '') {
          count++;
          const num = parseFloat(val);
          if (!isNaN(num)) { sum += num; numCount++; }
        }
      }
    }
    return numCount > 0 ? { sum, avg: sum / numCount, count } : { count };
  }, [present, selection]);

  // --- History Actions ---
  const recordChange = useCallback((newRows: TableCell[][]) => {
    setPast(prev => [...prev.slice(-49), present]); 
    setPresent(newRows);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(prev => [present, ...prev]);
    setPresent(previous);
    setPast(past.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(prev => [...prev, present]);
    setPresent(next);
    setFuture(future.slice(1));
  }, [future, present]);

  // --- Keyboard Interactions ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isExternalInput = (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') && !editingCell;
      if (isExternalInput) return;

      if (editingCell) {
        if (e.key === 'Escape') { setEditingCell(null); e.preventDefault(); }
        else if (e.key === 'Enter' && !e.shiftKey) { setEditingCell(null); e.preventDefault(); }
        else if (e.key === 'Tab') { setEditingCell(null); }
        else return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo(); else undo();
        e.preventDefault(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo(); e.preventDefault(); return;
      }

      if (!selection) return;
      const { startRow, startCol, endRow, endCol } = selection;
      const rowCount = present.length, colCount = present[0].length;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
        let nStartR = startRow, nStartC = startCol, nEndR = endRow, nEndC = endCol;
        if (e.key === 'ArrowUp') {
          if (e.shiftKey) nEndR = Math.max(0, endRow - 1);
          else { nStartR = Math.max(0, startRow - 1); nEndR = nStartR; nStartC = startCol; nEndC = startCol; }
        } else if (e.key === 'ArrowDown') {
          if (e.shiftKey) nEndR = Math.min(rowCount - 1, endRow + 1);
          else { nStartR = Math.min(rowCount - 1, startRow + 1); nEndR = nStartR; nStartC = startCol; nEndC = startCol; }
        } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
          if (e.shiftKey && e.key !== 'Tab') nEndC = Math.max(0, endCol - 1);
          else { nStartC = Math.max(0, startCol - 1); nEndC = nStartC; nStartR = startRow; nEndR = startRow; }
        } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
          if (e.shiftKey && e.key !== 'Tab') nEndC = Math.min(colCount - 1, endCol + 1);
          else { nStartC = Math.min(colCount - 1, startCol + 1); nEndC = nStartC; nStartR = startRow; nEndR = startRow; }
        }
        setSelection({ startRow: nStartR, startCol: nStartC, endRow: nEndR, endCol: nEndC });
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const rMin = Math.min(startRow, endRow), rMax = Math.max(startRow, endRow);
        const cMin = Math.min(startCol, endCol), cMax = Math.max(startCol, endCol);
        const newRows = present.map((row, r) => row.map((cell, c) => (r >= rMin && r <= rMax && c >= cMin && c <= cMax) ? { ...cell, text: '' } : cell));
        recordChange(newRows);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        setEditingCell({ r: startRow, c: startCol });
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPast(prev => [...prev.slice(-49), present]); 
        const newRows = [...present];
        newRows[startRow] = [...newRows[startRow]];
        newRows[startRow][startCol] = { ...newRows[startRow][startCol], text: e.key };
        setPresent(newRows);
        setEditingCell({ r: startRow, c: startCol });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, editingCell, present, undo, redo, recordChange]);

  // --- Table Structural Operations ---
  const insertRow = (offset: number) => {
    if (!selection) return;
    const rIdx = selection.startRow + offset;
    const newRows = [...present];
    newRows.splice(rIdx, 0, Array.from({ length: present[0].length }, createEmptyCell));
    recordChange(newRows);
  };

  const deleteRow = () => {
    if (!selection || present.length <= 1) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const newRows = present.filter((_, r) => r < rMin || r > rMax);
    recordChange(newRows);
    setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  };

  const insertCol = (offset: number) => {
    if (!selection) return;
    const cIdx = selection.startCol + offset;
    const newRows = present.map(row => {
      const newRow = [...row];
      newRow.splice(cIdx, 0, createEmptyCell());
      return newRow;
    });
    recordChange(newRows);
  };

  const deleteCol = () => {
    if (!selection || present[0].length <= 1) return;
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map(row => row.filter((_, c) => c < cMin || c > cMax));
    recordChange(newRows);
    setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  };

  const transposeTable = () => {
    const rowCount = present.length, colCount = present[0].length;
    const transposed: TableCell[][] = Array.from({ length: colCount }, () => Array.from({ length: rowCount }, createEmptyCell));
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        transposed[c][r] = { ...present[r][c], rowSpan: present[r][c].colSpan, colSpan: present[r][c].rowSpan };
      }
    }
    recordChange(transposed);
    setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  };

  const mergeCells = () => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    if (rMin === rMax && cMin === cMax) return;

    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r === rMin && c === cMin) {
        return { ...cell, rowSpan: rMax - rMin + 1, colSpan: cMax - cMin + 1 };
      }
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        return { ...cell, hidden: true };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const splitCells = () => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);

    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        return { ...cell, rowSpan: 1, colSpan: 1, hidden: false };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  // --- Other Operations ---
  const handleCellChange = (r: number, c: number, text: string) => {
    const newRows = [...present];
    newRows[r] = [...newRows[r]];
    newRows[r][c] = { ...newRows[r][c], text };
    setPresent(newRows);
  };

  const insertSymbol = (symbol: string) => {
    if (!selection) return;
    const { startRow, startCol } = selection;
    const currentText = present[startRow][startCol].text;
    handleCellChange(startRow, startCol, currentText + symbol);
  };

  const normalizeDecimals = () => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        const num = parseFloat(cell.text);
        if (!isNaN(num)) return { ...cell, text: num.toFixed(decimalPlaces) };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const applyPreset = (preset: TablePreset) => {
    const newRows = present.map((row, r) => row.map((cell, c): TableCell => {
      const base = { ...cell, borderTop: true, borderBottom: true, borderLeft: true, borderRight: true, backgroundColor: 'transparent', bold: false };
      switch (preset) {
        case 'three-line': 
          return { ...base, borderLeft: false, borderRight: false, borderTop: r === 0, borderBottom: r === present.length - 1 || r === 0 };
        case 'ieee':
          return { ...base, borderLeft: false, borderRight: false, borderTop: r === 0, borderBottom: r === present.length - 1 || r === 0, bold: r === 0 };
        case 'nature':
          return { ...base, borderLeft: false, borderRight: false, borderTop: false, borderBottom: true, backgroundColor: r === 0 ? '#f8fafc' : 'transparent', bold: r === 0 };
        case 'science':
          return { ...base, borderLeft: false, borderRight: false, borderTop: r === 0 || r === 1, borderBottom: r === present.length - 1, bold: r === 0 };
        case 'zebra': 
          return { ...base, backgroundColor: r % 2 === 0 ? '#f1f5f9' : 'transparent' };
        case 'minimal': 
          return { ...base, borderTop: false, borderLeft: false, borderRight: false, borderBottom: true };
        default: 
          return base;
      }
    }));
    recordChange(newRows);
  };

  const handleExport = () => {
    const download = (content: any, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    };
    switch (activeFormat) {
      case 'latex': download(outputCode, 'table.tex', 'text/plain'); break;
      case 'html': download(outputCode, 'table.html', 'text/html'); break;
      case 'markdown': download(outputCode, 'table.md', 'text/markdown'); break;
      case 'csv': download(outputCode, 'table.csv', 'text/csv'); break;
      case 'json': download(outputCode, 'table.json', 'application/json'); break;
      case 'word': download(generateWord(present), 'table.doc', 'application/msword'); break;
      case 'excel': downloadExcel(present); break;
    }
  };

  const handleAiFill = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentContext = present.map(row => row.map(c => c.text).join('|')).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `I have a ${present.length}x${present[0].length} table.\nContext:\n${currentContext}\nGenerate realistic data. Return ONLY a JSON object with a "data" property (2D array of strings).`,
        config: { responseMimeType: "application/json" },
      });
      const result = JSON.parse(response.text);
      const data = result.data || result;
      if (Array.isArray(data)) {
        const newRows = present.map((row, r) => row.map((cell, c) => {
          const val = data[r] && data[r][c];
          return val !== undefined ? { ...cell, text: String(val) } : cell;
        }));
        recordChange(newRows);
      }
    } catch (error) { console.error('AI Error:', error); alert('AI failed.'); } finally { setIsAiLoading(false); }
  };

  const applyStyle = (update: Partial<TableCell>) => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map((row, r) => row.map((cell, c) => (r >= rMin && r <= rMax && c >= cMin && c <= cMax) ? { ...cell, ...update } : cell));
    recordChange(newRows);
  };

  const handleFindReplace = () => {
    if (!findText) return;
    const newRows = present.map(row => row.map(cell => {
      if (cell.text.includes(findText)) {
        return { ...cell, text: cell.text.split(findText).join(replaceText) };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const sortTable = (order: 'asc' | 'desc') => {
    if (!selection) return;
    const cIdx = selection.startCol;
    const newRows = [...present];
    newRows.sort((a, b) => {
      const valA = a[cIdx].text;
      const valB = b[cIdx].text;
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === 'asc' ? numA - numB : numB - numA;
      }
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    recordChange(newRows);
  };

  const clearFormatting = () => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map((row, r) => row.map((cell, c): TableCell => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        return { 
          ...cell, 
          bold: false, 
          italic: false, 
          underline: false, 
          color: undefined, 
          backgroundColor: 'transparent',
          align: 'left' as Alignment
        };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const handleCreateNewTable = () => {
    const r = Math.max(1, Math.min(100, newRowsCount));
    const c = Math.max(1, Math.min(50, newColsCount));
    const newRows = Array.from({ length: r }, () => Array.from({ length: c }, createEmptyCell));
    recordChange(newRows);
    setShowNewModal(false);
    setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  };

  const fillSequence = () => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    
    let currentVal = parseFloat(present[selection.startRow][selection.startCol].text);
    if (isNaN(currentVal)) currentVal = 1;

    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax && !cell.hidden) {
        const offset = (r - rMin) * (cMax - cMin + 1) + (c - cMin);
        return { ...cell, text: String(currentVal + offset) };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const transformText = (type: 'upper' | 'lower') => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) {
        return { ...cell, text: type === 'upper' ? cell.text.toUpperCase() : cell.text.toLowerCase() };
      }
      return cell;
    }));
    recordChange(newRows);
  };

  const duplicateSelectedRow = () => {
    if (!selection) return;
    const rIdx = selection.startRow;
    const rowToCopy = present[rIdx].map(cell => ({ ...cell, rowSpan: 1, colSpan: 1, hidden: false }));
    const newRows = [...present];
    newRows.splice(rIdx + 1, 0, rowToCopy);
    recordChange(newRows);
  };

  const clearAllTableText = () => {
    if (!window.confirm("确定要清空全表内容吗？（保留结构和样式）")) return;
    const newRows = present.map(row => row.map(cell => ({ ...cell, text: '' })));
    recordChange(newRows);
  };

  const modifySelectedText = useCallback((transform: (t: string) => string) => {
    if (!selection) return;
    const rMin = Math.min(selection.startRow, selection.endRow), rMax = Math.max(selection.startRow, selection.endRow);
    const cMin = Math.min(selection.startCol, selection.endCol), cMax = Math.max(selection.startCol, selection.endCol);
    const newRows = present.map((row, r) => row.map((cell, c) => {
      if (r >= rMin && r <= rMax && c >= cMin && c <= cMax && !cell.hidden) {
        return { ...cell, text: transform(cell.text) };
      }
      return cell;
    }));
    recordChange(newRows);
  }, [selection, present, recordChange]);

  const addAsterisk = (count: number) => {
    modifySelectedText(t => t + '*'.repeat(count));
  };

  const wrapParentheses = () => {
    modifySelectedText(t => `(${t})`);
  };

  const addPlusMinus = () => {
    modifySelectedText(t => t + ' ± ');
  };

  const addSuperscript2 = () => {
    modifySelectedText(t => t + '²');
  };

  const addPValue = (val: string) => {
    modifySelectedText(t => t ? `${t}, p ${val}` : `p ${val}`);
  };

  const addBatchUnit = () => {
    const unit = window.prompt("请输入要批量添加的单位（后缀）：", "mg/L");
    if (unit !== null) {
      modifySelectedText(t => t.trim() ? `${t.trim()}${unit}` : t);
    }
  };

  const formatToScientific = () => {
    modifySelectedText(t => {
      const num = parseFloat(t);
      if (!isNaN(num)) return num.toExponential(decimalPlaces);
      return t;
    });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(outputCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const ToolbarButton = ({ icon, onClick, title, disabled = false, active = false, label }: any) => (
    <button 
      onClick={onClick} 
      title={title} 
      disabled={disabled} 
      className={`flex flex-col items-center gap-1 p-1.5 hover:bg-indigo-50 rounded-lg transition-all min-w-[54px] ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
    >
      <div className="flex items-center justify-center h-6 w-6">
        {icon}
      </div>
      {label && <span className="text-[10px] font-medium leading-none whitespace-nowrap">{label}</span>}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><Grid3X3 size={24} /></div>
          <h1 className="text-xl font-bold tracking-tight">TableGen<span className="text-indigo-600">Pro</span></h1>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton icon={<Undo2 size={18}/>} onClick={undo} title="Undo (Ctrl+Z)" disabled={past.length === 0} label="撤销" />
          <ToolbarButton icon={<Redo2 size={18}/>} onClick={redo} title="Redo (Ctrl+Y)" disabled={future.length === 0} label="重做" />
          
          <div className="w-px h-8 bg-slate-200 mx-2" />
          
          <ToolbarButton 
            icon={<SquarePlus size={18} />} 
            onClick={() => setShowNewModal(true)} 
            title="Create New Table"
            label="新建"
          />
          <ToolbarButton 
            icon={<Search size={18} />} 
            onClick={() => setShowFindReplace(!showFindReplace)} 
            active={showFindReplace}
            title="Find & Replace"
            label="查找"
          />
          <ToolbarButton 
            icon={<Zap size={18} className={isAiLoading ? 'animate-pulse' : ''} />} 
            onClick={handleAiFill} 
            disabled={isAiLoading}
            title="AI Populate Content"
            label="AI填充"
          />
          <ToolbarButton 
            icon={<FileUp size={18} />} 
            onClick={() => setShowImportModal(true)} 
            title="Import CSV/Tab Data"
            label="导入"
          />
        </div>
      </header>

      {showFindReplace && (
        <div className="bg-indigo-50 border-b px-6 py-3 flex items-center gap-4 animate-in slide-in-from-top duration-200">
          <input value={findText} onChange={e => setFindText(e.target.value)} className="px-3 py-1.5 rounded-md border text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="查找内容..." />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)} className="px-3 py-1.5 rounded-md border text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="替换为..." />
          <button onClick={() => { handleFindReplace(); setShowFindReplace(false); }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm hover:bg-indigo-700 transition">全部替换</button>
        </div>
      )}

      <div className="bg-slate-50 border-b px-6 py-2 flex flex-wrap items-center gap-4 relative">
        {/* Structure Tools */}
        <div className="flex items-center bg-white border rounded-xl p-1 shadow-sm">
          <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
            <ToolbarButton icon={<Plus className="w-4 h-4 text-emerald-500" />} onClick={() => insertRow(0)} title="Insert Row Above" label="行前插" />
            <ToolbarButton icon={<Plus className="w-4 h-4 text-indigo-500" />} onClick={() => insertRow(1)} title="Insert Row Below" label="行后插" />
            <ToolbarButton icon={<Rows size={18} className="text-red-400"/>} onClick={deleteRow} title="Delete Selected Row(s)" label="删选中行" />
          </div>

          <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
            <ToolbarButton icon={<Plus className="w-4 h-4 text-emerald-500 rotate-90" />} onClick={() => insertCol(0)} title="Insert Column Left" label="列前插" />
            <ToolbarButton icon={<Plus className="w-4 h-4 text-indigo-500 rotate-90" />} onClick={() => insertCol(1)} title="Insert Column Right" label="列后插" />
            <ToolbarButton icon={<Columns size={18} className="text-red-400"/>} onClick={deleteCol} title="Delete Selected Column(s)" label="删选中列" />
          </div>

          <ToolbarButton icon={<FlipVertical2 size={18}/>} onClick={transposeTable} title="Transpose Table (Flip R/C)" label="行列转置" />
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <ToolbarButton icon={<Merge size={18}/>} onClick={mergeCells} title="Merge Selected Cells" label="合并单元" />
          <ToolbarButton icon={<Split size={18}/>} onClick={splitCells} title="Split Selected Cells" label="拆分单元" />
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <ToolbarButton icon={<SortAsc size={18}/>} onClick={() => sortTable('asc')} title="Sort Column Asc" label="数据排序" />
        </div>

        {/* Scientific Symbols Quick Input (Visual Previews) */}
        <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl p-1 shadow-sm overflow-x-auto max-w-[400px] no-scrollbar">
           <div className="flex items-center px-2 text-indigo-400 border-r border-indigo-200 mr-1"><Pi size={16}/></div>
           {SYMBOL_LIBRARY[0].items.map(sym => (
             <button 
               key={sym.cmd} 
               onClick={() => insertSymbol(sym.cmd)}
               className="flex flex-col items-center justify-center min-w-[32px] px-1.5 py-1 text-xs font-serif font-bold text-indigo-700 hover:bg-white rounded transition"
               title={sym.cmd}
             >
               <span className="text-sm leading-none">{sym.char}</span>
               <span className="text-[7px] opacity-40 leading-none mt-0.5 font-mono">{sym.cmd.replace('\\', '').slice(0, 4)}</span>
             </button>
           ))}
        </div>

        {/* Scientific Research Tools */}
        <div className="flex items-center bg-amber-50 border border-amber-200 rounded-xl p-1 shadow-sm">
           <ToolbarButton icon={<Asterisk size={18} className="text-amber-600" />} onClick={() => addAsterisk(1)} title="Add Significance Marker (*)" label="显著性*" />
           <ToolbarButton icon={<Plus size={18} className="text-amber-600" />} onClick={addPlusMinus} title="Add Error Marker (±)" label="误差±" />
           <ToolbarButton icon={<Type size={18} className="text-amber-600" />} onClick={wrapParentheses} title="Wrap in Parentheses ( )" label="括号( )" />
           <div className="w-px h-6 bg-amber-200 mx-1" />
           <ToolbarButton icon={<Superscript size={18} className="text-amber-600" />} onClick={addSuperscript2} title="Add Squared Symbol (²)" label="平方²" />
           <ToolbarButton icon={<FlaskConical size={18} className="text-amber-600" />} onClick={addBatchUnit} title="Batch Add Unit (Suffix)" label="批量单位" />
           <ToolbarButton icon={<Binary size={18} className="text-amber-600" />} onClick={formatToScientific} title="Format to Scientific Notation" label="科学计数" />
           <div className="w-px h-6 bg-amber-200 mx-1" />
           <ToolbarButton icon={<Variable size={18} className="text-amber-600" />} onClick={() => addPValue("< 0.05")} title="Quick Add p < 0.05" label="p < .05" />
           <ToolbarButton icon={<Sigma size={18} className="text-amber-600" />} onClick={() => addPValue("< 0.01")} title="Quick Add p < 0.01" label="p < .01" />
           <div className="w-px h-6 bg-amber-200 mx-1" />
           <ToolbarButton icon={<Omega size={18} className="text-amber-600" />} onClick={() => setShowSymbolModal(true)} title="Open Rich Symbol Gallery" label="Ω 符号库" />
        </div>

        {/* Advanced Data Tools */}
        <div className="flex items-center bg-white border rounded-xl p-1 shadow-sm">
           <ToolbarButton icon={<ListOrdered size={18} className="text-indigo-500" />} onClick={fillSequence} title="Auto Fill Sequence (1,2,3...)" label="序列填充" />
           <ToolbarButton icon={<CopyPlus size={18} className="text-blue-500" />} onClick={duplicateSelectedRow} title="Clone Selected Row" label="行克隆" />
           <div className="w-px h-6 bg-slate-200 mx-1" />
           <ToolbarButton icon={<CaseUpper size={18} />} onClick={() => transformText('upper')} title="Convert to Uppercase" label="大写" />
           <ToolbarButton icon={<CaseLower size={18} />} onClick={() => transformText('lower')} title="Convert to Lowercase" label="小写" />
           <div className="w-px h-6 bg-slate-200 mx-1" />
           <ToolbarButton icon={<XCircle size={18} className="text-orange-500" />} onClick={clearAllTableText} title="Clear All Table Content" label="全表清空" />
        </div>

        {/* Formatting Tools */}
        <div className="flex items-center bg-white border rounded-xl p-1 shadow-sm">
          <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => applyStyle({ align: 'left' })} title="Align Left" label="左对齐" />
          <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => applyStyle({ align: 'center' })} title="Align Center" label="居中" />
          <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => applyStyle({ align: 'right' })} title="Align Right" label="右对齐" />
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <ToolbarButton icon={<Bold size={18}/>} onClick={() => applyStyle({ bold: !selection ? false : !present[selection.startRow][selection.startCol].bold })} title="Bold" label="文字加粗" />
          <ToolbarButton icon={<Eraser size={18}/>} onClick={clearFormatting} title="Clear Formatting" label="清除格式" />
        </div>

        {/* Decimal & Stats */}
        <div className="flex items-center bg-white border rounded-xl p-1 shadow-sm gap-1 pr-2">
          <div className="flex flex-col items-center px-1">
            <input 
              type="number" 
              value={decimalPlaces} 
              onChange={(e) => setDecimalPlaces(Math.max(0, parseInt(e.target.value) || 0))} 
              className="w-10 px-1 py-0.5 text-xs border rounded text-center outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
            />
            <span className="text-[10px] text-slate-400 font-medium">位数</span>
          </div>
          <ToolbarButton icon={<Hash size={16} />} onClick={normalizeDecimals} title="Round to Decimals" label="数值舍入" />
        </div>

        <div className="flex items-center gap-2">
          <ColorPicker icon={<Type size={18} />} activeColor={activeTextColor} options={COLORS} onSelect={(color: string) => applyStyle({ color })} title="Text Color" label="文字" />
          <ColorPicker icon={<PaintBucket size={18} />} activeColor={activeBgColor} options={BG_COLORS} onSelect={(backgroundColor: string) => applyStyle({ backgroundColor })} title="Background Color" label="背景" />
          
          <div className="relative group">
            <button className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 border rounded-xl bg-white text-xs font-bold hover:bg-slate-50 transition shadow-sm h-[54px] min-w-[64px]">
              <LayoutTemplate size={16} />
              <span className="text-[10px]">表格风格</span>
            </button>
            <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border rounded-xl shadow-xl z-[60] w-56 overflow-hidden">
              <PresetItem label="标准边框" onClick={() => applyPreset('default')} />
              <PresetItem label="标准三线表 (booktabs)" onClick={() => applyPreset('three-line')} />
              <PresetItem label="IEEE Trans. 期刊风格" onClick={() => applyPreset('ieee')} />
              <PresetItem label="Nature 顶刊风格" onClick={() => applyPreset('nature')} />
              <PresetItem label="Science 顶刊风格" onClick={() => applyPreset('science')} />
              <PresetItem label="斑马纹主题" onClick={() => applyPreset('zebra')} />
              <PresetItem label="极简底线" onClick={() => applyPreset('minimal')} />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-160px)] overflow-hidden">
        <div className="flex-1 overflow-auto p-12 bg-slate-200/50 flex items-start justify-center">
          <div className="bg-white p-8 shadow-2xl rounded-2xl border min-w-fit">
            <table className="border-collapse bg-white select-none">
              <tbody>
                {present.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => {
                      if (cell.hidden) return null;
                      const rMin = selection ? Math.min(selection.startRow, selection.endRow) : -1;
                      const rMax = selection ? Math.max(selection.startRow, selection.endRow) : -1;
                      const cMin = selection ? Math.min(selection.startCol, selection.endCol) : -1;
                      const cMax = selection ? Math.max(selection.startCol, selection.endCol) : -1;
                      const isSelected = selection && r >= rMin && r <= rMax && c >= cMin && c <= cMax;
                      const isEditing = editingCell?.r === r && editingCell?.c === c;

                      return (
                        <td 
                          key={c} rowSpan={cell.rowSpan} colSpan={cell.colSpan}
                          className="p-0 relative transition-all duration-75 min-h-[44px] min-w-[140px]"
                          style={{
                            borderTop: cell.borderTop ? '1px solid #cbd5e1' : 'none',
                            borderBottom: cell.borderBottom ? '1px solid #cbd5e1' : 'none',
                            borderLeft: cell.borderLeft ? '1px solid #cbd5e1' : 'none',
                            borderRight: cell.borderRight ? '1px solid #cbd5e1' : 'none',
                            backgroundColor: isSelected ? '#e0e7ff' : (cell.backgroundColor || 'transparent'),
                          }}
                          onMouseDown={(e) => {
                            if (isEditing) return;
                            if (e.shiftKey && selection) setSelection({ ...selection, endRow: r, endCol: c });
                            else setSelection({ startRow: r, startCol: c, endRow: r, endCol: c });
                          }}
                          onMouseEnter={(e) => {
                            if (e.buttons === 1 && selection && !isEditing) setSelection({ ...selection, endRow: r, endCol: c });
                          }}
                          onDoubleClick={() => setEditingCell({ r, c })}
                        >
                          {isEditing ? (
                            <textarea
                              ref={textareaRef} value={cell.text}
                              onChange={(e) => handleCellChange(r, c, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              className={`absolute inset-0 w-full h-full p-3 resize-none bg-white z-20 outline-indigo-500 shadow-xl ${cell.bold ? 'font-bold' : ''}`}
                              style={{ color: cell.color || 'inherit', textAlign: cell.align as any }}
                            />
                          ) : (
                            <div className={`w-full h-full p-3 whitespace-pre-wrap min-h-[44px] ${cell.bold ? 'font-bold' : ''}`} style={{ color: cell.color || 'inherit', textAlign: cell.align as any }}>{cell.text}</div>
                          )}
                          {isSelected && !isEditing && <div className="absolute inset-0 border-2 border-indigo-500 pointer-events-none z-10" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="w-full md:w-[480px] bg-slate-900 text-slate-100 border-l flex flex-col shadow-2xl overflow-hidden relative">
          <div className="flex items-center p-2 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 overflow-x-auto no-scrollbar">
            {['latex', 'html', 'markdown', 'word', 'excel', 'csv', 'json'].map((id) => (
              <button 
                key={id} 
                onClick={() => setActiveFormat(id as ExportFormat)} 
                className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${activeFormat === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              >
                {id}
              </button>
            ))}
          </div>

          {/* LaTeX Advanced Config Area */}
          {activeFormat === 'latex' && (
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 space-y-3 animate-in fade-in duration-300">
               <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <ChevronRightSquare size={14}/>
                  <span className="text-[10px] font-bold uppercase tracking-wider">LaTeX 高级设置</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-bold">表格标题 (Caption)</label>
                    <input 
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500" 
                      value={latexCaption} onChange={e => setLatexCaption(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-bold">标签 (Label)</label>
                    <input 
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500" 
                      value={latexLabel} onChange={e => setLatexLabel(e.target.value)}
                    />
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" checked={autoEscapeLatex} onChange={e => setAutoEscapeLatex(e.target.checked)}
                      className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200">自动转义 (&, $, %)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" checked={useTabularx} onChange={e => setUseTabularx(e.target.checked)}
                      className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-200">使用 Tabularx</span>
                 </label>
               </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-6 relative group bg-slate-950/50 scroll-smooth">
             <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopyCode}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xl border border-indigo-400/30 transition-all active:scale-95"
                >
                  {copied ? <><Check size={14}/> 已复制</> : <><Copy size={14}/> 复制代码</>}
                </button>
             </div>
             <pre className="font-mono text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-all text-indigo-200/90 selection:bg-indigo-500/30">{outputCode}</pre>
          </div>
          
          <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
             {selectionStats && (
               <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                 <Calculator size={12} />
                 <span>计数: {selectionStats.count}</span>
                 {selectionStats.sum !== undefined && <span>总和: {selectionStats.sum.toLocaleString()}</span>}
                 {selectionStats.avg !== undefined && <span>平均: {selectionStats.avg.toFixed(decimalPlaces)}</span>}
               </div>
             )}
             <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2" onClick={handleExport}>
               <Download size={18} /> 导出表格文件
             </button>
          </div>
        </aside>
      </main>

      {/* Symbol Modal (Rich Symbol Gallery) */}
      {showSymbolModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                <Omega size={24} className="text-indigo-600"/> LaTeX 科学符号库
              </h2>
              <button onClick={() => setShowSymbolModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 no-scrollbar">
              {SYMBOL_LIBRARY.map((group, idx) => (
                <section key={idx}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">{group.category}</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {group.items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          insertSymbol(item.cmd);
                          // We don't close modal to allow batch entry
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg transition-all group"
                        title={item.cmd}
                      >
                        <span className="text-xl font-serif leading-none mb-1">{item.char}</span>
                        <span className="text-[8px] font-mono opacity-60 group-hover:opacity-100 overflow-hidden text-ellipsis whitespace-nowrap w-full text-center">
                          {item.cmd.replace('\\', '')}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 italic">提示：点击符号将 LaTeX 代码插入当前单元格末尾。</p>
              <button onClick={() => setShowSymbolModal(false)} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">完成选择</button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-sm:w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><SquarePlus size={20} className="text-indigo-600"/> 创建新表格</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">行数 (Rows)</label>
                <input 
                  type="number" 
                  value={newRowsCount} 
                  onChange={(e) => setNewRowsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">列数 (Columns)</label>
                <input 
                  type="number" 
                  value={newColsCount} 
                  onChange={(e) => setNewColsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" 
                />
              </div>
              <p className="text-[11px] text-slate-400 italic">注：新建操作将清空当前表格数据，您可以通过“撤销”恢复。</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewModal(false)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">取消</button>
              <button onClick={handleCreateNewTable} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition">立即创建</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileUp size={20} className="text-indigo-600"/> 导入外部数据 (CSV/Tab)</h2>
            <textarea 
              value={importText} 
              onChange={(e) => setImportText(e.target.value)} 
              className="w-full h-64 p-4 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4" 
              placeholder="请粘贴 CSV 或 Excel 复制的数据..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">取消</button>
              <button onClick={() => {
                const rows = importText.trim().split('\n').map(line => line.split(line.includes('\t') ? '\t' : ',').map(val => ({ ...createEmptyCell(), text: val.trim() })));
                if (rows.length > 0) recordChange(rows);
                setShowImportModal(false);
              }} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition">执行导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ColorPicker = ({ icon, options, onSelect, activeColor, title, label }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex flex-col items-center justify-center gap-1 w-[54px] h-[54px] border rounded-xl bg-white hover:bg-slate-50 transition shadow-sm group"
        title={title}
      >
        <div className="text-slate-600 group-hover:text-indigo-600 transition-colors">{icon}</div>
        <div className="w-[20px] h-[3px] rounded-full mt-0.5" style={{ backgroundColor: activeColor }} />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 p-3 bg-white border rounded-xl shadow-2xl z-[80] grid grid-cols-5 gap-1.5 min-w-[160px]">
            {options.map((c: string) => (
              <button 
                key={c} 
                onClick={() => { onSelect(c); setOpen(false); }} 
                className="w-7 h-7 rounded-md border shadow-sm transition hover:scale-110" 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const PresetItem = ({ label, onClick }: any) => (
  <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b last:border-b-0">{label}</button>
);
