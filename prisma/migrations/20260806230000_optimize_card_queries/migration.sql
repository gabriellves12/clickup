-- Accelerate the isolated client portal board and operational dashboard reads.
CREATE INDEX "Card_clientId_clientStatus_order_idx" ON "Card"("clientId", "clientStatus", "order");
CREATE INDEX "Card_status_updatedAt_idx" ON "Card"("status", "updatedAt");
