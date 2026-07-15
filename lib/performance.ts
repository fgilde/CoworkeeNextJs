const RATING_LABELS = ["unrated", "poor", "fair", "good", "veryGood", "excellent"] as const;

export function ratingLabel(rating: number | null): string {
  if (rating === null || rating < 1) return "unrated";
  const clamped = Math.min(5, Math.round(rating));
  return RATING_LABELS[clamped];
}
