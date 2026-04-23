export type AppRole =
  | "patient"
  | "front_desk"
  | "hygienist"
  | "dentist"
  | "admin";

export const STAFF_ROLES: AppRole[] = [
  "front_desk",
  "hygienist",
  "dentist",
  "admin",
];

export function isStaffRole(r: AppRole) {
  return r !== "patient";
}

export function getHomePathForRole(r: AppRole) {
  return r === "patient" ? "/portal" : "/dashboard";
}
