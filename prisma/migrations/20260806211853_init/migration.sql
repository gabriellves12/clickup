-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'av-1',
    "role" TEXT NOT NULL DEFAULT 'member',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "teamId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId","personId")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "tipoContrato" TEXT NOT NULL DEFAULT 'FIXO',
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "contractUrl" TEXT,
    "contractMonths" INTEGER,
    "whatsappUrl" TEXT,
    "portalUserLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "driveUrl" TEXT,
    "figmaUrl" TEXT,
    "photosUrl" TEXT,
    "observations" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "variationMode" TEXT NOT NULL DEFAULT 'FIXED',
    "variations" TEXT NOT NULL DEFAULT '[]',
    "routeToWeb" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkTree" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "LinkTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkTreeItem" (
    "id" TEXT NOT NULL,
    "linkTreeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "observation" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkTreeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "briefing" TEXT,
    "variation" TEXT,
    "copyUrl" TEXT,
    "referenceUrl" TEXT,
    "attachmentDriveUrl" TEXT,
    "externalMaterials" TEXT,
    "useExternalMaterials" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL,
    "clientStatus" TEXT NOT NULL DEFAULT 'PENDENTES',
    "tipoProjeto" TEXT NOT NULL DEFAULT 'PADRAO',
    "pendenteMaterial" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "order" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "clientId" TEXT NOT NULL,
    "productId" TEXT,
    "demandTypeId" TEXT,
    "responsibleId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE INDEX "Person_clientId_idx" ON "Person"("clientId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_order_idx" ON "TeamMember"("teamId", "order");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_tipoContrato_idx" ON "Client"("tipoContrato");

-- CreateIndex
CREATE INDEX "Product_clientId_name_idx" ON "Product"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DemandType_prefix_key" ON "DemandType"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "LinkTree_clientId_key" ON "LinkTree"("clientId");

-- CreateIndex
CREATE INDEX "LinkTreeItem_linkTreeId_order_idx" ON "LinkTreeItem"("linkTreeId", "order");

-- CreateIndex
CREATE INDEX "Card_teamId_responsibleId_status_order_idx" ON "Card"("teamId", "responsibleId", "status", "order");

-- CreateIndex
CREATE INDEX "Card_teamId_deadline_idx" ON "Card"("teamId", "deadline");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTree" ADD CONSTRAINT "LinkTree_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTreeItem" ADD CONSTRAINT "LinkTreeItem_linkTreeId_fkey" FOREIGN KEY ("linkTreeId") REFERENCES "LinkTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTreeItem" ADD CONSTRAINT "LinkTreeItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LinkTreeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_demandTypeId_fkey" FOREIGN KEY ("demandTypeId") REFERENCES "DemandType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
