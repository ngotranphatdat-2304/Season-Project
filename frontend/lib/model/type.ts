import {
  FrameMaterialEnum,
  FrameSizeEnum,
  ProductAvailabilityEnum,
  ProductGenderEnum,
  ProductTypeEnum,
} from "../enums";

export type ProductType = ProductTypeEnum;
export type ProductAvailability = ProductAvailabilityEnum;
export type ProductGender = ProductGenderEnum;
export type FrameMaterial = FrameMaterialEnum;
export type FrameSize = FrameSizeEnum;

export enum EyeglassesView {
  Acetate = "acetate",
  Metal = "metal",
  Big = "big",
  Medium = "medium",
  Small = "small",
  Sale = "sale",
  Bestsellers = "bestsellers",
  ViewAll = "view-all",
}

export enum SunglassesView {
  TheAssembled = "the-assembled",
  TheAthletes = "the-athletes",
  TheCutEdge = "the-cut-edge",
  TheObsidian = "the-obsidian",
  TheOffice = "the-office",
  TheSoap = "the-soap",
  TheVertebra = "the-vertebra",
  Sale = "sale",
  ViewAll = "view-all",
}
