import fs from "node:fs";
import path from "node:path";
import { connectDB, DEFAULT_MONGO_URI } from "./config/db.js";
import { ensureFixedAdminUser } from "./config/seedAdmin.js";

function loadEnvFallback() {
  if (process.env.MONGO_URI && process.env.JWT_SECRET) return;
  const envFiles = [".env.local", ".env", "server/.env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (_) {}
    }
  }
}
loadEnvFallback();
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "mySuperSecretKey123";
}
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = DEFAULT_MONGO_URI;
}

let adminSeeded = false;

const uploadDir = path.resolve(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (_) {}
}

export async function runHandler(request, params = {}, middlewares = [], controller) {
  try {
  try {
    await connectDB(8000);
    if (!global._adminSeeded) {
      global._adminSeeded = true;
      ensureFixedAdminUser().catch((err) => console.warn("Admin seed warning:", err.message));
    }
  } catch (dbErr) {
    console.warn("DB connection warning in routeRunner:", dbErr.message);
  }

    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const headers = Object.fromEntries(request.headers.entries());

    let body = {};
    let file = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fields = {};
      for (const [key, value] of formData.entries()) {
        if (value && typeof value === "object" && typeof value.arrayBuffer === "function") {
          const fileObj = value;
          if (fileObj.size > 0 && fileObj.name) {
            const buffer = Buffer.from(await fileObj.arrayBuffer());
            const safeName = fileObj.name.replace(/\s+/g, "_");
            const filename = `${Date.now()}-${safeName}`;
            const targetPath = path.join(uploadDir, filename);
            fs.writeFileSync(targetPath, buffer);
            // Also write to server/uploads if it exists for backwards compatibility
            const serverUploadDir = path.resolve(process.cwd(), "server/uploads");
            if (fs.existsSync(serverUploadDir)) {
              try { fs.writeFileSync(path.join(serverUploadDir, filename), buffer); } catch (_) {}
            }
            file = {
              filename,
              path: targetPath,
              originalname: fileObj.name,
              mimetype: fileObj.type || "application/octet-stream",
              size: fileObj.size
            };
          }
        } else {
          fields[key] = value;
        }
      }
      body = fields;
    } else if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch (_) {
        body = {};
      }
    }

    const req = {
      method: request.method,
      url: request.url,
      originalUrl: url.pathname + url.search,
      pathname: url.pathname,
      params: params || {},
      query,
      headers,
      body,
      file,
      user: null
    };

    let statusCode = 200;
    const responseHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    };
    let responseBody = null;
    let resolved = false;
    let onResolveListener = null;

    const notifyResolved = () => {
      resolved = true;
      if (onResolveListener) {
        onResolveListener();
        onResolveListener = null;
      }
    };

    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      setHeader(name, val) {
        responseHeaders[name] = val;
        return res;
      },
      getHeader(name) {
        return responseHeaders[name];
      },
      json(data) {
        responseHeaders["Content-Type"] = "application/json";
        responseBody = JSON.stringify(data);
        notifyResolved();
        return res;
      },
      send(data) {
        responseBody = typeof data === "string" ? data : JSON.stringify(data);
        notifyResolved();
        return res;
      }
    };

    // Flatten middlewares
    const flatList = [];
    for (const mw of middlewares) {
      if (Array.isArray(mw)) {
        flatList.push(...mw);
      } else if (mw) {
        flatList.push(mw);
      }
    }

    for (const mw of flatList) {
      if (resolved) break;

      // Handle express-validator chains
      if (mw && typeof mw.run === "function") {
        await mw.run(req);
        continue;
      }

      // Handle standard middleware functions (req, res, next)
      if (typeof mw === "function") {
        await new Promise((resolve, reject) => {
          let finished = false;
          const finish = () => {
            if (!finished) {
              finished = true;
              onResolveListener = null;
              resolve();
            }
          };

          onResolveListener = finish;

          const next = (err) => {
            if (err) {
              finished = true;
              onResolveListener = null;
              reject(err);
            } else {
              finish();
            }
          };

          try {
            const result = mw(req, res, next);
            if (result && typeof result.then === "function") {
              result.then(finish).catch((err) => {
                finished = true;
                onResolveListener = null;
                reject(err);
              });
            } else {
              if (resolved || mw.length < 3) {
                finish();
              }
            }
          } catch (err) {
            finished = true;
            onResolveListener = null;
            reject(err);
          }
        });
      }
    }

    if (!resolved && controller) {
      await new Promise((resolve, reject) => {
        let finished = false;
        const finish = () => {
          if (!finished) {
            finished = true;
            onResolveListener = null;
            resolve();
          }
        };

        onResolveListener = finish;

        const next = (err) => {
          if (err) {
            finished = true;
            onResolveListener = null;
            reject(err);
          } else {
            finish();
          }
        };

        try {
          const result = controller(req, res, next);
          if (result && typeof result.then === "function") {
            result.then(finish).catch((err) => {
              finished = true;
              onResolveListener = null;
              reject(err);
            });
          } else {
            if (resolved || controller.length < 3) {
              finish();
            }
          }
        } catch (err) {
          finished = true;
          onResolveListener = null;
          reject(err);
        }
      });
    }

    return new Response(responseBody || JSON.stringify({}), {
      status: statusCode,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("[routeRunner] Error processing request:", error);
    return new Response(
      JSON.stringify({
        message: error.message || "Internal Server Error"
      }),
      {
        status: error.status || error.statusCode || 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept"
        }
      }
    );
  }
}
