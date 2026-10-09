import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf"
};

const NOT_FOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="100%" height="100%" fill="#1e293b"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94a3b8">Screenshot Not Found</text>
</svg>`;

export async function GET(request, context) {
  const rawParams = await (context?.params || {});
  const segments = rawParams.path || [];

  // 1. Strict traversal protection: block encoded or raw traversal sequences
  const decodedSegments = segments.map((seg) => {
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  });

  if (
    decodedSegments.length === 0 ||
    decodedSegments.some((seg) => seg.includes("..") || seg.includes("\0") || seg.includes(":") || seg.includes("\\") || seg.startsWith("."))
  ) {
    return new Response(JSON.stringify({ message: "Forbidden: Invalid path." }), {
      status: 403,
      headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" }
    });
  }

  const uploadsDir = path.resolve(process.cwd(), "public/uploads");
  const filename = path.basename(segments.join("/"));
  const targetPath = path.resolve(uploadsDir, filename);

  // 2. Strict containment check
  if (!targetPath.startsWith(uploadsDir + path.sep)) {
    return new Response(JSON.stringify({ message: "Forbidden: Path out of bounds." }), {
      status: 403,
      headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" }
    });
  }

  // 3. Verify file existence and verify it is a regular file
  let stat = null;
  try {
    if (fs.existsSync(targetPath)) {
      stat = fs.statSync(targetPath);
    }
  } catch (_) {
    stat = null;
  }

  if (stat && stat.isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    // Reject executable or unapproved file formats
    if (!MIME_MAP[ext]) {
      return new Response(NOT_FOUND_SVG, {
        status: 404,
        headers: { "Content-Type": "image/svg+xml", "X-Content-Type-Options": "nosniff" }
      });
    }

    const buffer = fs.readFileSync(targetPath);
    const headers = {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff"
    };

    if (ext === ".svg") {
      headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
    }

    return new Response(buffer, {
      status: 200,
      headers
    });
  }

  // 4. Return safe 404 SVG placeholder for missing payment screenshots
  return new Response(NOT_FOUND_SVG, {
    status: 404,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
