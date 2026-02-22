/**
 * updateStreak – call whenever a user does a study activity (login / question attempt).
 * Rules:
 *  - If lastStudyDate is TODAY  → streak unchanged (already counted today)
 *  - If lastStudyDate is YESTERDAY → streak + 1
 *  - Otherwise (gap or null)    → reset streak to 1
 *
 * Mutates the user document but does NOT save – caller is responsible for saving.
 */
export const updateStreak = (user) => {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!user.lastStudyDate) {
    user.streak        = 1;
    user.lastStudyDate = today;
    return;
  }

  const last = new Date(user.lastStudyDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());

  if (lastDay.getTime() === today.getTime()) {
    // Already studied today – nothing to change
    return;
  }

  if (lastDay.getTime() === yesterday.getTime()) {
    // Studied yesterday – extend streak
    user.streak        = (user.streak || 0) + 1;
    user.lastStudyDate = today;
  } else {
    // Missed a day – reset
    user.streak        = 1;
    user.lastStudyDate = today;
  }
};