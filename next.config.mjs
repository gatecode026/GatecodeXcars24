import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "react-router-dom": path.resolve(__dirname, "src/compat/react-router-dom.jsx")
    }
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-router-dom": path.resolve(__dirname, "src/compat/react-router-dom.jsx")
    };
    return config;
  },
  serverExternalPackages: ["mongoose", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
        ]
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" }
        ]
      }
    ];
  }
};

export default nextConfig;
