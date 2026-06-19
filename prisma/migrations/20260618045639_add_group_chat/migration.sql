-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifSoundUrl" TEXT;

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "replyToId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedBy" TEXT,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MutedMember" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mutedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutedMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypingIndicator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectorId" TEXT,
    "chatWithId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupMessage_sectorId_createdAt_idx" ON "GroupMessage"("sectorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MutedMember_sectorId_userId_key" ON "MutedMember"("sectorId", "userId");

-- CreateIndex
CREATE INDEX "TypingIndicator_sectorId_userId_idx" ON "TypingIndicator"("sectorId", "userId");

-- CreateIndex
CREATE INDEX "TypingIndicator_chatWithId_userId_idx" ON "TypingIndicator"("chatWithId", "userId");

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "GroupMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedMember" ADD CONSTRAINT "MutedMember_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedMember" ADD CONSTRAINT "MutedMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingIndicator" ADD CONSTRAINT "TypingIndicator_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingIndicator" ADD CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
