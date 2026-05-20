import { FrameMaterialEnum, FrameSizeEnum } from "@/lib/enums";

export type EyeglassesQuery = {
  frameType?: FrameMaterialEnum;
  frameSize?: FrameSizeEnum;
  sale?: boolean;
};

export function serializeEyeglassesQuery(params: EyeglassesQuery) {
  return {
    sale: params.sale,
    frameSize: params.frameSize,
    frameType: params.frameType,
  };
}
