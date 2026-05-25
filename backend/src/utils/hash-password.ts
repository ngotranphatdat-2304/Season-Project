import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(PASSWORD_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  enteredPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, savedPassword);
}
