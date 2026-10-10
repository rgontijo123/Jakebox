// Shared between signup and reset-password so the rule (and its displayed
// hint) can't drift out of sync between the two forms.
export const PASSWORD_REQUIREMENTS_HINT =
  "At least 8 characters, including a number and a special character";

export function isPasswordValid(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}
