-- CreateEnum
CREATE TYPE "TalkItemType" AS ENUM ('SECTION', 'TEXT', 'RATING', 'YESNO');

-- CreateEnum
CREATE TYPE "TalkStatus" AS ENUM ('DRAFT', 'SHARED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TalkParty" AS ENUM ('MANAGER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "TalkTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "TalkItemType" NOT NULL DEFAULT 'TEXT',
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TalkTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talk" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "TalkStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Talk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkItem" (
    "id" TEXT NOT NULL,
    "talkId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "TalkItemType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TalkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkAnswer" (
    "id" TEXT NOT NULL,
    "talkId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "party" "TalkParty" NOT NULL,
    "text" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalkAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalkTemplate_ownerId_idx" ON "TalkTemplate"("ownerId");

-- CreateIndex
CREATE INDEX "TalkTemplateItem_templateId_order_idx" ON "TalkTemplateItem"("templateId", "order");

-- CreateIndex
CREATE INDEX "Talk_employeeId_idx" ON "Talk"("employeeId");

-- CreateIndex
CREATE INDEX "Talk_managerId_idx" ON "Talk"("managerId");

-- CreateIndex
CREATE INDEX "TalkItem_talkId_order_idx" ON "TalkItem"("talkId", "order");

-- CreateIndex
CREATE INDEX "TalkAnswer_talkId_idx" ON "TalkAnswer"("talkId");

-- CreateIndex
CREATE UNIQUE INDEX "TalkAnswer_itemId_party_key" ON "TalkAnswer"("itemId", "party");

-- AddForeignKey
ALTER TABLE "TalkTemplate" ADD CONSTRAINT "TalkTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkTemplateItem" ADD CONSTRAINT "TalkTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TalkTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talk" ADD CONSTRAINT "Talk_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TalkTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talk" ADD CONSTRAINT "Talk_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talk" ADD CONSTRAINT "Talk_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkItem" ADD CONSTRAINT "TalkItem_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "Talk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkAnswer" ADD CONSTRAINT "TalkAnswer_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "Talk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkAnswer" ADD CONSTRAINT "TalkAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TalkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
