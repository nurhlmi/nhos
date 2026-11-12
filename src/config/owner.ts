/**
 * The only account allowed to use nhOS. Kept as plain TypeScript (no imports)
 * so the Node scripts in /scripts can import it too.
 * The database enforces the same address (see the owner_email migration).
 */
export const OWNER_EMAIL = "nurhilmi.mail@gmail.com";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === OWNER_EMAIL;
}
