import { z } from "zod";

// SECTOR
export const SectorSchema = z.object({
  name: z.string().min(1, "Sector name is required").max(50),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  invitedFriendIds: z.array(z.string()).optional(),
  inviteEnabled: z.boolean().optional(),
});

export const UpdateSectorSchema = SectorSchema.partial();

// BEACON
export const BeaconSchema = z.object({
  url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  sectorId: z.string().optional(),
});

export const UpdateBeaconSchema = BeaconSchema.partial().omit({ sectorId: true });

// CHAT
export const SendGroupMessageSchema = z.object({
  sectorId: z.string(),
  content: z.string().min(1, "Message cannot be empty").max(2000),
  type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).optional().default("TEXT"),
  metadata: z.string().optional(),
});

export const EditGroupMessageSchema = z.object({
  messageId: z.string(),
  sectorId: z.string(),
  content: z.string().min(1).max(2000),
});

export const SendPrivateMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
  type: z.enum(["TEXT", "IMAGE", "FILE", "COLLAB_INVITE"]).optional().default("TEXT"),
  metadata: z.string().optional(),
});

// AUTH / PROFILE
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(160).optional().nullable(),
  location: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
});
