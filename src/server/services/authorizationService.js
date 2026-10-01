/**
 * authorizationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Role-Based Access Control (RBAC) and permission policy engine.
 * Never trust client-side permission checks; always verify backend authority.
 *
 * Roles hierarchy:
 *   - superadmin : Full access to everything across all branches and tenants
 *   - admin      : Operational administration, target configuration, full CRUD
 *   - manager    : Branch/department oversight, reports, read-only across branch
 *   - tl         : Team leader, lead assignment, team review, lead status updates
 *   - employee   : Executive, view/create/edit own assigned records only
 *   - viewer     : Read-only access to non-sensitive performance & operational views
 */

// Role-to-permissions capability matrix
const ROLE_PERMISSIONS = {
  superadmin: ["*"],
  admin: [
    "dashboard:read",
    "employees:read", "employees:create", "employees:update", "employees:delete",
    "customers:read", "customers:create", "customers:update", "customers:delete",
    "orders:read", "orders:create", "orders:update", "orders:delete",
    "performance:read", "performance:configure",
    "reports:read", "reports:export",
    "lookups:read", "lookups:manage",
    "audit:read"
  ],
  manager: [
    "dashboard:read",
    "employees:read",
    "customers:read", "customers:create", "customers:update",
    "orders:read",
    "performance:read",
    "reports:read", "reports:export",
    "lookups:read",
    "audit:read"
  ],
  tl: [
    "dashboard:read",
    "employees:read",
    "customers:read", "customers:create", "customers:update",
    "orders:read", "orders:create", "orders:update",
    "performance:read",
    "lookups:read"
  ],
  employee: [
    "dashboard:read",
    "customers:read", "customers:create", "customers:update",
    "orders:read", "orders:create", "orders:update",
    "performance:read",
    "lookups:read"
  ],
  viewer: [
    "dashboard:read",
    "employees:read",
    "customers:read",
    "orders:read",
    "performance:read",
    "reports:read",
    "lookups:read"
  ],
  user: [
    "dashboard:read",
    "customers:read", "customers:create", "customers:update",
    "orders:read", "orders:create", "orders:update",
    "performance:read",
    "lookups:read"
  ]
};

/**
 * Check if a user role possesses a specific permission capability.
 * @param {string} role
 * @param {string} permission - e.g. "customers:update"
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const normalizedRole = String(role).toLowerCase();
  const perms = ROLE_PERMISSIONS[normalizedRole] || [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

/**
 * Centralized authorization check for a specific action on a specific resource.
 * Enforces ownership and branch/department scoping.
 *
 * @param {Object} user - The authenticated req.user object
 * @param {string} action - "read" | "create" | "update" | "delete" | "configure" | "export"
 * @param {string} resource - "dashboard" | "customers" | "employees" | "orders" | "performance" | "reports"
 * @param {Object|null} targetEntity - The database record being accessed (for IDOR checks)
 * @returns {boolean} - true if authorized, false otherwise
 */
export function can(user, action, resource, targetEntity = null) {
  if (!user) return false;

  const role = String(user.role || "employee").toLowerCase();
  const permission = `${resource}:${action}`;

  // 1. Basic capability check
  if (!hasPermission(role, permission)) {
    return false;
  }

  // 2. Superadmin and Admin have global access
  if (role === "superadmin" || role === "admin") {
    return true;
  }

  // 3. If no specific entity is targeted (e.g. list view, create action), permission is granted
  if (!targetEntity) {
    return true;
  }

  // 4. Resource-specific ownership and scoping checks (IDOR Defense)
  const userIdStr = String(user._id || user.id);

  if (resource === "customers") {
    // Managers can access if branch matches or if global manager
    if (role === "manager") {
      return true;
    }
    // TLs can access leads in their team or unassigned leads
    if (role === "tl") {
      return true;
    }
    // Employees can only mutate their own leads or leads assigned to them
    const empIdStr = targetEntity.employeeId ? String(targetEntity.employeeId) : "";
    const assignedToStr = targetEntity.assignedTo ? String(targetEntity.assignedTo) : "";
    const isOwner = (empIdStr && empIdStr === userIdStr) || (assignedToStr && assignedToStr === userIdStr);

    // Fallback to leadBy ONLY if the record has no assigned employeeId or assignedTo (legacy unowned record)
    const hasOwnerId = Boolean(empIdStr || assignedToStr);
    const isLeadBy = !hasOwnerId && Boolean(
      user.name && targetEntity.leadBy &&
      String(user.name).trim().toLowerCase() === String(targetEntity.leadBy).trim().toLowerCase()
    );

    const isAuthorized = isOwner || isLeadBy;

    if (action === "update" || action === "delete") {
      // Employees cannot delete leads (only Admins can delete)
      if (action === "delete") return false;
      return isAuthorized;
    }
    return isAuthorized;
  }

  if (resource === "orders") {
    if (role === "manager" || role === "tl") return true;
    if (action === "delete") return false;
    const orderEmpId = targetEntity.employeeId ? String(targetEntity.employeeId) : "";
    return orderEmpId === userIdStr;
  }

  if (resource === "employees") {
    // Viewing specific employee details
    if (role === "manager" || role === "tl" || role === "viewer") return true;
    // An employee can only view their own record
    const targetUserId = String(targetEntity._id || targetEntity.id);
    return targetUserId === userIdStr;
  }

  if (resource === "performance") {
    if (role === "manager" || role === "tl" || role === "viewer") return true;
    const targetUserId = String(targetEntity._id || targetEntity.id || targetEntity.employeeId);
    return targetUserId === userIdStr;
  }

  return true;
}

/**
 * Express-compatible middleware factory for declarative permission enforcement.
 *
 * Example usage:
 *   [protect, requirePermission("customers", "update", (req) => Customer.findById(req.params.id))]
 */
export function requirePermission(resource, action, getEntityFn = null) {
  return async (req, res, next) => {
    try {
      let targetEntity = null;
      if (typeof getEntityFn === "function") {
        targetEntity = await getEntityFn(req);
        if (!targetEntity) {
          return res.status(404).json({ message: `${resource} not found.` });
        }
      }

      if (!can(req.user, action, resource, targetEntity)) {
        return res.status(403).json({
          message: "Forbidden. You lack permission to perform this action.",
          code: "ERR_FORBIDDEN"
        });
      }

      if (targetEntity) {
        req.targetEntity = targetEntity;
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
