export function isStaffRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}
