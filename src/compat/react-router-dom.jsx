"use client";

import React, { useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams as useNextSearchParams, useParams as useNextParams } from "next/navigation";
import NextLink from "next/link";

export const useNavigate = () => {
  const router = useRouter();
  return useCallback(
    (to, options = {}) => {
      if (typeof to === "number") {
        if (to === -1) router.back();
        else if (to === 1) router.forward();
        return;
      }
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );
};

export const useLocation = () => {
  const pathname = usePathname() || "/";
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const hash = typeof window !== "undefined" ? window.location.hash : "";

  return {
    pathname,
    search,
    hash,
    state: null
  };
};

export const useSearchParams = () => {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "/";

  const setSearchParams = useCallback(
    (nextParams) => {
      let params;
      if (typeof nextParams === "function") {
        params = nextParams(new URLSearchParams(searchParams ? searchParams.toString() : ""));
      } else if (nextParams instanceof URLSearchParams) {
        params = nextParams;
      } else {
        params = new URLSearchParams(nextParams);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [router, pathname, searchParams]
  );

  return [searchParams || new URLSearchParams(), setSearchParams];
};

export const useParams = () => {
  const params = useNextParams();
  return params || {};
};

export const Link = React.forwardRef(({ to, href, children, ...props }, ref) => {
  const destination = to || href || "#";
  return (
    <NextLink ref={ref} href={destination} {...props}>
      {children}
    </NextLink>
  );
});
Link.displayName = "Link";

export const NavLink = React.forwardRef(({ to, href, className, children, ...props }, ref) => {
  const pathname = usePathname() || "/";
  const destination = to || href || "";
  const isActive = pathname === destination || (destination !== "/" && pathname.startsWith(destination));

  let computedClass = "";
  if (typeof className === "function") {
    computedClass = className({ isActive, isPending: false });
  } else {
    computedClass = `${className || ""} ${isActive ? "active" : ""}`.trim();
  }

  return (
    <NextLink ref={ref} href={destination} className={computedClass} {...props}>
      {typeof children === "function" ? children({ isActive, isPending: false }) : children}
    </NextLink>
  );
});
NavLink.displayName = "NavLink";

export const Navigate = ({ to, replace = true }) => {
  const router = useRouter();
  useEffect(() => {
    try {
      if (replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    } catch (_) {
      if (typeof window !== "undefined") {
        if (replace) {
          window.location.replace(to);
        } else {
          window.location.assign(to);
        }
      }
    }
  }, [to, replace, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
    </div>
  );
};

export const Outlet = ({ children }) => {
  return children || null;
};

export const BrowserRouter = ({ children }) => {
  return <>{children}</>;
};

export const Routes = ({ children }) => {
  return <>{children}</>;
};

export const Route = ({ element }) => {
  return element || null;
};
