import type { Corporation, Persona, Role } from "./types";

/**
 * Demo accounts for the prototype's sign-in. The names are made up. The final
 * system signs people in with Google and keeps their role in the database.
 */
export const PERSONAS: Record<Role, Persona> = {
  resident: {
    role: "resident",
    name: "Farhana Islam",
    initials: "FI",
    title: "Resident, Mirpur-10",
    corporation: "DNCC",
  },
  engineer: {
    role: "engineer",
    name: "Engr. N. Akter",
    initials: "NA",
    title: "Ward engineer, Ward 2",
    corporation: "DNCC",
  },
  senior: {
    role: "senior",
    name: "Engr. S. Rahman",
    initials: "SR",
    title: "Senior engineer",
    corporation: "DNCC",
  },
  official: {
    role: "official",
    name: "Md. Kamal Hossain",
    initials: "KH",
    title: "Executive engineer",
    corporation: "DNCC",
  },
};

export const ROLES: Role[] = ["resident", "engineer", "senior", "official"];

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  engineer: "Ward engineer",
  senior: "Senior engineer",
  official: "Official",
};

export function isOfficer(role: Role | null): boolean {
  return role === "engineer" || role === "senior" || role === "official";
}

/**
 * Who is responsible for a ward. The final system looks the engineer up in the
 * corporation's roster; here the post is recorded rather than a name.
 */
export function wardEngineer(corporation: Corporation, ward: number): string {
  return `Ward ${ward} engineer, ${corporation}`;
}

/** Where each kind of person lands after signing in. */
export function roleHome(role: Role): string {
  return role === "resident" ? "/complaints" : "/dashboard";
}

export const RESIDENTS: Role[] = ["resident"];
export const OFFICERS: Role[] = ["engineer", "senior", "official"];

/** Whether a role may open a page. The prototype checks this in the browser. */
export function canOpen(role: Role, path: string): boolean {
  if (path === "/report" || path === "/complaints") return role === "resident";
  if (path.startsWith("/complaints/")) return true;
  if (path.startsWith("/dashboard") || path.startsWith("/hotspots")) return isOfficer(role);
  return true;
}
