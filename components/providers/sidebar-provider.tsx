"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
    setIsLoaded(true)
  }, [])

  // Save preference to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString())
    }
  }, [isCollapsed, isLoaded])

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {!isLoaded ? (
        <div className="invisible">{children}</div>
      ) : (
        children
      )}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
