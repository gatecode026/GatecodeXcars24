import { createContext, useContext, useState, useCallback } from "react";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
