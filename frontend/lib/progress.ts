// Utilities for calculating and formatting user progress
export const calculateProgressPercentage = (completed: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};