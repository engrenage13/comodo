export enum eDataType {
  String = "string",
  Integer = "int",
  Float = "float",
  Blob = "blob",
}

export interface iColumn {
  name: string;
  type: eDataType;
  maxlength: string;
  commentary?: string;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isNotNull?: boolean;
  order: number;
}

export interface iCoord {
  x: number;
  y: number;
}

export interface iTable {
  id: number;
  title: string;
  columns: iColumn[];
  coords: iCoord;
}
