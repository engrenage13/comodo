export enum eDataType {
  String = "string",
  Integer = "int",
  Float = "float",
  Blob = "blob",
}

export interface iRow {
  name: string;
  type: eDataType;
  maxlength?: number;
  commentary?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  order: number;
}

export interface iCoord {
  x: number;
  y: number;
}

export interface iTable {
  id: number;
  title: string;
  rows: iRow[];
  coords: iCoord;
}
