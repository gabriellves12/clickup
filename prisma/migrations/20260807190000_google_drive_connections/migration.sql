CREATE TABLE "GoogleDriveConnection" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scopes" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleDriveConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleDriveConnection_personId_key" ON "GoogleDriveConnection"("personId");

ALTER TABLE "GoogleDriveConnection" ADD CONSTRAINT "GoogleDriveConnection_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
