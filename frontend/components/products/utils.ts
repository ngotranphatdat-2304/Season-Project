import { ProductTypeEnum } from "@/lib/enums";
import { EyeglassesView, SunglassesView } from "@/lib/model/type";

export type ProductCategoryKey = ProductTypeEnum;
export type ProductCategoryFilter = {
  label: string;
  slug: EyeglassesView | SunglassesView;
};

export type ProductCategoryConfig = {
  key: ProductCategoryKey;
  title: string;
  breadcrumb: string;
  filters: ProductCategoryFilter[];
};

export const productCategories: Record<
  ProductCategoryKey,
  ProductCategoryConfig
> = {
  [ProductTypeEnum.eyeglasses]: {
    key: ProductTypeEnum.eyeglasses,
    title: "Eyeglasses",
    breadcrumb: "Eyeglasses",
    filters: [
      { label: "All Eyeglasses", slug: EyeglassesView.ViewAll },
      { label: "Metal", slug: EyeglassesView.Metal },
      { label: "Acetate", slug: EyeglassesView.Acetate },
      { label: "Small", slug: EyeglassesView.Small },
      { label: "Medium", slug: EyeglassesView.Medium },
      { label: "Big", slug: EyeglassesView.Big },
      { label: "Sale", slug: EyeglassesView.Sale },
    ],
  },
  [ProductTypeEnum.sunglasses]: {
    key: ProductTypeEnum.sunglasses,
    title: "Sunglasses",
    breadcrumb: "Sunglasses",
    filters: [
      { label: "All Sunglasses", slug: SunglassesView.ViewAll },
      { label: "The Assembled", slug: SunglassesView.TheAssembled },
      { label: "The Athletes", slug: SunglassesView.TheAthletes },
      { label: "The Obsidian", slug: SunglassesView.TheObsidian },
      { label: "The Soap", slug: SunglassesView.TheSoap },
      { label: "The Office", slug: SunglassesView.TheOffice },
      { label: "The Vertebra", slug: SunglassesView.TheVertebra },
      { label: "Sale", slug: SunglassesView.Sale },
    ],
  },
};

export const isProductCategoryKey = (
  value: ProductTypeEnum,
): value is ProductCategoryKey => {
  return (
    value === ProductTypeEnum.eyeglasses || value === ProductTypeEnum.sunglasses
  );
};

export const getProductCategoryConfig = (value: ProductTypeEnum) => {
  if (isProductCategoryKey(value)) {
    return productCategories[value];
  }

  return undefined;
};

export const parseProductCategory = (
  value: string,
): ProductTypeEnum | undefined => {
  return Object.values(ProductTypeEnum).find((category) => category === value);
};
