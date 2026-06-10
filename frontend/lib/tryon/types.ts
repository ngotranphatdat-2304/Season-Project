export type TryOnPoint = {
  x: number;
  y: number;
};

export type TryOnModelFace = {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  leftEye: TryOnPoint;
  rightEye: TryOnPoint;
  noseBridge?: TryOnPoint;
  baseGlassesWidth?: number;
  glassesScale?: number;
  offsetX: number;
  offsetY: number;
  enabled: boolean;
};

export type TryOnGlasses = {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  leftLens?: TryOnPoint;
  rightLens?: TryOnPoint;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
  enabled: boolean;
};

export type TryOnRenderedSize = {
  width: number;
  height: number;
};

export type TryOnOverlayStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
};
