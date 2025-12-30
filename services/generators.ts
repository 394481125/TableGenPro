
import { TableCell } from '../types';
import * as XLSX from 'xlsx';

/**
 * Converts a hex color to LaTeX format {R,G,B} in range [0,1]
 */
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)}`;
};

/**
 * Escapes LaTeX special characters
 */
const escapeLatex = (text: string): string => {
  return text
    .replace(/\\/g, '\\textbackslash ')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\~/g, '\\textasciitilde ')
    .replace(/\^/g, '\\textasciicircum ');
};

interface LatexOptions {
  caption?: string;
  label?: string;
  autoEscape?: boolean;
  centering?: boolean;
  useTabularx?: boolean;
}

export const generateLaTeX = (rows: TableCell[][], options: LatexOptions = {}): string => {
  if (rows.length === 0) return '';
  const colCount = rows[0].length;
  const { caption, label, autoEscape = false, centering = true, useTabularx = false } = options;
  
  const isThreeLine = rows.every(row => row.every(c => !c.borderLeft && !c.borderRight));

  let output = '% Required packages in preamble:\n';
  output += '% \\usepackage{xcolor}\n';
  output += '% \\usepackage{colortbl}\n';
  if (isThreeLine) output += '% \\usepackage{booktabs}\n';
  if (useTabularx) output += '% \\usepackage{tabularx}\n';
  output += '\n';

  output += '\\begin{table}[htbp]\n';
  if (centering) output += '  \\centering\n';
  if (caption) output += `  \\caption{${caption}}\n`;
  if (label) output += `  \\label{tab:${label}}\n`;
  
  let colSpec = '';
  for (let i = 0; i < colCount; i++) {
    const hasLeft = rows.some(r => r[i].borderLeft);
    if (hasLeft && !isThreeLine) colSpec += '|';
    // If tabularx is used, the first column or all columns can be X. Here we keep it simple.
    colSpec += useTabularx ? 'X' : 'l';
    if (i === colCount - 1) {
      const hasRight = rows.some(r => r[i].borderRight);
      if (hasRight && !isThreeLine) colSpec += '|';
    }
  }

  const env = useTabularx ? 'tabularx' : 'tabular';
  const widthParam = useTabularx ? '{\\textwidth}' : '';
  output += `  \\begin{${env}}${widthParam}{${colSpec}}\n`;

  rows.forEach((row, r) => {
    const needsTopRule = row.some(c => c.borderTop);
    if (needsTopRule) {
      if (isThreeLine) {
        output += r === 0 ? '    \\toprule\n' : '    \\midrule\n';
      } else {
        output += '    \\hline\n';
      }
    }

    const rowCells: string[] = [];
    row.forEach((cell, c) => {
      if (cell.hidden) return;
      
      let text = cell.text || '';
      if (autoEscape) text = escapeLatex(text);
      
      if (cell.backgroundColor && cell.backgroundColor !== '#ffffff' && cell.backgroundColor !== 'transparent') {
        text = `\\cellcolor[rgb]{${hexToRgb(cell.backgroundColor)}} ${text}`;
      }

      if (cell.color && cell.color !== '#000000') {
        text = `\\textcolor[rgb]{${hexToRgb(cell.color)}}{${text}}`;
      }

      if (cell.bold) text = `\\textbf{${text}}`;
      if (cell.italic) text = `\\textit{${text}}`;
      
      let cellStr = text;
      if (cell.colSpan > 1) {
        cellStr = `\\multicolumn{${cell.colSpan}}{c}{${cellStr}}`;
      }
      
      rowCells.push(cellStr);
    });
    
    output += '    ' + rowCells.join(' & ') + ' \\\\\n';

    if (r === rows.length - 1 && row.some(c => c.borderBottom)) {
      output += isThreeLine ? '    \\bottomrule\n' : '    \\hline\n';
    }
  });
  
  output += `  \\end{${env}}\n`;
  output += '\\end{table}';
  return output;
};

export const generateHTML = (rows: TableCell[][]): string => {
  let output = '<table style="border-collapse: collapse; width: 100%;">\n';
  rows.forEach((row) => {
    output += '  <tr>\n';
    row.forEach((cell) => {
      if (cell.hidden) return;
      const borderStyles = [
        cell.borderTop ? 'border-top: 1px solid black;' : 'border-top: none;',
        cell.borderBottom ? 'border-bottom: 1px solid black;' : 'border-bottom: none;',
        cell.borderLeft ? 'border-left: 1px solid black;' : 'border-left: none;',
        cell.borderRight ? 'border-right: 1px solid black;' : 'border-right: none;',
      ].join(' ');

      const styles = [
        cell.bold ? 'font-weight: bold;' : '',
        cell.italic ? 'font-style: italic;' : '',
        cell.underline ? 'text-decoration: underline;' : '',
        cell.align !== 'left' ? `text-align: ${cell.align};` : '',
        cell.color ? `color: ${cell.color};` : '',
        cell.backgroundColor ? `background-color: ${cell.backgroundColor};` : '',
        borderStyles,
        'padding: 8px;'
      ].filter(Boolean).join(' ');

      const span = `${cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : ''}${cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : ''}`;
      output += `    <td${span} style="${styles}">${cell.text}</td>\n`;
    });
    output += '  </tr>\n';
  });
  output += '</table>';
  return output;
};

export const generateMarkdown = (rows: TableCell[][]): string => {
  if (rows.length === 0) return '';
  const colCount = rows[0].length;
  let output = '';
  
  rows.forEach((row, r) => {
    output += '| ' + row.map(c => c.text || ' ').join(' | ') + ' |\n';
    if (r === 0) {
      output += '| ' + Array(colCount).fill('---').join(' | ') + ' |\n';
    }
  });
  
  return output;
};

export const generateCSV = (rows: TableCell[][]): string => {
  return rows.map(row => 
    row.map(cell => {
      let text = (cell.text || '').replace(/"/g, '""');
      return text.includes(',') ? `"${text}"` : text;
    }).join(',')
  ).join('\n');
};

export const generateJSON = (rows: TableCell[][]): string => {
  return JSON.stringify(rows.map(row => row.map(c => ({
    text: c.text,
    style: {
      bold: c.bold,
      italic: c.italic,
      align: c.align,
      color: c.color,
      bgColor: c.backgroundColor,
      borders: {
        t: c.borderTop,
        b: c.borderBottom,
        l: c.borderLeft,
        r: c.borderRight
      }
    }
  }))), null, 2);
};

export const generateWord = (rows: TableCell[][]): string => {
  const htmlBody = generateHTML(rows);
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Exported Table</title></head>
    <body>
      ${htmlBody}
    </body>
    </html>
  `.trim();
};

export const downloadExcel = (rows: TableCell[][]) => {
  const data = rows.map(row => row.map(cell => cell.text));
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TableData");
  XLSX.writeFile(wb, "table.xlsx");
};
