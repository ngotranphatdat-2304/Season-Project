import { api } from "./api";

type DeserializeableClass<T> = {
  deser(data: unknown): T;
};

type ListResponsePayload = {
  records?: unknown[];
  total?: number;
};

export type ListResponse<T> = {
  records: T[];
  total: number;
};

export async function fetchOne<T>(
  url: string,
  Model: DeserializeableClass<T>,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await api.get(url, { params });
  const data = response.data as unknown;

  if (data === undefined) {
    throw new Error(`Missing response data from ${url}`);
  }

  return Model.deser(data);
}

export async function fetchList<T>(
  url: string,
  Model: DeserializeableClass<T>,
  params?: Record<string, unknown>,
): Promise<ListResponse<T>> {
  const response = await api.get(url, { params });
  const data = response.data as unknown;

  if (data === undefined) {
    throw new Error(`Missing response data from ${url}`);
  }

  const payload = data as ListResponsePayload;
  const records = Array.isArray(payload.records) ? payload.records : [];
  const total = typeof payload.total === "number" ? payload.total : 0;

  return {
    records: records.map((item) => Model.deser(item)),
    total,
  };
}
