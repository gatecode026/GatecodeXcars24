import { Suspense } from "react";
import { Inter } from "next/font/google";
import "@/src/styles/index.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata = {
  title: "GatecodeXcars24 — Used-Car CRM & Operations Platform",
  description: "Used-Car CRM and Operations Platform for BPO management",
  icons: {
    icon: "/logo.jpg"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://va.vercel-scripts.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var msg = (e && e.message) ? e.message : '';
                if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                  var last = sessionStorage.getItem('chunk_retry');
                  var now = Date.now();
                  if (!last || (now - Number(last)) > 6000) {
                    sessionStorage.setItem('chunk_retry', String(now));
                    window.location.reload();
                  }
                }
              });
            `
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
