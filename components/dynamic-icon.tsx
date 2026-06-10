import * as SolidIcons from "@heroicons/react/24/solid";
import * as OutlineIcons from "@heroicons/react/24/outline";

export const ICON_OPTIONS = [
  "FolderIcon",
  "GlobeAltIcon",
  "RocketLaunchIcon",
  "SparklesIcon",
  "StarIcon",
  "ComputerDesktopIcon",
  "DevicePhoneMobileIcon",
  "PuzzlePieceIcon",
  "MusicalNoteIcon",
  "BookOpenIcon",
  "PaintBrushIcon",
  "BriefcaseIcon",
  "BeakerIcon",
  "HomeIcon",
  "PaperAirplaneIcon",
  "LightBulbIcon",
  "FireIcon",
  "BoltIcon",
  "MapIcon",
  "ShieldCheckIcon",
  "CogIcon",
  "SignalIcon",
  "CommandLineIcon",
  "CodeBracketIcon",
] as const;

export type IconName = typeof ICON_OPTIONS[number];

type Props = {
  name: string | null | undefined;
  type?: "solid" | "outline";
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  width?: number | string;
  height?: number | string;
};

// Map legacy emojis to Heroicons for backward compatibility with existing DB entries
const LEGACY_MAP: Record<string, IconName> = {
  "📁": "FolderIcon",
  "🌐": "GlobeAltIcon",
  "🛸": "RocketLaunchIcon",
  "🔭": "SparklesIcon",
  "⭐": "StarIcon",
  "🚀": "RocketLaunchIcon",
  "💻": "ComputerDesktopIcon",
  "📱": "DevicePhoneMobileIcon",
  "🎮": "PuzzlePieceIcon",
  "🎵": "MusicalNoteIcon",
  "📚": "BookOpenIcon",
  "🎨": "PaintBrushIcon",
  "💼": "BriefcaseIcon",
  "🔬": "BeakerIcon",
  "🏠": "HomeIcon",
  "✈️": "PaperAirplaneIcon",
  "🍕": "FireIcon", // No pizza, use fire
  "💡": "LightBulbIcon",
  "🔥": "FireIcon",
  "⚡": "BoltIcon",
  "🌿": "MapIcon",
  "🎯": "SparklesIcon",
  "🛡": "ShieldCheckIcon",
  "⚙️": "CogIcon",
  "📡": "SignalIcon",
  "🌌": "GlobeAltIcon",
  "🪐": "GlobeAltIcon",
  "💫": "SparklesIcon",
};

export function DynamicIcon({ name, type = "solid", className = "", style, fallback = "📁", width = 18, height = 18 }: Props) {
  if (!name) name = fallback;

  // Handle legacy emojis stored in DB
  if (LEGACY_MAP[name]) {
    name = LEGACY_MAP[name];
  }

  // If it's somehow still a raw emoji and not in map, just render it as text
  if (name && name.length <= 2 && !name.endsWith("Icon")) {
    return <span className={className} style={style}>{name}</span>;
  }

  const Icons = type === "solid" ? SolidIcons : OutlineIcons;
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    const FallbackComponent = (Icons as any)["FolderIcon"];
    return <FallbackComponent className={className} style={style} width={width} height={height} />;
  }

  return <IconComponent className={className} style={style} width={width} height={height} />;
}
