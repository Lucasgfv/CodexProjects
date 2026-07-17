import { hash } from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 12;

export function validatePassword(value: string) {
  if (value.length < PASSWORD_MIN_LENGTH) return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "A senha deve conter letra maiúscula, letra minúscula e número.";
  }
  return null;
}

export const hashPassword = (value: string) => hash(value, 12);

