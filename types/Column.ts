type ColumnType = "text" | "status" | "currency" | "date";

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
  editable?: boolean; 
}
