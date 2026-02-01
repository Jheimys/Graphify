
export interface GraphFunction {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  name: string;
}

export interface Viewport {
  centerX: number;
  centerY: number;
  scale: number;
  is3D: boolean;
  rotateX: number; // graus
  rotateY: number; // graus
}

export interface Point {
  x: number;
  y: number;
}
