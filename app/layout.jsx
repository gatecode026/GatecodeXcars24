import { Suspense } from "react";
import "@/src/styles/index.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
      <body suppressHydrationWarning>
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
