import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('lib/actions.ts', 'utf-8');
const lines = content.split('\n');

const outDir = 'lib/actions';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let currentFile = 'utils.ts';
let buffers: Record<string, string[]> = {
  'utils.ts': [],
  'sector.actions.ts': [],
  'beacon.actions.ts': [],
  'chat.actions.ts': [],
  'social.actions.ts': [],
  'auth.actions.ts': []
};

// Add standard imports to all files
const standardImports = `"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { pusherServer } from "@/lib/pusher";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { requireAuth, requireStation } from "./utils";
`;

for (const key of Object.keys(buffers)) {
  if (key !== 'utils.ts') {
    buffers[key].push(standardImports);
  } else {
    buffers[key].push(`"use server";\n\nimport { auth } from "@/auth";\nimport { db } from "@/lib/db";\n`);
  }
}

let skipHeader = true;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (skipHeader && line.includes('function requireAuth')) {
    skipHeader = false;
  }

  if (skipHeader) continue; // skip the original imports

  if (line.includes('SECTOR ACTIONS')) currentFile = 'sector.actions.ts';
  else if (line.includes('BEACON ACTIONS')) currentFile = 'beacon.actions.ts';
  else if (line.includes('CHAT ACTIONS')) currentFile = 'chat.actions.ts';
  else if (line.includes('SOCIAL ACTIONS')) currentFile = 'social.actions.ts';
  else if (line.includes('AUTH / PROFILE ACTIONS')) currentFile = 'auth.actions.ts';

  // Export the utils
  if (currentFile === 'utils.ts' && line.startsWith('async function requireAuth')) {
    buffers[currentFile].push(line.replace('async function', 'export async function'));
    continue;
  }
  if (currentFile === 'utils.ts' && line.startsWith('async function requireStation')) {
    buffers[currentFile].push(line.replace('async function', 'export async function'));
    continue;
  }

  buffers[currentFile].push(line);
}

for (const [filename, fileLines] of Object.entries(buffers)) {
  fs.writeFileSync(path.join(outDir, filename), fileLines.join('\n'));
}

console.log('Split complete.');
