"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type CheckoutOrderPayload,
  type CheckoutPaymentMethod,
} from "@/lib/checkout/checkout-api";
import { VIETNAM_PROVINCES } from "@/lib/checkout/vietnam-provinces";
import { validateEmail, validatePhoneNumber } from "@/lib/validator";
import { cn } from "@/lib/utils";

type CheckoutFormProps = {
  isSubmitting?: boolean;
  onSubmit: (payload: CheckoutOrderPayload) => void;
};

type CheckoutFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  provinceOrCity: string;
  postalCode: string;
  phone: string;
};

type CheckoutFormField = keyof CheckoutFormValues;
type CheckoutFormErrors = Partial<Record<CheckoutFormField, string>>;
type CheckoutFormTouched = Partial<Record<CheckoutFormField, boolean>>;

const COD_PAYMENT_METHOD = "cash_on_delivery" as const;
const QR_PAYMENT_METHOD = "bank_transfer" as const;

const VALIDATION_MESSAGES: Record<string, string> = {
  "validator.required": "Please fill out this field.",
  "validator.email": "Please enter a valid email address.",
  "validator.phone_number": "Please enter a valid phone number.",
};

const initialFormValues: CheckoutFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  provinceOrCity: "",
  postalCode: "",
  phone: "",
};

function normalizeOptionalValue(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}

function translateValidationMessage(message: string): string {
  return VALIDATION_MESSAGES[message] ?? message;
}

function getRequiredError(value: string): string | undefined {
  return value.trim() === "" ? "validator.required" : undefined;
}

function validateCheckoutForm(
  values: CheckoutFormValues,
): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  const emailRequiredError = getRequiredError(values.email);
  if (emailRequiredError !== undefined) {
    errors.email = emailRequiredError;
  } else {
    const emailValidation = validateEmail(values.email.trim());
    if (emailValidation.isValid === false) {
      errors.email = emailValidation.errorMessage;
    }
  }

  errors.firstName = getRequiredError(values.firstName);
  errors.lastName = getRequiredError(values.lastName);
  errors.addressLine1 = getRequiredError(values.addressLine1);
  errors.provinceOrCity = getRequiredError(values.provinceOrCity);

  const phoneRequiredError = getRequiredError(values.phone);
  if (phoneRequiredError !== undefined) {
    errors.phone = phoneRequiredError;
  } else {
    const phoneValidation = validatePhoneNumber(values.phone.trim());
    if (phoneValidation.isValid === false) {
      errors.phone = phoneValidation.errorMessage;
    }
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value !== undefined),
  ) as CheckoutFormErrors;
}

function validateCheckoutField(
  field: CheckoutFormField,
  values: CheckoutFormValues,
): string | undefined {
  return validateCheckoutForm(values)[field];
}

function serializeCheckoutOrderPayload(
  values: CheckoutFormValues,
  paymentMethod: Extract<
    CheckoutPaymentMethod,
    "cash_on_delivery" | "bank_transfer"
  >,
): CheckoutOrderPayload {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const addressLine1 = values.addressLine1.trim();
  const provinceOrCity = values.provinceOrCity.trim();
  const phone = values.phone.trim();
  const line2 = normalizeOptionalValue(values.addressLine2);
  const postalCode = normalizeOptionalValue(values.postalCode);

  return {
    customerEmail: values.email.trim(),
    shippingAddress: {
      recipientName: `${lastName} ${firstName}`.trim(),
      phone,
      line1: addressLine1,
      ...(line2 === undefined ? {} : { line2 }),
      city: provinceOrCity,
      province: provinceOrCity,
      ...(postalCode === undefined ? {} : { postalCode }),
      country: "Vietnam",
    },
    paymentMethod,
  };
}

function validateAndSerializeCheckoutOrderPayload(
  values: CheckoutFormValues,
  paymentMethod: Extract<
    CheckoutPaymentMethod,
    "cash_on_delivery" | "bank_transfer"
  >,
):
  | { errors: CheckoutFormErrors; payload?: undefined }
  | { errors: CheckoutFormErrors; payload: CheckoutOrderPayload } {
  const errors = validateCheckoutForm(values);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors: {},
    payload: serializeCheckoutOrderPayload(values, paymentMethod),
  };
}

type CheckoutTextInputProps = {
  field: CheckoutFormField;
  label: string;
  value: string;
  onChange: (field: CheckoutFormField, value: string) => void;
  onBlur?: (field: CheckoutFormField) => void;
  errorMessage?: string;
  type?: string;
  className?: string;
};

function CheckoutTextInput({
  field,
  label,
  value,
  onChange,
  onBlur,
  errorMessage,
  type = "text",
  className,
}: CheckoutTextInputProps) {
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">{label}</span>
      <Input
        type={type}
        value={value}
        placeholder={label}
        aria-invalid={errorMessage !== undefined}
        onChange={(event) => {
          onChange(field, event.target.value);
        }}
        onBlur={() => {
          onBlur?.(field);
        }}
        className={cn(
          "h-12 rounded-md border-[#d8d3cc] bg-white px-4 font-afacad text-[15px] text-black shadow-none placeholder:text-black/45 focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0",
          errorMessage !== undefined && "border-[#b14638] focus-visible:ring-[#b14638]",
        )}
      />
      {errorMessage !== undefined ? (
        <p className="mt-2 font-afacad text-[13px] text-[#b14638]">
          {translateValidationMessage(errorMessage)}
        </p>
      ) : null}
    </label>
  );
}

function CheckoutRadioRow({
  label,
  detail,
  checked = false,
  muted = false,
  onClick,
}: {
  label: string;
  detail?: string;
  checked?: boolean;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-4 border-[#d8d3cc] bg-white px-4 py-4 text-left font-afacad text-[15px]",
        muted && "text-black/58",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full border border-[#c9c3bb]",
            checked && "border-black",
          )}
        >
          {checked ? <span className="size-2 rounded-full bg-black" /> : null}
        </span>
        <span className="min-w-0">{label}</span>
      </div>
      {detail !== undefined ? (
        <span className="shrink-0 font-semibold uppercase">{detail}</span>
      ) : null}
    </button>
  );
}

export function CheckoutForm({
  isSubmitting = false,
  onSubmit,
}: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>(initialFormValues);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [touched, setTouched] = useState<CheckoutFormTouched>({});
  const [paymentMethod, setPaymentMethod] = useState<
    Extract<CheckoutPaymentMethod, "cash_on_delivery" | "bank_transfer">
  >(COD_PAYMENT_METHOD);

  const handleFieldChange = (field: CheckoutFormField, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (current[field] === undefined || touched[field] !== true) {
        return current;
      }

      const nextFieldError = validateCheckoutField(field, {
        ...values,
        [field]: value,
      });

      const nextErrors = { ...current };
      if (nextFieldError === undefined) {
        delete nextErrors[field];
      } else {
        nextErrors[field] = nextFieldError;
      }
      return nextErrors;
    });
  };

  const handleFieldBlur = (field: CheckoutFormField) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setErrors((current) => {
      const nextFieldError = validateCheckoutField(field, values);
      const nextErrors = { ...current };

      if (nextFieldError === undefined) {
        delete nextErrors[field];
      } else {
        nextErrors[field] = nextFieldError;
      }

      return nextErrors;
    });
  };

  const handleSubmit = () => {
    const result = validateAndSerializeCheckoutOrderPayload(values, paymentMethod);
    setErrors(result.errors);
    setTouched({
      email: true,
      firstName: true,
      lastName: true,
      addressLine1: true,
      addressLine2: true,
      provinceOrCity: true,
      postalCode: true,
      phone: true,
    });

    if (result.payload === undefined) {
      return;
    }

    onSubmit(result.payload);
  };

  return (
    <div className="mx-auto w-full max-w-140 px-6 py-8 md:px-10 lg:py-9">
      <section>
        <h1 className="font-afacad text-[20px] font-semibold text-black">
          Contact
        </h1>
        <CheckoutTextInput
          field="email"
          label="Email"
          type="email"
          value={values.email}
          errorMessage={errors.email}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          className="mt-3"
        />
      </section>

      <section className="mt-8">
        <h2 className="font-afacad text-[20px] font-semibold text-black">
          Delivery
        </h2>

        <label className="relative mt-3 block">
          <span className="sr-only">Country/Region</span>
          <select
            disabled
            className="h-12 w-full appearance-none rounded-md border border-[#d8d3cc] bg-white px-4 pr-10 font-afacad text-[15px] text-black opacity-100 focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-default disabled:text-black"
            defaultValue="Vietnam"
          >
            <option>Vietnam</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-black/52" />
        </label>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckoutTextInput
            field="firstName"
            label="First name"
            value={values.firstName}
            errorMessage={errors.firstName}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
          <CheckoutTextInput
            field="lastName"
            label="Last name"
            value={values.lastName}
            errorMessage={errors.lastName}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </div>

        <div className="mt-3 space-y-3">
          <CheckoutTextInput
            field="addressLine1"
            label="Address"
            value={values.addressLine1}
            errorMessage={errors.addressLine1}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
          <CheckoutTextInput
            field="addressLine2"
            label="Apartment, suite, etc. (optional)"
            value={values.addressLine2}
            errorMessage={errors.addressLine2}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="relative block">
              <span className="sr-only">Province/City</span>
              <select
                value={values.provinceOrCity}
                aria-invalid={errors.provinceOrCity !== undefined}
                onChange={(event) => {
                  handleFieldChange("provinceOrCity", event.target.value);
                }}
                onBlur={() => {
                  handleFieldBlur("provinceOrCity");
                }}
                className={cn(
                  "h-12 w-full appearance-none rounded-md border border-[#d8d3cc] bg-white px-4 pr-10 font-afacad text-[15px] focus:outline-none focus:ring-1 focus:ring-black",
                  values.provinceOrCity === "" ? "text-black/45" : "text-black",
                  errors.provinceOrCity !== undefined &&
                    "border-[#b14638] focus:ring-[#b14638]",
                )}
              >
                <option value="" disabled>
                  Tinh/Thanh pho
                </option>
                {VIETNAM_PROVINCES.map((province) => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-black/52" />
              {errors.provinceOrCity !== undefined ? (
                <p className="mt-2 font-afacad text-[13px] text-[#b14638]">
                  {translateValidationMessage(errors.provinceOrCity)}
                </p>
              ) : null}
            </label>

            <CheckoutTextInput
              field="postalCode"
              label="Postal code (optional)"
              value={values.postalCode}
              errorMessage={errors.postalCode}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          </div>
          <CheckoutTextInput
            field="phone"
            label="Phone"
            type="tel"
            value={values.phone}
            errorMessage={errors.phone}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-afacad text-[17px] font-semibold text-black">
          Shipping method
        </h2>
        <div className="mt-3 overflow-hidden rounded-md border border-black">
          <CheckoutRadioRow label="Standard" detail="FREE" checked />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-afacad text-[20px] font-semibold text-black">
          Payment
        </h2>
        <p className="mt-1 font-afacad text-[13px] text-black/56">
          All transactions are secure and encrypted.
        </p>

        <div className="mt-3 overflow-hidden rounded-md border border-[#d8d3cc] bg-white">
          <div className="border-b border-[#d8d3cc]">
            <CheckoutRadioRow
              label="Cash on delivery (COD)"
              checked={paymentMethod === COD_PAYMENT_METHOD}
              onClick={() => {
                setPaymentMethod(COD_PAYMENT_METHOD);
              }}
            />
          </div>
          <div className="border-b border-[#d8d3cc]">
            <CheckoutRadioRow
              label="QR code"
              checked={paymentMethod === QR_PAYMENT_METHOD}
              onClick={() => {
                setPaymentMethod(QR_PAYMENT_METHOD);
              }}
            />
          </div>
          <div className="bg-[#f7f5f2] px-4 py-4 text-center font-afacad text-[13px] leading-5 text-black/65">
            {paymentMethod === COD_PAYMENT_METHOD
              ? "You will pay directly when your order arrives."
              : "You will be redirected to PayOS to complete your QR payment."}
          </div>
        </div>
      </section>

      <Button
        type="button"
        disabled={isSubmitting}
        className="mt-6 h-12 w-full rounded-md bg-black font-afacad text-[15px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-black/90"
        onClick={handleSubmit}
      >
        {isSubmitting
          ? paymentMethod === COD_PAYMENT_METHOD
            ? "Placing order"
            : "Redirecting to PayOS"
          : "Place order"}
      </Button>

      <footer className="mt-10 border-t border-[#d8d3cc] pt-5">
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-afacad text-[13px] text-black underline underline-offset-2">
          <a href="#">Refund policy</a>
          <a href="#">Shipping</a>
          <a href="#">Privacy policy</a>
          <a href="#">Terms of service</a>
        </div>
      </footer>
    </div>
  );
}
