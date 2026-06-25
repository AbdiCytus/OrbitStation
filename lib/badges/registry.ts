export type BadgeRarity = "biasa" | "ekslusif" | "super-ekslusif";

export interface BadgeDef {
  id: string;
  name: string;
  hint: string;
  color: string;
  icon: string;
  effectClass: string;
  rarity: BadgeRarity;
}

export const BADGE_REGISTRY: BadgeDef[] = [
  {
    id: "rookie-pilot",
    name: "Rookie Pilot",
    hint: "Given to all new pilots joining the station.",
    color: "gray",
    icon: "RocketLaunchIcon",
    effectClass: "badge-rookie",
    rarity: "biasa"
  },
  {
    id: "sector-magnate",
    name: "Sector Magnate",
    hint: "Unlock by establishing at least 7 sectors and 35 beacons.",
    color: "amber",
    icon: "BuildingLibraryIcon",
    effectClass: "badge-magnate",
    rarity: "biasa"
  },
  {
    id: "viral-voyager",
    name: "Viral Voyager",
    hint: "Unlock by creating at least 5 beacons that each have 1,000+ visits.",
    color: "rose",
    icon: "FireIcon",
    effectClass: "badge-viral",
    rarity: "ekslusif"
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    hint: "Unlock by having at least 20 friends.",
    color: "pink",
    icon: "UserGroupIcon",
    effectClass: "badge-social",
    rarity: "biasa"
  },
  {
    id: "collaborative-spirit",
    name: "Collaborative Spirit",
    hint: "Unlock by joining 10 different collaborative sectors.",
    color: "cyan",
    icon: "HandRaisedIcon",
    effectClass: "badge-collab",
    rarity: "ekslusif"
  },
  {
    id: "guild-master",
    name: "Guild Master",
    hint: "Unlock by having 20+ members in a sector you created.",
    color: "emerald",
    icon: "ShieldCheckIcon",
    effectClass: "badge-guild",
    rarity: "ekslusif"
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    hint: "Unlock by keeping your account active for more than 30 days.",
    color: "purple",
    icon: "StarIcon",
    effectClass: "badge-early",
    rarity: "biasa"
  },
  {
    id: "data-hoarder",
    name: "Data Hoarder",
    hint: "Unlock by creating 100+ beacons across any sectors.",
    color: "blue",
    icon: "ServerStackIcon",
    effectClass: "badge-hoarder",
    rarity: "biasa"
  },
  {
    id: "chatterbox",
    name: "Chatterbox",
    hint: "Unlock by sending at least 100 private messages across 15+ different friends.",
    color: "pink",
    icon: "ChatBubbleLeftRightIcon",
    effectClass: "badge-chatterbox",
    rarity: "biasa"
  },
  {
    id: "cosmic-explorer",
    name: "Cosmic Explorer",
    hint: "Unlock by visiting 100 different public stations.",
    color: "indigo",
    icon: "GlobeAsiaAustraliaIcon",
    effectClass: "badge-explorer",
    rarity: "biasa"
  },
  {
    id: "sector-heiress",
    name: "Sector Heiress",
    hint: "Receive ownership transfers for 50 different sectors.",
    color: "rose",
    icon: "KeyIcon",
    effectClass: "badge-heiress",
    rarity: "ekslusif"
  },
  {
    id: "prominent-admin",
    name: "Prominent Admin",
    hint: "Get promoted to Admin in 8 different collaborative sectors.",
    color: "cyan",
    icon: "BriefcaseIcon",
    effectClass: "badge-admin",
    rarity: "biasa"
  },
  {
    id: "galactic-center",
    name: "Galactic Center",
    hint: "Your Public Station has been visited 100,000+ times.",
    color: "amber",
    icon: "SparklesIcon",
    effectClass: "badge-galactic",
    rarity: "super-ekslusif"
  },
  {
    id: "reliable-contributor",
    name: "Reliable Contributor",
    hint: "Add 10+ beacons across 5 different collaborative sectors.",
    color: "emerald",
    icon: "WrenchScrewdriverIcon",
    effectClass: "badge-contributor",
    rarity: "biasa"
  },
  {
    id: "the-creator",
    name: "The Creator",
    hint: "The mastermind behind Orbit Station.",
    color: "purple",
    icon: "CpuChipIcon",
    effectClass: "badge-creator",
    rarity: "super-ekslusif"
  },
  {
    id: "the-creator-assistant",
    name: "The Creator's Assistant",
    hint: "The AI agent that helped build Orbit Station.",
    color: "blue",
    icon: "CommandLineIcon",
    effectClass: "badge-assistant",
    rarity: "super-ekslusif"
  }
];

export const BADGE_COLORS: Record<string, string> = {
  gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function getBadgeById(id: string | null) {
  if (!id) return null;
  return BADGE_REGISTRY.find(b => b.id === id) || null;
}
