import { fetchCollectionProductsBatch } from "@/lib/model";
import { CollectionListShell } from "@/components/products/view-by-collection/collection-list-shell";
import { parseProductsQueryState, toPlainObject } from "@/lib/model/misc";
import { getSingleSearchParam } from "@/app/utils/search-params";

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const queryParams = await searchParams;
  const queryState = parseProductsQueryState({
    sort: getSingleSearchParam(queryParams.sort),
    frameType: getSingleSearchParam(queryParams.frameType),
    frameSize: getSingleSearchParam(queryParams.frameSize),
  });

  // Đã gỡ bỏ logic fetchCollectionFilters() và notFound() gây lỗi 404
  // Gọi trực tiếp API, backend sẽ tự xử lý trả về danh sách rỗng nếu slug không tồn tại
  const collectionProducts = await fetchCollectionProductsBatch(
    slug,
    0,
    12,
    queryState,
  );

  return (
    <CollectionListShell
      collectionSlug={slug}
      initialData={toPlainObject(collectionProducts)}
    />
  );
}
