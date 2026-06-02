-- AlterTable
ALTER TABLE "AssetGenerationBatch" ADD COLUMN "styleProfileId" TEXT;

-- CreateTable
CREATE TABLE "AssetStyleProfile" (
    "id" TEXT NOT NULL,
    "referenceImageUrl" TEXT,
    "stylePrompt" TEXT,
    "negativePrompt" TEXT,
    "styleBibleJson" TEXT,
    "imageSize" TEXT,
    "backgroundMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetStyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMasterTemplate" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "baseItemName" TEXT NOT NULL,
    "anchorGeneratedItemId" TEXT,
    "shape" TEXT,
    "size" TEXT,
    "pattern" TEXT,
    "color1" TEXT,
    "color2" TEXT,
    "masterPrompt" TEXT,
    "masterImageUrl" TEXT,
    "masterAssetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemMasterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemMasterTemplate_batchId_baseItemName_key" ON "ItemMasterTemplate"("batchId", "baseItemName");

-- AddForeignKey
ALTER TABLE "AssetGenerationBatch" ADD CONSTRAINT "AssetGenerationBatch_styleProfileId_fkey" FOREIGN KEY ("styleProfileId") REFERENCES "AssetStyleProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMasterTemplate" ADD CONSTRAINT "ItemMasterTemplate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AssetGenerationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "GeneratedAsset" ADD COLUMN "baseItemName" TEXT;

-- AlterTable
ALTER TABLE "GeneratedAsset" ADD COLUMN "isMaster" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GeneratedAsset" ADD COLUMN "masterTemplateId" TEXT;

-- AlterTable
ALTER TABLE "GeneratedAsset" ADD COLUMN "pattern" TEXT;

-- AddForeignKey
ALTER TABLE "GeneratedAsset" ADD CONSTRAINT "GeneratedAsset_masterTemplateId_fkey" FOREIGN KEY ("masterTemplateId") REFERENCES "ItemMasterTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

