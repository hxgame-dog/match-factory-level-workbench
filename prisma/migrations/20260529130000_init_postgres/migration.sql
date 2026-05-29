-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ItemCatalog" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER,
    "name" TEXT NOT NULL,
    "category1" TEXT NOT NULL,
    "category2" TEXT,
    "color1" TEXT,
    "color2" TEXT,
    "shape" TEXT,
    "size" TEXT,
    "col7" TEXT,
    "targetScale" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGenerationLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "prompt" TEXT NOT NULL,
    "resultJson" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedItemSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "totalItemCount" INTEGER NOT NULL,
    "targetTypeCount" INTEGER NOT NULL,
    "targetCountEach" INTEGER NOT NULL,
    "distractorTypeCount" INTEGER NOT NULL,
    "difficultyIntent" TEXT,
    "constraints" TEXT,
    "summary" TEXT,
    "warningsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedItemSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedItem" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "sourceItemId" INTEGER,
    "catalogItemId" TEXT,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "category1" TEXT NOT NULL,
    "category2" TEXT,
    "color1" TEXT,
    "color2" TEXT,
    "shape" TEXT,
    "size" TEXT,
    "targetScale" DOUBLE PRECISION,
    "role" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "imagePrompt" TEXT,
    "reason" TEXT,
    "riskTagsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetGenerationBatch" (
    "id" TEXT NOT NULL,
    "itemSetId" TEXT NOT NULL,
    "itemSetName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "globalArtStyle" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetGenerationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAsset" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "generatedItemId" TEXT,
    "sourceItemId" INTEGER,
    "catalogItemId" TEXT,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "category1" TEXT NOT NULL,
    "category2" TEXT,
    "color1" TEXT,
    "color2" TEXT,
    "shape" TEXT,
    "size" TEXT,
    "role" TEXT,
    "count" INTEGER,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "imageUrl" TEXT,
    "localPath" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "levelIndex" INTEGER,
    "theme" TEXT,
    "itemSetId" TEXT NOT NULL,
    "itemSetName" TEXT NOT NULL,
    "assetBatchId" TEXT,
    "assetBatchName" TEXT,
    "timeLimitSec" INTEGER NOT NULL,
    "slotCount" INTEGER NOT NULL,
    "boardWidth" INTEGER NOT NULL,
    "boardHeight" INTEGER NOT NULL,
    "layerCount" INTEGER NOT NULL,
    "targetDifficulty" TEXT,
    "generatorRuleId" TEXT NOT NULL,
    "refreshRuleId" TEXT NOT NULL,
    "levelJson" TEXT NOT NULL,
    "summary" TEXT,
    "warningsJson" TEXT,
    "validationJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configJson" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulaPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifficultyDiagnosisRun" (
    "id" TEXT NOT NULL,
    "levelId" TEXT,
    "levelName" TEXT,
    "formulaPresetId" TEXT,
    "formulaName" TEXT,
    "resultJson" TEXT NOT NULL,
    "aiAdviceJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DifficultyDiagnosisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoLevelGenerationRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceLevelIdsJson" TEXT NOT NULL,
    "formulaPresetId" TEXT,
    "formulaPresetName" TEXT,
    "generateCount" INTEGER NOT NULL,
    "candidatesPerLevel" INTEGER NOT NULL,
    "curveType" TEXT NOT NULL,
    "targetStartIndex" INTEGER,
    "configJson" TEXT NOT NULL,
    "resultJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoLevelGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoGeneratedLevelCandidate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "targetLevelIndex" INTEGER NOT NULL,
    "candidateRank" INTEGER NOT NULL,
    "targetP" DOUBLE PRECISION NOT NULL,
    "actualP" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "levelName" TEXT NOT NULL,
    "levelJson" TEXT NOT NULL,
    "diagnosisJson" TEXT,
    "validationJson" TEXT,
    "aiReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "savedGeneratedLevelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoGeneratedLevelCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "levelIdsJson" TEXT NOT NULL,
    "assetBatchIdsJson" TEXT,
    "formulaPresetId" TEXT,
    "manifestJson" TEXT,
    "validationJson" TEXT,
    "exportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelSnapshot" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "levelIndex" INTEGER,
    "snapshotName" TEXT NOT NULL,
    "levelJson" TEXT NOT NULL,
    "diagnosisJson" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT,
    "source" TEXT,
    "summaryJson" TEXT,
    "validationJson" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "name" TEXT NOT NULL,
    "configJson" TEXT,
    "resultJson" TEXT,
    "filePath" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaytestSimulationRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levelIdsJson" TEXT NOT NULL,
    "simulatorConfigJson" TEXT NOT NULL,
    "formulaPresetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "summaryJson" TEXT,
    "resultJson" TEXT,
    "aiAdviceJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaytestSimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaytestLevelResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "levelIndex" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "passRate" DOUBLE PRECISION,
    "avgCompletionTime" DOUBLE PRECISION,
    "avgRemainingTime" DOUBLE PRECISION,
    "avgMoves" DOUBLE PRECISION,
    "avgSlotPressure" DOUBLE PRECISION,
    "failReasonsJson" TEXT,
    "qaIssuesJson" TEXT,
    "balanceSuggestionsJson" TEXT,
    "simulationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaytestLevelResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsImportBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "fileName" TEXT,
    "dataType" TEXT NOT NULL DEFAULT 'level_metrics',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fieldMappingJson" TEXT,
    "summaryJson" TEXT,
    "validationJson" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelAnalyticsRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "levelId" TEXT,
    "levelIndex" INTEGER,
    "levelName" TEXT,
    "users" INTEGER,
    "starts" INTEGER,
    "completes" INTEGER,
    "fails" INTEGER,
    "quits" INTEGER,
    "retries" INTEGER,
    "passRate" DOUBLE PRECISION,
    "failRate" DOUBLE PRECISION,
    "quitRate" DOUBLE PRECISION,
    "retryRate" DOUBLE PRECISION,
    "avgDurationSec" DOUBLE PRECISION,
    "avgRemainingTimeSec" DOUBLE PRECISION,
    "avgMoves" DOUBLE PRECISION,
    "avgBoostersUsed" DOUBLE PRECISION,
    "avgHintsUsed" DOUBLE PRECISION,
    "avgShuffleUsed" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "adImpressions" INTEGER,
    "iapPurchases" INTEGER,
    "rawJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelAnalyticsRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelFeedbackDiagnosis" (
    "id" TEXT NOT NULL,
    "levelId" TEXT,
    "levelIndex" INTEGER,
    "levelName" TEXT,
    "analyticsBatchId" TEXT,
    "formulaPresetId" TEXT,
    "resultJson" TEXT NOT NULL,
    "aiAdviceJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelFeedbackDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelOptimizationProposal" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "levelName" TEXT,
    "levelIndex" INTEGER,
    "sourceDiagnosisId" TEXT,
    "proposalName" TEXT NOT NULL,
    "proposalJson" TEXT NOT NULL,
    "diffJson" TEXT,
    "aiReasonJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "savedLevelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelOptimizationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemCatalog_itemId_key" ON "ItemCatalog"("itemId");

-- AddForeignKey
ALTER TABLE "GeneratedItem" ADD CONSTRAINT "GeneratedItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "GeneratedItemSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAsset" ADD CONSTRAINT "GeneratedAsset_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AssetGenerationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoGeneratedLevelCandidate" ADD CONSTRAINT "AutoGeneratedLevelCandidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutoLevelGenerationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestLevelResult" ADD CONSTRAINT "PlaytestLevelResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PlaytestSimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelAnalyticsRow" ADD CONSTRAINT "LevelAnalyticsRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AnalyticsImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
