import { Types } from "mongoose";

export function readObjectId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (normalized === "" || Types.ObjectId.isValid(normalized) === false) {
    return null;
  }

  return normalized;
}

export function readPositiveInteger(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    Number.isInteger(value) === false ||
    value < 1
  ) {
    return null;
  }

  return value;
}
