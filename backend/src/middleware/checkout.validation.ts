import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import type { CheckoutCompleteInput } from "../types/checkout.types.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

export interface CheckoutCompleteValidatedRequest extends Request {
  validatedBody?: CheckoutCompleteInput;
}

const VIETNAM_LANDLINE_REGEX =
  /^(?:\+84|0)(2[2-9]\d{7}|2(?:0[3-9]|1[0-689]|2[0-25-9]|3[2-9]|5[1-25-9]|6[0-39]|7[0-7]|9[0-46-79])[2-9]\d{6})$/;

const VIETNAM_MOBILE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

function isValidVietnamPhoneNumber(value: string): boolean {
  return (
    VIETNAM_MOBILE_REGEX.test(value) ||
    VIETNAM_LANDLINE_REGEX.test(value)
  );
}

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional();

const checkoutCompleteSchema = z.object({
  customerEmail: z.string().trim().email().toLowerCase(),
  shippingAddress: z.object({
    recipientName: z.string().trim().min(1),
    phone: z
      .string()
      .trim()
      .min(1)
      .refine(isValidVietnamPhoneNumber, "phone is invalid"),
    line1: z.string().trim().min(1),
    line2: optionalTrimmedString,
    ward: optionalTrimmedString,
    district: optionalTrimmedString,
    city: z.string().trim().min(1),
    province: optionalTrimmedString,
    postalCode: optionalTrimmedString,
    country: z.string().trim().min(1).default("Vietnam"),
  }),
  paymentMethod: z.union([
    z.literal("cash_on_delivery"),
    z.literal("bank_transfer"),
  ]),
});

function omitUndefinedOptionalFields(
  input: z.infer<typeof checkoutCompleteSchema>,
): CheckoutCompleteInput {
  const { shippingAddress } = input;

  return {
    customerEmail: input.customerEmail,
    paymentMethod: input.paymentMethod,
    shippingAddress: {
      recipientName: shippingAddress.recipientName,
      phone: shippingAddress.phone,
      line1: shippingAddress.line1,
      ...(shippingAddress.line2 === undefined ? {} : { line2: shippingAddress.line2 }),
      ...(shippingAddress.ward === undefined ? {} : { ward: shippingAddress.ward }),
      ...(shippingAddress.district === undefined
        ? {}
        : { district: shippingAddress.district }),
      city: shippingAddress.city,
      ...(shippingAddress.province === undefined
        ? {}
        : { province: shippingAddress.province }),
      ...(shippingAddress.postalCode === undefined
        ? {}
        : { postalCode: shippingAddress.postalCode }),
      country: shippingAddress.country,
    },
  };
}

export function validateCheckoutCompleteBody(
  req: CheckoutCompleteValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const parseResult = checkoutCompleteSchema.safeParse(req.body);

  if (parseResult.success === false) {
    next(
      AppError.badRequest(
        "Invalid checkout payload",
        "VALIDATION_ERROR",
        parseResult.error.flatten(),
      ),
    );
    return;
  }

  req.validatedBody = omitUndefinedOptionalFields(parseResult.data);
  next();
}
