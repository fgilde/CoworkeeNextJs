-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#6366f1',
ADD COLUMN     "logoPath" TEXT,
ADD COLUMN     "themePreset" TEXT NOT NULL DEFAULT 'default';
