"use client";

import { useTheme } from "next-themes";
import SpaceBackground from "./space-background";
import LightBackground from "./light-background";
import DarkBackground from "./dark-background";
import { useEffect, useState } from "react";

type Props = {
  sector?: string;
  variant?: "station" | "settings";
  sectorColor?: string | null;
  animEnabled?: boolean;
  transitionDuration?: number;
};

export default function DynamicBackground(props: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render an empty div on server to avoid flashing the wrong theme
    return <div className="fixed inset-0 z-[-1]" />;
  }

  if (theme === "light") {
    return <LightBackground animEnabled={props.animEnabled} sector={props.sector} sectorColor={props.sectorColor} />;
  }
  if (theme === "dark") {
    return <DarkBackground animEnabled={props.animEnabled} sector={props.sector} sectorColor={props.sectorColor} />;
  }
  
  // Default to space
  return <SpaceBackground {...props} />;
}
