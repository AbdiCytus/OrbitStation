/*
  Warnings:

  - A unique constraint covering the columns `[sectorId,userId]` on the table `TypingIndicator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatWithId,userId]` on the table `TypingIndicator` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_sectorId_userId_key" ON "TypingIndicator"("sectorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_chatWithId_userId_key" ON "TypingIndicator"("chatWithId", "userId");
