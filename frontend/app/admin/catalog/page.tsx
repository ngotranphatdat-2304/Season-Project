"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin/auth";

type CollectionRecord = {
  id: string;
  name: string;
  slug: string;
  inStockCount: number;
};

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  type: "Eyeglasses" | "Sunglasses";
  collectionId: string;
  collectionName?: string;
  brand: string;
  salePercent: number;
  availability: "in_stock" | "out_of_stock" | "pre_order";
  description: string;
  isActive: boolean;
  specifications: {
    gender: "Male" | "Female" | "Unisex";
    frameType: {
      material: "Acetate" | "Metal";
      size: {
        label: "Small" | "Medium" | "Big";
        image: string;
      };
    };
  };
  variants: Array<{
    sku: string;
    color?: string;
    price: number;
    images: string[];
    isDefault: boolean;
    stock: number;
  }>;
};

type ProductsResponse = {
  records: ProductRecord[];
  total: number;
};

const emptyProductForm = {
  id: "",
  name: "",
  slug: "",
  type: "Eyeglasses" as ProductRecord["type"],
  collectionId: "",
  brand: "",
  salePercent: 0,
  availability: "in_stock" as ProductRecord["availability"],
  description: "",
  isActive: true,
  gender: "Unisex" as ProductRecord["specifications"]["gender"],
  material: "Acetate" as ProductRecord["specifications"]["frameType"]["material"],
  sizeLabel: "Medium" as ProductRecord["specifications"]["frameType"]["size"]["label"],
  sizeImage: "",
  sku: "",
  color: "",
  price: 0,
  stock: 1,
  image: "",
};

function buildProductPayload(form: typeof emptyProductForm) {
  return {
    name: form.name,
    slug: form.slug,
    type: form.type,
    collectionId: form.collectionId,
    brand: form.brand,
    salePercent: Number(form.salePercent),
    availability: form.availability,
    description: form.description,
    isActive: form.isActive,
    specifications: {
      gender: form.gender,
      frameType: {
        material: form.material,
        size: {
          label: form.sizeLabel,
          image: form.sizeImage,
        },
      },
    },
    variants: [
      {
        sku: form.sku,
        color: form.color.trim() === "" ? undefined : form.color,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.image.trim() === "" ? [] : [form.image],
        isDefault: true,
      },
    ],
  };
}

export default function AdminCatalogPage() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [collectionForm, setCollectionForm] = useState({ id: "", name: "", slug: "" });
  const [productForm, setProductForm] = useState(emptyProductForm);

  const loadCollections = async () => {
    const response = await adminRequest<{ records: CollectionRecord[] }>({
      url: "/admin/collections",
      method: "GET",
    });
    setCollections(response.records);
  };

  const loadProducts = async () => {
    const response = await adminRequest<ProductsResponse>({
      url: "/admin/products",
      method: "GET",
      params: {
        page: 1,
        limit: 50,
        ...(search.trim() === "" ? {} : { q: search.trim() }),
        ...(selectedCollectionId === "" ? {} : { collectionId: selectedCollectionId }),
      },
    });

    setProducts(response.records);
  };

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const response = await adminRequest<{ records: CollectionRecord[] }>({
          url: "/admin/collections",
          method: "GET",
        });

        if (isCancelled === false) {
          setCollections(response.records);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isCancelled === false) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load collections",
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const response = await adminRequest<ProductsResponse>({
          url: "/admin/products",
          method: "GET",
          params: {
            page: 1,
            limit: 50,
            ...(search.trim() === "" ? {} : { q: search.trim() }),
            ...(selectedCollectionId === "" ? {} : { collectionId: selectedCollectionId }),
          },
        });

        if (isCancelled === false) {
          setProducts(response.records);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isCancelled === false) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load products");
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [search, selectedCollectionId]);

  const collectionOptions = useMemo(
    () => collections.map((collection) => ({ value: collection.id, label: collection.name })),
    [collections],
  );

  return (
    <AdminGuard>
      {(user) => (
        <AdminShell user={user}>
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 md:max-w-[22rem]">
                <p className="font-afacad text-sm uppercase tracking-[0.3em] text-black/45">
                  Catalog
                </p>
                <h1 className="mt-2 font-serif text-4xl">Products and collections</h1>
              </div>
              <p className="min-w-0 max-w-none text-sm leading-6 text-black/55 md:flex-1 md:text-right">
                Manage your product catalog directly from the existing product model and collection references.
              </p>
            </div>

            {errorMessage !== null ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2rem] border border-black/8 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                      Collections
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">Category groups</h2>
                  </div>
                </div>

                <form
                  className="mt-6 grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();

                    const method = collectionForm.id === "" ? "POST" : "PUT";
                    const url =
                      collectionForm.id === ""
                        ? "/admin/collections"
                        : `/admin/collections/${collectionForm.id}`;

                    void adminRequest({
                      url,
                      method,
                      data: {
                        name: collectionForm.name,
                        slug: collectionForm.slug,
                      },
                    }).then(() => {
                      setCollectionForm({ id: "", name: "", slug: "" });
                      void loadCollections();
                    });
                  }}
                >
                  <Input
                    placeholder="Collection name"
                    value={collectionForm.name}
                    onChange={(event) => {
                      setCollectionForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }));
                    }}
                    required
                    className="h-12 rounded-2xl"
                  />
                  <Input
                    placeholder="collection-slug"
                    value={collectionForm.slug}
                    onChange={(event) => {
                      setCollectionForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }));
                    }}
                    required
                    className="h-12 rounded-2xl"
                  />
                  <Button type="submit" className="rounded-2xl">
                    {collectionForm.id === "" ? "Create collection" : "Update collection"}
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-[1.4rem] border border-black/8 bg-[#faf8f4] px-4 py-4 text-left"
                      onClick={() => {
                        setCollectionForm({
                          id: collection.id,
                          name: collection.name,
                          slug: collection.slug,
                        });
                      }}
                    >
                      <div>
                        <p className="font-medium">{collection.name}</p>
                        <p className="text-sm text-black/45">{collection.slug}</p>
                      </div>
                      <span className="rounded-full bg-black/6 px-3 py-1 text-xs uppercase tracking-[0.14em]">
                        {collection.inStockCount} in stock
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-black/8 bg-white p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                      Products
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">Catalog editor</h2>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      placeholder="Search product"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                      }}
                      className="h-11 w-full rounded-2xl md:w-56"
                    />
                    <select
                      value={selectedCollectionId}
                      onChange={(event) => {
                        setSelectedCollectionId(event.target.value);
                      }}
                      className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                    >
                      <option value="">All collections</option>
                      {collectionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form
                  className="mt-6 grid gap-3 md:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();

                    const payload = buildProductPayload(productForm);
                    const method = productForm.id === "" ? "POST" : "PUT";
                    const url =
                      productForm.id === ""
                        ? "/admin/products"
                        : `/admin/products/${productForm.id}`;

                    void adminRequest({
                      url,
                      method,
                      data: payload,
                    }).then(() => {
                      setProductForm(emptyProductForm);
                      void loadProducts();
                    });
                  }}
                >
                  {[
                    { key: "name", placeholder: "Product name" },
                    { key: "slug", placeholder: "product-slug" },
                    { key: "brand", placeholder: "Brand" },
                    { key: "sku", placeholder: "Default SKU" },
                    { key: "color", placeholder: "Variant color" },
                    { key: "sizeImage", placeholder: "Frame size image URL" },
                    { key: "image", placeholder: "Primary image URL" },
                  ].map((field) => (
                    <Input
                      key={field.key}
                      placeholder={field.placeholder}
                      value={productForm[field.key as keyof typeof productForm] as string}
                      onChange={(event) => {
                        setProductForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }));
                      }}
                      className="h-11 rounded-2xl"
                    />
                  ))}

                  <select
                    value={productForm.collectionId}
                    onChange={(event) => {
                      setProductForm((current) => ({
                        ...current,
                        collectionId: event.target.value,
                      }));
                    }}
                    required
                    className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                  >
                    <option value="">Select collection</option>
                    {collectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {[
                    {
                      key: "type",
                      options: ["Eyeglasses", "Sunglasses"],
                    },
                    {
                      key: "availability",
                      options: ["in_stock", "out_of_stock", "pre_order"],
                    },
                    {
                      key: "gender",
                      options: ["Male", "Female", "Unisex"],
                    },
                    {
                      key: "material",
                      options: ["Acetate", "Metal"],
                    },
                    {
                      key: "sizeLabel",
                      options: ["Small", "Medium", "Big"],
                    },
                  ].map((field) => (
                    <select
                      key={field.key}
                      value={productForm[field.key as keyof typeof productForm] as string}
                      onChange={(event) => {
                        setProductForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }));
                      }}
                      className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}

                  <Input
                    type="number"
                    placeholder="Sale percent"
                    value={productForm.salePercent}
                    onChange={(event) => {
                      setProductForm((current) => ({
                        ...current,
                        salePercent: Number(event.target.value),
                      }));
                    }}
                    className="h-11 rounded-2xl"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={productForm.price}
                    onChange={(event) => {
                      setProductForm((current) => ({
                        ...current,
                        price: Number(event.target.value),
                      }));
                    }}
                    className="h-11 rounded-2xl"
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={productForm.stock}
                    onChange={(event) => {
                      setProductForm((current) => ({
                        ...current,
                        stock: Number(event.target.value),
                      }));
                    }}
                    className="h-11 rounded-2xl"
                  />

                  <label className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 text-sm">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(event) => {
                        setProductForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }));
                      }}
                    />
                    Active product
                  </label>

                  <textarea
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(event) => {
                      setProductForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }));
                    }}
                    className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm md:col-span-2"
                  />

                  <Button type="submit" className="rounded-2xl md:col-span-2">
                    {productForm.id === "" ? "Create product" : "Update product"}
                  </Button>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-black/45">
                      <tr>
                        <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Product</th>
                        <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Collection</th>
                        <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Price</th>
                        <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Stock</th>
                        <th className="pb-3 font-afacad uppercase tracking-[0.16em]">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="cursor-pointer border-t border-black/6"
                          onClick={() => {
                            const variant = product.variants[0];

                            setProductForm({
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              type: product.type,
                              collectionId: product.collectionId,
                              brand: product.brand,
                              salePercent: product.salePercent,
                              availability: product.availability,
                              description: product.description,
                              isActive: product.isActive,
                              gender: product.specifications.gender,
                              material: product.specifications.frameType.material,
                              sizeLabel: product.specifications.frameType.size.label,
                              sizeImage: product.specifications.frameType.size.image,
                              sku: variant?.sku ?? "",
                              color: variant?.color ?? "",
                              price: variant?.price ?? 0,
                              stock: variant?.stock ?? 1,
                              image: variant?.images[0] ?? "",
                            });
                          }}
                        >
                          <td className="py-4">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-black/45">{product.slug}</p>
                          </td>
                          <td className="py-4">{product.collectionName ?? "-"}</td>
                          <td className="py-4">{product.variants[0]?.price ?? 0}</td>
                          <td className="py-4">{product.variants[0]?.stock ?? 0}</td>
                          <td className="py-4 uppercase text-black/65">
                            {product.isActive ? "active" : "inactive"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
