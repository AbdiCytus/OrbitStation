export interface BadgeDef {
  id: string;
  name: string;
  hint: string;
  color: string;
  icon: string;
  effectClass: string;
}

export const BADGE_REGISTRY: BadgeDef[] = [
  {
    id: "rookie-pilot",
    name: "Rookie Pilot",
    hint: "Given to all new pilots joining the station.",
    color: "gray",
    icon: "RocketLaunchIcon",
    effectClass: "badge-rookie"
  },
  {
    id: "sector-magnate",
    name: "Sector Magnate",
    hint: "Unlock by establishing at least 7 sectors and 35 beacons.",
    color: "amber",
    icon: "BuildingLibraryIcon",
    effectClass: "badge-magnate"
  },
  {
    id: "viral-voyager",
    name: "Viral Voyager",
    hint: "Unlock by creating at least 5 beacons that each have 1,000+ visits.",
    color: "rose",
    icon: "FireIcon",
    effectClass: "badge-viral"
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    hint: "Unlock by having at least 20 friends.",
    color: "pink",
    icon: "UserGroupIcon",
    effectClass: "badge-social"
  },
  {
    id: "collaborative-spirit",
    name: "Collaborative Spirit",
    hint: "Unlock by joining 10 different collaborative sectors.",
    color: "cyan",
    icon: "HandRaisedIcon",
    effectClass: "badge-collab"
  },
  {
    id: "guild-master",
    name: "Guild Master",
    hint: "Unlock by having 20+ members in a sector you created.",
    color: "emerald",
    icon: "ShieldCheckIcon",
    effectClass: "badge-guild"
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    hint: "Unlock by keeping your account active for more than 30 days.",
    color: "purple",
    icon: "StarIcon",
    effectClass: "badge-early"
  },
  {
    id: "data-hoarder",
    name: "Data Hoarder",
    hint: "Unlock by creating 100+ beacons across any sectors.",
    color: "blue",
    icon: "ServerStackIcon",
    effectClass: "badge-hoarder"
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
