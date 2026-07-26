-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Pending', 'User', 'Admin', 'SuperAdmin', 'Rejected');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('BestPractice', 'RepetitiveProblem', 'SupportingSlide');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Draft', 'Submitted', 'Reviewed', 'Accepted');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Review', 'NeedMoreInfo');

-- CreateEnum
CREATE TYPE "ImplementationStage" AS ENUM ('PendingReview', 'FeasibilityAnalysis', 'Procurement', 'ExecutionShutdown', 'ExecutionRunning', 'Testing', 'Standardized', 'Closed');

-- CreateEnum
CREATE TYPE "SafetyImpact" AS ENUM ('High', 'Medium', 'Low', 'None');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('Open', 'InProgress', 'Closed');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "ActionItemStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Cycle" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "type",
ADD COLUMN     "type" "SubmissionType" NOT NULL,
DROP COLUMN "calculationTable",
ADD COLUMN     "calculationTable" JSONB,
DROP COLUMN "impactCalculation",
ADD COLUMN     "impactCalculation" JSONB,
DROP COLUMN "whyWhyAnalysis",
ADD COLUMN     "whyWhyAnalysis" JSONB,
DROP COLUMN "actionTakenTable",
ADD COLUMN     "actionTakenTable" JSONB,
DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL,
DROP COLUMN "customTable",
ADD COLUMN     "customTable" JSONB,
DROP COLUMN "supportingSlideType",
ADD COLUMN     "supportingSlideType" "SubmissionType";

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "SuggestionStatus" NOT NULL,
DROP COLUMN "implementationStage",
ADD COLUMN     "implementationStage" "ImplementationStage" DEFAULT 'PendingReview',
DROP COLUMN "safetyImpact",
ADD COLUMN     "safetyImpact" "SafetyImpact";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changedFields" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityId_entityType_idx" ON "AuditLog"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "ActionItem_suggestionId_assignedToId_idx" ON "ActionItem"("suggestionId", "assignedToId");

-- CreateIndex
CREATE INDEX "Submission_departmentId_idx" ON "Submission"("departmentId");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_cycleId_idx" ON "Submission"("cycleId");

-- CreateIndex
CREATE INDEX "Suggestion_submissionId_idx" ON "Suggestion"("submissionId");

-- CreateIndex
CREATE INDEX "Suggestion_suggestedById_idx" ON "Suggestion"("suggestedById");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

