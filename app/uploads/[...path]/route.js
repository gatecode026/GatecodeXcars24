import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const rawParams = await (context?.params || {});
  const segments = rawParams.path || [];
  const filename = segments.join("/");

  const publicUploadPath = path.resolve(process.cwd(), "public/uploads", filename);
  const serverUploadPath = path.resolve(process.cwd(), "server/uploads", filename);

  let targetPath = null;
  if (fs.existsSync(publicUploadPath)) {
    targetPath = publicUploadPath;
  } else if (fs.existsSync(serverUploadPath)) {
    targetPath = serverUploadPath;
  }

  if (targetPath) {
    const ext = path.extname(targetPath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".webp") contentType = "image/webp";

    const buffer = fs.readFileSync(targetPath);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400"
      }
    });
  }

  // Not found SVG fallback matching server/src/app.js
  const notFoundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="100%" height="100%" fill="#1e293b"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94a3b8">Screenshot Not Found</text>
</svg>`;

  return new Response(notFoundSvg, {
    status: 404,
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}
