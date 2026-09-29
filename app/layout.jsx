import { Suspense } from "react";
import "@/src/styles/index.css";
import { AuthProvider } from "@/src/context/AuthContext";

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
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
