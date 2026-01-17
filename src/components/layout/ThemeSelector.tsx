"use client";

import { useTheme, THEMES } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Sun, Moon } from "lucide-react";

export function ThemeSelector() {
  const { theme, colorMode, setTheme, toggleColorMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={toggleColorMode} className="cursor-pointer">
          {colorMode === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="cursor-pointer"
          >
            <span
              className="h-4 w-4 rounded-full mr-2 border border-border"
              style={{ backgroundColor: t.color }}
            />
            {t.label}
            {theme === t.value && (
              <span className="ml-auto text-primary">*</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
