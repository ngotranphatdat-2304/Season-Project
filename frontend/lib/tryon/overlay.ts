import type {
  TryOnGlasses,
  TryOnModelFace,
  TryOnOverlayStyle,
  TryOnPoint,
  TryOnRenderedSize,
} from "./types";

function distance(from: TryOnPoint, to: TryOnPoint): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function midpoint(from: TryOnPoint, to: TryOnPoint): TryOnPoint {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

function rotatePoint(point: TryOnPoint, angle: number): TryOnPoint {
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
}

export function calculateTryOnOverlay(
  modelFace: TryOnModelFace,
  glasses: TryOnGlasses,
  renderedSize: TryOnRenderedSize,
): TryOnOverlayStyle | null {
  if (
    renderedSize.width <= 0 ||
    renderedSize.height <= 0 ||
    modelFace.imageWidth <= 0 ||
    modelFace.imageHeight <= 0 ||
    glasses.imageWidth <= 0 ||
    glasses.imageHeight <= 0
  ) {
    return null;
  }

  const eyesCenter = midpoint(modelFace.leftEye, modelFace.rightEye);
  const eyeDistance = distance(modelFace.leftEye, modelFace.rightEye);
  const angle =
    Math.atan2(
      modelFace.rightEye.y - modelFace.leftEye.y,
      modelFace.rightEye.x - modelFace.leftEye.x,
    ) + glasses.rotationOffset;
  const scaleX = renderedSize.width / modelFace.imageWidth;
  const scaleY = renderedSize.height / modelFace.imageHeight;
  const centerX = eyesCenter.x + modelFace.offsetX + glasses.offsetX;
  const centerY = eyesCenter.y + modelFace.offsetY + glasses.offsetY;
  const modelGlassesScale =
    modelFace.glassesScale !== undefined ? modelFace.glassesScale : 1;
  const leftLens = glasses.leftLens;
  const rightLens = glasses.rightLens;

  if (leftLens !== undefined && rightLens !== undefined) {
    const lensDistance = distance(leftLens, rightLens);

    if (lensDistance <= 0) {
      return null;
    }

    const lensCenter = midpoint(leftLens, rightLens);
    const imageScale =
      (eyeDistance / lensDistance) * glasses.scale * modelGlassesScale;
    const glassesWidth = glasses.imageWidth * imageScale;
    const glassesHeight = glasses.imageHeight * imageScale;
    const anchorFromImageCenter = {
      x: (lensCenter.x - glasses.imageWidth / 2) * imageScale,
      y: (lensCenter.y - glasses.imageHeight / 2) * imageScale,
    };
    const rotatedAnchor = rotatePoint(anchorFromImageCenter, angle);
    const imageCenterX = centerX - rotatedAnchor.x;
    const imageCenterY = centerY - rotatedAnchor.y;

    return {
      left: (imageCenterX - glassesWidth / 2) * scaleX,
      top: (imageCenterY - glassesHeight / 2) * scaleY,
      width: glassesWidth * scaleX,
      height: glassesHeight * scaleY,
      angle,
    };
  }

  const baseGlassesWidth =
    modelFace.baseGlassesWidth !== undefined
      ? modelFace.baseGlassesWidth
      : eyeDistance * 2.1;
  const glassesWidth = baseGlassesWidth * glasses.scale * modelGlassesScale;
  const glassesHeight = glassesWidth * (glasses.imageHeight / glasses.imageWidth);

  return {
    left: (centerX - glassesWidth / 2) * scaleX,
    top: (centerY - glassesHeight / 2) * scaleY,
    width: glassesWidth * scaleX,
    height: glassesHeight * scaleY,
    angle,
  };
}

export function calculateRenderedPoint(
  point: TryOnPoint,
  modelFace: TryOnModelFace,
  renderedSize: TryOnRenderedSize,
): TryOnPoint | null {
  if (
    renderedSize.width <= 0 ||
    renderedSize.height <= 0 ||
    modelFace.imageWidth <= 0 ||
    modelFace.imageHeight <= 0
  ) {
    return null;
  }

  return {
    x: point.x * (renderedSize.width / modelFace.imageWidth),
    y: point.y * (renderedSize.height / modelFace.imageHeight),
  };
}
