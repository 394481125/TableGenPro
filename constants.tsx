
import { TableCell } from './types';

export const DEFAULT_ROWS = 5;
export const DEFAULT_COLS = 5;

export const createEmptyCell = (): TableCell => ({
  text: '',
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
  rowSpan: 1,
  colSpan: 1,
  hidden: false,
  borderTop: true,
  borderBottom: true,
  borderLeft: true,
  borderRight: true,
});

export const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
];

export const BG_COLORS = [
  '#ffffff', '#f1f5f9', '#fee2e2', '#ffedd5', '#fef3c7', '#d1fae5', '#dbeafe', '#e0e7ff', '#ede9fe', '#fae8ff'
];
