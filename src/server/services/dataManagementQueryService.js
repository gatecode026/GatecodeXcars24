// DataManagementQueryService.js
// Shared, secure query engine for Data Table, CSV Export, PDF Export, and Filter Counts.

export const DATA_MANAGEMENT_COLUMNS = [
  // ── Appointment ──
  { key: "PUB_APPT_ID", label: "Appointment ID", type: "text", category: "Appointment", defaultVisible: true },
  { key: "LEAD_DATE", label: "Lead Date", type: "date", category: "Appointment", defaultVisible: true },
  { key: "APPT_STATUS", label: "Appointment Status", type: "enum", category: "Appointment", defaultVisible: true },
  { key: "VERIFIED", label: "Verified", type: "boolean", category: "Appointment", defaultVisible: true },
  { key: "OAD", label: "Orig Appt Date (OAD)", type: "date", category: "Appointment", defaultVisible: false },
  { key: "CAD", label: "Cust Appt Date (CAD)", type: "date", category: "Appointment", defaultVisible: false },
  { key: "DCD", label: "Deal Closed Date (DCD)", type: "date", category: "Appointment", defaultVisible: false },
  { key: "APPT_REGION", label: "Appointment Region", type: "enum", category: "Appointment", defaultVisible: true },

  // ── Vehicle ──
  { key: "MAKE_NAME", label: "Make", type: "enum", category: "Vehicle", defaultVisible: true },
  { key: "MODEL_NAME", label: "Model", type: "text", category: "Vehicle", defaultVisible: true },
  { key: "LEAD_YEAR", label: "Lead Year", type: "number", category: "Vehicle", defaultVisible: true },
  { key: "INSP_MAKE", label: "Inspection Make", type: "enum", category: "Vehicle", defaultVisible: false },
  { key: "INSP_MODEL", label: "Inspection Model", type: "text", category: "Vehicle", defaultVisible: false },
  { key: "INSP_YEAR", label: "Inspection Year", type: "number", category: "Vehicle", defaultVisible: false },
  { key: "ODOMETER_READING", label: "Odometer (KM)", type: "number", category: "Vehicle", defaultVisible: true },

  // ── Store ──
  { key: "LATEST_STORE_NAME", label: "Store Name", type: "enum", category: "Store", defaultVisible: true },
  { key: "LATEST_STORE_TYPE", label: "Store Type", type: "text", category: "Store", defaultVisible: false },
  { key: "LATEST_INSPECTION_STORE", label: "Inspection Store", type: "text", category: "Store", defaultVisible: false },
  { key: "INSP_REGION", label: "Inspection Region", type: "enum", category: "Store", defaultVisible: false },

  // ── Inspection ──
  { key: "FIRST_INSP_DATE", label: "First Inspection Date", type: "date", category: "Inspection", defaultVisible: false },
  { key: "LATEST_INSP_DATE", label: "Latest Inspection Date", type: "date", category: "Inspection", defaultVisible: true },
  { key: "INSP_RATING", label: "Inspection Rating", type: "text", category: "Inspection", defaultVisible: true },

  // ── Purchase & Quotes ──
  { key: "TOKEN_DATE", label: "Token Date", type: "date", category: "Purchase", defaultVisible: false },
  { key: "STOCKIN_DATE", label: "Stock-in Date", type: "date", category: "Purchase", defaultVisible: false },
  { key: "LATEST_AUCTION_DATE", label: "Auction Date", type: "date", category: "Purchase", defaultVisible: false },
  { key: "GS_BOUGHT", label: "GS Bought", type: "text", category: "Purchase", defaultVisible: false },
  { key: "C24QUOTE", label: "C24 Quote (₹)", type: "number", category: "Purchase", defaultVisible: true },
  { key: "C24QUOTE_AT_BOUGHT", label: "Quote at Bought (₹)", type: "number", category: "Purchase", defaultVisible: false },
  { key: "LATEST_TP", label: "Latest TP (₹)", type: "number", category: "Purchase", defaultVisible: false },
  { key: "LATEST_HB", label: "Latest HB (₹)", type: "number", category: "Purchase", defaultVisible: false },

  // ── Associate & Agent ──
  { key: "RETAIL_ASSOCIATE_EMAIL", label: "Retail Associate Email", type: "text", category: "Associate", defaultVisible: false },
  { key: "PLL_EMAIL", label: "PLL Email", type: "text", category: "Associate", defaultVisible: false },
  { key: "DSA_AGENT", label: "DSA Agent Email", type: "text", category: "Associate", defaultVisible: true },
  { key: "DSA_NAME", label: "DSA Name", type: "enum", category: "Associate", defaultVisible: true },
  { key: "DSA_CEP", label: "DSA CEP", type: "text", category: "Associate", defaultVisible: false },

  // ── Operational ──
  { key: "GROWTH_FLAG", label: "Growth Flag", type: "enum", category: "Operational", defaultVisible: false },
  { key: "OPS_STATUS", label: "Ops Status", type: "enum", category: "Operational", defaultVisible: true },
  { key: "GSFLAG", label: "GS Flag", type: "text", category: "Operational", defaultVisible: false },
  { key: "IS_REG_NO_MISMATCH", label: "Reg No Mismatch", type: "text", category: "Operational", defaultVisible: false },

  // ── Metrics ──
  { key: "APPOINTMENTS", label: "Appointments", type: "number", category: "Metrics", defaultVisible: false },
  { key: "INSPECTIONS", label: "Inspections", type: "number", category: "Metrics", defaultVisible: false },
  { key: "TOKENS", label: "Tokens", type: "number", category: "Metrics", defaultVisible: false },
  { key: "STOCKINS", label: "Stock-Ins", type: "number", category: "Metrics", defaultVisible: false },
  { key: "PICKUPS", label: "Pickups", type: "number", category: "Metrics", defaultVisible: false },
  { key: "CANCELLED_APPTS", label: "Cancelled Appts", type: "number", category: "Metrics", defaultVisible: false },
  { key: "UNVERIFIED_APPTS", label: "Unverified Appts", type: "number", category: "Metrics", defaultVisible: false }
];

const COLUMN_TYPE_MAP = new Map(DATA_MANAGEMENT_COLUMNS.map((c) => [c.key, c.type]));

// Helper to escape regex special characters
const escapeRegex = (string) => {
  return String(string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Date range calculation helpers
export const getDateBounds = (preset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last_7_days") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last_30_days") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "this_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day - 6);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "this_month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "this_quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    start.setMonth(currentQuarter * 3, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth((currentQuarter + 1) * 3, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "this_year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last_year") {
    start.setFullYear(start.getFullYear() - 1, 0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(end.getFullYear() - 1, 11, 31);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

/**
 * Builds a single leaf Mongo query predicate for a given field and operator.
 */
export const buildFieldPredicate = (field, operator, value, from, to) => {
  if (!field) return null;

  // Determine field type (standard or custom)
  const isCustom = !COLUMN_TYPE_MAP.has(field);
  const mongoField = isCustom ? `customFields.${field}` : field;
  const fieldType = COLUMN_TYPE_MAP.get(field) || "text";

  switch (operator) {
    // ── TEXT & EXACT MATCH OPERATORS ──
    case "equals": {
      if (fieldType === "date") {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        const dStart = new Date(d);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setHours(23, 59, 59, 999);
        return { [mongoField]: { $gte: dStart, $lte: dEnd } };
      }
      if (fieldType === "number") {
        const num = Number(value);
        return isNaN(num) ? null : { [mongoField]: num };
      }
      if (fieldType === "boolean") {
        const b = value === true || value === "true" || value === "yes" || value === "Yes";
        return { [mongoField]: b };
      }
      return { [mongoField]: { $regex: `^${escapeRegex(value)}$`, $options: "i" } };
    }
    case "not_equals": {
      if (fieldType === "date") {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        const dStart = new Date(d);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setHours(23, 59, 59, 999);
        return { [mongoField]: { $not: { $gte: dStart, $lte: dEnd } } };
      }
      if (fieldType === "number") {
        const num = Number(value);
        return isNaN(num) ? null : { [mongoField]: { $ne: num } };
      }
      return { [mongoField]: { $not: { $regex: `^${escapeRegex(value)}$`, $options: "i" } } };
    }
    case "contains":
      return { [mongoField]: { $regex: escapeRegex(value), $options: "i" } };
    case "does_not_contain":
      return { [mongoField]: { $not: { $regex: escapeRegex(value), $options: "i" } } };
    case "starts_with":
      return { [mongoField]: { $regex: `^${escapeRegex(value)}`, $options: "i" } };
    case "ends_with":
      return { [mongoField]: { $regex: `${escapeRegex(value)}$`, $options: "i" } };
    case "is_empty":
      return {
        $or: [
          { [mongoField]: null },
          { [mongoField]: { $exists: false } },
          { [mongoField]: "" }
        ]
      };
    case "is_not_empty":
      return {
        [mongoField]: { $exists: true, $ne: null, $nin: ["", null] }
      };

    // ── NUMBER OPERATORS ──
    case "greater_than": {
      const num = Number(value);
      return isNaN(num) ? null : { [mongoField]: { $gt: num } };
    }
    case "greater_than_or_equal": {
      const num = Number(value);
      return isNaN(num) ? null : { [mongoField]: { $gte: num } };
    }
    case "less_than": {
      const num = Number(value);
      return isNaN(num) ? null : { [mongoField]: { $lt: num } };
    }
    case "less_than_or_equal": {
      const num = Number(value);
      return isNaN(num) ? null : { [mongoField]: { $lte: num } };
    }

    // ── DATE OPERATORS ──
    case "before":
    case "on_or_before": {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      d.setHours(23, 59, 59, 999);
      return { [mongoField]: { $lte: d } };
    }
    case "after":
    case "on_or_after": {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return { [mongoField]: { $gte: d } };
    }
    case "between":
    case "custom_range": {
      if (fieldType === "number") {
        const min = Number(from);
        const max = Number(to);
        const cond = {};
        if (!isNaN(min)) cond.$gte = min;
        if (!isNaN(max)) cond.$lte = max;
        return Object.keys(cond).length > 0 ? { [mongoField]: cond } : null;
      }
      // Date between
      const dFrom = from ? new Date(from) : null;
      const dTo = to ? new Date(to) : null;
      const cond = {};
      if (dFrom && !isNaN(dFrom.getTime())) {
        dFrom.setHours(0, 0, 0, 0);
        cond.$gte = dFrom;
      }
      if (dTo && !isNaN(dTo.getTime())) {
        dTo.setHours(23, 59, 59, 999);
        cond.$lte = dTo;
      }
      return Object.keys(cond).length > 0 ? { [mongoField]: cond } : null;
    }

    // Date presets
    case "today":
    case "yesterday":
    case "last_7_days":
    case "last_30_days":
    case "this_week":
    case "last_week":
    case "this_month":
    case "last_month":
    case "this_quarter":
    case "this_year":
    case "last_year": {
      const { start, end } = getDateBounds(operator);
      return { [mongoField]: { $gte: start, $lte: end } };
    }

    // ── BOOLEAN OPERATORS ──
    case "true":
    case "yes":
      return { [mongoField]: true };
    case "false":
    case "no":
      return { [mongoField]: false };

    // ── MULTI-SELECT / ENUM ──
    case "is_any_of":
    case "in": {
      const arr = Array.isArray(value)
        ? value
        : typeof value === "string"
        ? value.split(",").map((s) => s.trim()).filter(Boolean)
        : [value];
      return arr.length > 0 ? { [mongoField]: { $in: arr } } : null;
    }
    case "is_none_of":
    case "not_in": {
      const arr = Array.isArray(value)
        ? value
        : typeof value === "string"
        ? value.split(",").map((s) => s.trim()).filter(Boolean)
        : [value];
      return arr.length > 0 ? { [mongoField]: { $nin: arr } } : null;
    }

    default:
      if (value !== undefined && value !== null && value !== "") {
        return { [mongoField]: { $regex: escapeRegex(value), $options: "i" } };
      }
      return null;
  }
};

/**
 * Builds the complete MongoDB filter object based on search, filters array, and logic (AND/OR).
 */
export const buildMongoQuery = ({ search = "", filters = [], logic = "AND", statusQuickFilter = "" } = {}) => {
  const query = { isDeleted: false };
  const clauses = [];

  // 1. Quick Status Filter (from tab pills)
  if (statusQuickFilter && statusQuickFilter !== "all") {
    if (statusQuickFilter === "Verified") {
      clauses.push({ VERIFIED: true });
    } else if (statusQuickFilter === "Unverified") {
      clauses.push({
        $or: [
          { VERIFIED: false },
          { VERIFIED: null },
          { APPT_STATUS: { $regex: "unverified", $options: "i" } }
        ]
      });
    } else if (statusQuickFilter === "Inspected") {
      clauses.push({
        $or: [
          { APPT_STATUS: { $regex: "^INSPECTED$", $options: "i" } },
          { APPT_STATUS: { $regex: "CJ_INSPECTION_REPORT_SUBMIT", $options: "i" } },
          { FIRST_INSP_DATE: { $ne: null } }
        ]
      });
    } else if (statusQuickFilter === "Purchased") {
      clauses.push({
        $or: [
          { APPT_STATUS: { $regex: "^PURCHASED$", $options: "i" } },
          { TOKEN_DATE: { $ne: null } }
        ]
      });
    } else if (statusQuickFilter === "Auctioned") {
      clauses.push({
        $or: [
          { LATEST_AUCTION_DATE: { $ne: null } },
          { C24QUOTE: { $ne: null } }
        ]
      });
    } else {
      clauses.push({
        APPT_STATUS: { $regex: `^${escapeRegex(statusQuickFilter)}$`, $options: "i" }
      });
    }
  }

  // 2. Global Search
  if (search && String(search).trim()) {
    const term = escapeRegex(String(search).trim());
    const searchRegex = { $regex: term, $options: "i" };
    clauses.push({
      $or: [
        { PUB_APPT_ID: searchRegex },
        { MAKE_NAME: searchRegex },
        { MODEL_NAME: searchRegex },
        { INSP_MAKE: searchRegex },
        { INSP_MODEL: searchRegex },
        { APPT_REGION: searchRegex },
        { INSP_REGION: searchRegex },
        { LATEST_STORE_NAME: searchRegex },
        { DSA_NAME: searchRegex },
        { DSA_AGENT: searchRegex },
        { RETAIL_ASSOCIATE_EMAIL: searchRegex },
        { PLL_EMAIL: searchRegex },
        { OPS_STATUS: searchRegex },
        { GROWTH_FLAG: searchRegex },
        { APPT_STATUS: searchRegex }
      ]
    });
  }

  // 3. Structured Filters Array
  const filterClauses = [];
  if (Array.isArray(filters)) {
    for (const f of filters) {
      if (!f || !f.field) continue;
      const predicate = buildFieldPredicate(f.field, f.operator, f.value, f.from, f.to);
      if (predicate) {
        filterClauses.push(predicate);
      }
    }
  }

  if (filterClauses.length > 0) {
    if (String(logic).toUpperCase() === "OR") {
      clauses.push({ $or: filterClauses });
    } else {
      clauses.push({ $and: filterClauses });
    }
  }

  if (clauses.length > 0) {
    query.$and = clauses;
  }

  return query;
};

/**
 * Normalizes sort parameters safely.
 */
export const buildMongoSort = (sort = {}) => {
  const field = sort?.field || "LEAD_DATE";
  const direction = sort?.direction === "asc" ? 1 : -1;
  const isCustom = !COLUMN_TYPE_MAP.has(field);
  const mongoField = isCustom ? `customFields.${field}` : field;

  return { [mongoField]: direction, _id: direction };
};
