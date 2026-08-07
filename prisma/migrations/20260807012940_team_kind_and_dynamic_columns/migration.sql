-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'TEAM';

-- CreateTable
CREATE TABLE "TeamStatus" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "tone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamStatus_teamId_order_idx" ON "TeamStatus"("teamId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStatus_teamId_key_key" ON "TeamStatus"("teamId", "key");

-- CreateIndex
CREATE INDEX "Team_kind_idx" ON "Team"("kind");

-- CreateIndex
CREATE INDEX "Team_clientId_idx" ON "Team"("clientId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStatus" ADD CONSTRAINT "TeamStatus_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
