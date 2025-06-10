-- DropIndex
DROP INDEX "exam_sessions_examId_userId_isActive_key";

-- CreateIndex
CREATE INDEX "exam_sessions_examId_userId_isActive_idx" ON "exam_sessions"("examId", "userId", "isActive");
