-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "timeRemaining" INTEGER,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "sessionData" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_submissionId_key" ON "exam_sessions"("submissionId");

-- CreateIndex
CREATE INDEX "exam_sessions_examId_userId_idx" ON "exam_sessions"("examId", "userId");

-- CreateIndex
CREATE INDEX "exam_sessions_userId_isActive_idx" ON "exam_sessions"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_examId_userId_isActive_key" ON "exam_sessions"("examId", "userId", "isActive");

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "exam_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
