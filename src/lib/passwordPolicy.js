export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_REQUIREMENT_MESSAGE =
  "كلمة المرور يجب ألا تقل عن 6 خانات، ويمكن أن تتكون من أحرف أو أرقام.";

export const NEW_PASSWORD_REQUIREMENT_MESSAGE =
  "كلمة المرور الجديدة يجب ألا تقل عن 6 خانات، ويمكن أن تتكون من أحرف أو أرقام.";

export function isPasswordAllowed(password) {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}
