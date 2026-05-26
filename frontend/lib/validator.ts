import validator from "validator";

export type ValidationResult = {
  isValid: boolean;
  errorMessage?: string;
};

const landLineRegex = [
  /^(?:\+84|0)(2[2-9]\d{7}|2(?:0[3-9]|1[0-689]|2[0-25-9]|3[2-9]|5[1-25-9]|6[0-39]|7[0-7]|9[0-46-79])[2-9]\d{6})$/,
];

function isLandlinePhoneNumber(value: string): boolean {
  for (const regex of landLineRegex) {
    if (regex.test(value)) {
      return true;
    }
  }

  return false;
}

export function validateEmail(value: string): ValidationResult {
  const isValid = validator.isEmail(value);
  return {
    isValid,
    errorMessage: isValid ? undefined : "validator.email",
  };
}

export function validateURL(value: string): ValidationResult {
  const isValid = validator.isURL(value);
  return {
    isValid,
    errorMessage: isValid ? undefined : "validator.url",
  };
}

export function validatePhoneNumber(value: string): ValidationResult {
  const normalizedValue = String(value).trim();
  const isValid =
    validator.isMobilePhone(normalizedValue, "any") ||
    isLandlinePhoneNumber(normalizedValue);

  return {
    isValid,
    errorMessage: isValid ? undefined : "validator.phone_number",
  };
}

export function validateUsername(value: string): ValidationResult {
  const regex = /^[a-zA-Z][a-zA-Z0-9-_.]{2,19}$/;
  const isValid = regex.test(value);
  return {
    isValid,
    errorMessage: isValid ? undefined : "validator.username",
  };
}
