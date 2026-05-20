export type SunglassesQuery = {
  collectionSlug?: string;
  sale?: boolean;
};

export function serializeSunglassesQuery(params: SunglassesQuery) {
  return {
    collectionSlug: params.collectionSlug,
    sale: params.sale,
  };
}
