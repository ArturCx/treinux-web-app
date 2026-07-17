-- CreateIndex
CREATE UNIQUE INDEX "workout_log_entry_logId_exerciseId_setNumber_key" ON "workout_log_entry"("logId", "exerciseId", "setNumber");
