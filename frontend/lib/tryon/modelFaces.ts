import type { TryOnModelFace } from "./types";

export const modelFaces: TryOnModelFace[] = [
  {
    id: "male-crew-front-01",
    name: "Male Crew Front",
    imageUrl: "/tryon/models/male-front-01.jpg",
    imageWidth: 1000,
    imageHeight: 1199,
    leftEye: { x: 382, y: 493 },
    rightEye: { x: 588, y: 491 },
    noseBridge: { x: 493, y: 584 },
    baseGlassesWidth: 430,
    offsetX: 0,
    offsetY: 18,
    enabled: true,
  },
  {
    id: "male-white-shirt-front-01",
    name: "Male White Shirt Front",
    imageUrl: "/tryon/models/male-front-02.jpg",
    imageWidth: 1000,
    imageHeight: 1198,
    leftEye: { x: 338, y: 458 },
    rightEye: { x: 577, y: 455 },
    noseBridge: { x: 468, y: 548 },
    baseGlassesWidth: 500,
    glassesScale: 1.02,
    offsetX: 0,
    offsetY: 14,
    enabled: true,
  },
  {
    id: "female-blazer-front-01",
    name: "Female Front",
    imageUrl: "/tryon/models/female-front-01.jpg",
    imageWidth: 1000,
    imageHeight: 1201,
    leftEye: { x: 421, y: 428 },
    rightEye: { x: 587, y: 428 },
    noseBridge: { x: 500, y: 526 },
    baseGlassesWidth: 410,
    glassesScale: 0.92,
    offsetX: 2,
    offsetY: 10,
    enabled: true,
  },
];

export const enabledModelFaces = modelFaces.filter(
  (modelFace) => modelFace.enabled === true,
);
