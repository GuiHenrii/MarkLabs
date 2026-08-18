export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export type Permission =
  | "posts:create"
  | "posts:update"
  | "posts:delete"
  | "posts:publish"
  | "settings:manage"
  | "team:manage";

const ROLES: Record<Role, Permission[]> = {
  ADMIN: [
    "posts:create",
    "posts:update",
    "posts:delete",
    "posts:publish",
    "settings:manage",
    "team:manage",
  ],
  EDITOR: ["posts:create", "posts:update", "posts:publish"],
  VIEWER: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLES[role]?.includes(permission) ?? false;
}
