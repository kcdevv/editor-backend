/*
  Warnings:

  - You are about to drop the column `sockets` on the `Room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "sockets",
ADD COLUMN     "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'javascript',
ADD COLUMN     "output" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");
