
export type Alignment = 'left' | 'center' | 'right';

export interface TableCell {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: Alignment;
  color?: string;
  backgroundColor?: string;
  rowSpan: number;
  colSpan: number;
  hidden: boolean;
  // Border states
  borderTop: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  borderRight: boolean;
}

export type ExportFormat = 'latex' | 'html' | 'markdown' | 'csv' | 'json' | 'excel' | 'word';

export interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export type TablePreset = 'default' | 'three-line' | 'zebra' | 'minimal' | 'ieee' | 'nature' | 'science';
