export const dynamic = "force-dynamic";

import { runHandler } from "@/src/server/routeRunner";

// Middlewares
import { protect, adminOnly } from "@/src/server/middleware/authMiddleware";
import { validateRequest } from "@/src/server/middleware/validateMiddleware";

// Validators
import { loginValidator, registerValidator } from "@/src/server/validators/authValidators";
import {
  createOrderValidator,
  updateOrderStatusValidator,
  updateParcelStatusValidator
} from "@/src/server/validators/orderValidators";
import {
  createReturnRequestValidator,
  updateReturnStatusValidator
} from "@/src/server/validators/returnValidators";

// Controllers
import {
  loginAdmin,
  registerUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  logoutUser,
  getProfile,
  updateProfile,
  bulkImportUsers
} from "@/src/server/controllers/authController";

import {
  createOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
  updateParcelStatus,
  deleteOrder,
  bulkImportOrders
} from "@/src/server/controllers/orderController";

import {
  createReturnRequest,
  getReturnRequests,
  updateReturn,
  updateReturnStatus,
  deleteReturn
} from "@/src/server/controllers/returnController";

import { getDashboardSummary } from "@/src/server/controllers/dashboardController";

import {
  getEmployeeDashboard,
  getEmployeeOrdersHistory,
  getEmployeeReturnsHistory,
  updateEmployeeOrder,
  deleteEmployeeOrder,
  updateEmployeeReturn,
  deleteEmployeeReturn,
  getEmployeeCallingRecords,
  createEmployeeCallingRecord,
  updateEmployeeCallingRecord,
  deleteEmployeeCallingRecord,
  bulkImportEmployeeCallingRecords
} from "@/src/server/controllers/employeeController";

import {
  getRevenueSummary,
  getSalesSummary,
  getEmployeePerformance,
  getEmployeeHistory,
  getEmployeeSummary,
  getEmployeeDetails
} from "@/src/server/controllers/adminController";

import {
  getEmployeeRecords,
  createEmployeeRecord,
  deleteEmployeeRecord
} from "@/src/server/controllers/employeeRecordController";

import {
  getCallingRecords,
  createCallingRecord,
  deleteCallingRecord,
  bulkImportCallingRecords
} from "@/src/server/controllers/callingRecordController";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getEmployeesList,
  exportCustomersCSV,
  bulkImportCustomers
} from "@/src/server/controllers/customerController";

import { getActivities } from "@/src/server/controllers/activityController";
import {
  getPerformanceSettings,
  updatePerformanceSettings,
  getAdminPerformanceRanking,
  getAdminEmployeePerformanceDetail,
  getAdminBonusReport,
  exportBonusReportCSV,
  getMyPerformance,
  getMyDailyHistory
} from "@/src/server/controllers/performanceController";

import {
  getTLWhatsAppNumbers,
  setTLWhatsAppNumbers
} from "@/src/server/services/whatsappNotificationService";

import {
  getDepartments,
  getBranches,
  getLookups
} from "@/src/server/controllers/masterDataController";

async function dispatch(request, context) {
  const method = request.method.toUpperCase();
  const rawParams = await (context?.params || {});
  const slug = rawParams.slug || [];
  const path = "/" + slug.join("/");

  // 1. /api/auth
  if (path === "/auth/profile") {
    if (method === "GET") return runHandler(request, {}, [protect], getProfile);
    if (method === "PUT") return runHandler(request, {}, [protect], updateProfile);
  }
  if (path === "/auth/login" && method === "POST") {
    return runHandler(request, {}, [loginValidator, validateRequest], loginAdmin);
  }
  if (path === "/auth/logout" && method === "POST") {
    return runHandler(request, {}, [protect], logoutUser);
  }
  if (path === "/auth/register" && method === "POST") {
    return runHandler(request, {}, [protect, adminOnly, registerValidator, validateRequest], registerUser);
  }
  if (path === "/auth/users" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getUsers);
  }
  if ((path === "/auth/users/bulk-import" || path === "/users/bulk-import") && method === "POST") {
    return runHandler(request, {}, [protect, adminOnly], bulkImportUsers);
  }
  if (slug[0] === "auth" && slug[1] === "users" && slug[2]) {
    const params = { id: slug[2] };
    if (method === "GET") return runHandler(request, params, [protect, adminOnly], getUserById);
    if (method === "PUT") return runHandler(request, params, [protect, adminOnly], updateUser);
    if (method === "DELETE") return runHandler(request, params, [protect, adminOnly], deleteUser);
  }

  // 2. /api/orders
  if (path === "/orders/bulk-import" && method === "POST") {
    return runHandler(request, {}, [protect], bulkImportOrders);
  }
  if (path === "/orders") {
    if (method === "GET") return runHandler(request, {}, [protect, adminOnly], getOrders);
    if (method === "POST") return runHandler(request, {}, [protect, createOrderValidator, validateRequest], createOrder);
  }
  if (slug[0] === "orders" && slug[1]) {
    const id = slug[1];
    const sub = slug[2];
    const params = { id };
    if (!sub) {
      if (method === "PUT") return runHandler(request, params, [protect, adminOnly], updateOrder);
      if (method === "DELETE") return runHandler(request, params, [protect, adminOnly], deleteOrder);
    } else if (sub === "status" && method === "PATCH") {
      return runHandler(request, params, [protect, adminOnly, updateOrderStatusValidator, validateRequest], updateOrderStatus);
    } else if (sub === "parcel-status" && method === "PATCH") {
      return runHandler(request, params, [protect, adminOnly, updateParcelStatusValidator, validateRequest], updateParcelStatus);
    }
  }

  // 3. /api/returns
  if (path === "/returns") {
    if (method === "GET") return runHandler(request, {}, [protect, adminOnly], getReturnRequests);
    if (method === "POST") return runHandler(request, {}, [protect, createReturnRequestValidator, validateRequest], createReturnRequest);
  }
  if (slug[0] === "returns" && slug[1]) {
    const id = slug[1];
    const sub = slug[2];
    const params = { id };
    if (!sub) {
      if (method === "PUT") return runHandler(request, params, [protect, adminOnly], updateReturn);
      if (method === "DELETE") return runHandler(request, params, [protect, adminOnly], deleteReturn);
    } else if (sub === "status" && method === "PATCH") {
      return runHandler(request, params, [protect, adminOnly, updateReturnStatusValidator, validateRequest], updateReturnStatus);
    }
  }

  // 4. /api/dashboard
  if (path === "/dashboard/summary" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getDashboardSummary);
  }

  // 5. /api/employee
  if (path === "/employee/dashboard" && method === "GET") {
    return runHandler(request, {}, [protect], getEmployeeDashboard);
  }
  if (path === "/employee/performance" && method === "GET") {
    return runHandler(request, {}, [protect], getMyPerformance);
  }
  if (path === "/employee/performance/daily-history" && method === "GET") {
    return runHandler(request, {}, [protect], getMyDailyHistory);
  }
  if (path === "/employee/orders" && method === "GET") {
    return runHandler(request, {}, [protect], getEmployeeOrdersHistory);
  }
  if (slug[0] === "employee" && slug[1] === "orders" && slug[2]) {
    const params = { id: slug[2] };
    if (method === "PUT") return runHandler(request, params, [protect], updateEmployeeOrder);
    if (method === "DELETE") return runHandler(request, params, [protect], deleteEmployeeOrder);
  }
  if (path === "/employee/returns" && method === "GET") {
    return runHandler(request, {}, [protect], getEmployeeReturnsHistory);
  }
  if (slug[0] === "employee" && slug[1] === "returns" && slug[2]) {
    const params = { id: slug[2] };
    if (method === "PUT") return runHandler(request, params, [protect], updateEmployeeReturn);
    if (method === "DELETE") return runHandler(request, params, [protect], deleteEmployeeReturn);
  }
  if (path === "/employee/calling-records/bulk-import" && method === "POST") {
    return runHandler(request, {}, [protect], bulkImportEmployeeCallingRecords);
  }
  if (path === "/employee/calling-records") {
    if (method === "GET") return runHandler(request, {}, [protect], getEmployeeCallingRecords);
    if (method === "POST") return runHandler(request, {}, [protect], createEmployeeCallingRecord);
  }
  if (slug[0] === "employee" && slug[1] === "calling-records" && slug[2]) {
    const params = { id: slug[2] };
    if (method === "PUT") return runHandler(request, params, [protect], updateEmployeeCallingRecord);
    if (method === "DELETE") return runHandler(request, params, [protect], deleteEmployeeCallingRecord);
  }

  // 6. /api/admin
  if (path === "/admin/revenue-summary" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getRevenueSummary);
  }
  if (path === "/admin/sales-summary" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getSalesSummary);
  }
  if (path === "/admin/employee-performance" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getEmployeePerformance);
  }
  if (path === "/admin/employee-history" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getEmployeeHistory);
  }
  if (path === "/admin/employee-summary" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getEmployeeSummary);
  }
  if (slug[0] === "admin" && slug[1] === "employee-details" && slug[2] && method === "GET") {
    return runHandler(request, { id: slug[2] }, [protect, adminOnly], getEmployeeDetails);
  }
  // Performance & Incentives
  if (path === "/admin/performance-settings") {
    if (method === "GET") return runHandler(request, {}, [protect, adminOnly], getPerformanceSettings);
    if (method === "PUT") return runHandler(request, {}, [protect, adminOnly], updatePerformanceSettings);
  }
  if (path === "/admin/performance-ranking" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getAdminPerformanceRanking);
  }
  if (path === "/admin/bonus-report" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], getAdminBonusReport);
  }
  if (path === "/admin/bonus-report/export" && method === "GET") {
    return runHandler(request, {}, [protect, adminOnly], exportBonusReportCSV);
  }
  if (slug[0] === "admin" && slug[1] === "performance-employee-detail" && slug[2] && method === "GET") {
    return runHandler(request, { id: slug[2] }, [protect, adminOnly], getAdminEmployeePerformanceDetail);
  }

  // 7. /api/employee-records
  if (path === "/employee-records") {
    if (method === "GET") return runHandler(request, {}, [protect, adminOnly], getEmployeeRecords);
    if (method === "POST") return runHandler(request, {}, [protect, adminOnly], createEmployeeRecord);
  }
  if (slug[0] === "employee-records" && slug[1] && method === "DELETE") {
    return runHandler(request, { id: slug[1] }, [protect, adminOnly], deleteEmployeeRecord);
  }

  // 8. /api/calling-records
  if (path === "/calling-records/bulk-import" && method === "POST") {
    return runHandler(request, {}, [protect, adminOnly], bulkImportCallingRecords);
  }
  if (path === "/calling-records") {
    if (method === "GET") return runHandler(request, {}, [protect, adminOnly], getCallingRecords);
    if (method === "POST") return runHandler(request, {}, [protect, adminOnly], createCallingRecord);
  }
  if (slug[0] === "calling-records" && slug[1] && method === "DELETE") {
    return runHandler(request, { id: slug[1] }, [protect, adminOnly], deleteCallingRecord);
  }

  // 9. /api/customers
  if (path === "/customers/bulk-import" && method === "POST") {
    return runHandler(request, {}, [protect], bulkImportCustomers);
  }
  if (path === "/customers/employees-list" && method === "GET") {
    return runHandler(request, {}, [protect], getEmployeesList);
  }
  if (path === "/customers/export" && method === "GET") {
    return runHandler(request, {}, [protect], exportCustomersCSV);
  }
  if (path === "/customers") {
    if (method === "GET") return runHandler(request, {}, [protect], getCustomers);
    if (method === "POST") return runHandler(request, {}, [protect], createCustomer);
  }
  if (slug[0] === "customers" && slug[1]) {
    const params = { id: slug[1] };
    if (method === "PUT") return runHandler(request, params, [protect], updateCustomer);
    if (method === "DELETE") return runHandler(request, params, [protect], deleteCustomer);
  }

  // 10. /api/activities
  if (path === "/activities" && method === "GET") {
    return runHandler(request, {}, [protect], getActivities);
  }
  if (path === "/activities/tl-whatsapp-numbers") {
    if (method === "GET") {
      return runHandler(request, {}, [protect], (req, res) => {
        return res.status(200).json({ numbers: getTLWhatsAppNumbers() });
      });
    }
    if (method === "POST") {
      return runHandler(request, {}, [protect], (req, res) => {
        const { numbers } = req.body;
        const updated = setTLWhatsAppNumbers(numbers || []);
        return res.status(200).json({
          message: "TL WhatsApp notification numbers updated successfully",
          numbers: updated
        });
      });
    }
  }

  // 11. Master Data & Lookups
  if (path === "/departments" && method === "GET") {
    return runHandler(request, {}, [protect], getDepartments);
  }
  if (path === "/branches" && method === "GET") {
    return runHandler(request, {}, [protect], getBranches);
  }
  if (path === "/lookups" && method === "GET") {
    return runHandler(request, {}, [protect], getLookups);
  }

  // 12. /api/health
  if (path === "/health" && method === "GET") {
    return Response.json(
      { message: "API running" },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
        }
      }
    );
  }

  return Response.json(
    { message: "API endpoint not found" },
    {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
      }
    }
  );
}

export async function GET(request, context) {
  return dispatch(request, context);
}

export async function POST(request, context) {
  return dispatch(request, context);
}

export async function PUT(request, context) {
  return dispatch(request, context);
}

export async function PATCH(request, context) {
  return dispatch(request, context);
}

export async function DELETE(request, context) {
  return dispatch(request, context);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
    }
  });
}
