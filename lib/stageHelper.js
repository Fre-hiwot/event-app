export function getCurrentStage(event) {
  const now = new Date();

  const dates = event.end_date_stages || {};
  const prices = event.price_regular_stages || {};

  if (dates.early && new Date(now) <= new Date(dates.early)) {
    return { stage: "early", price: prices.early || 0 };
  }

  if (dates.round2 && new Date(now) <= new Date(dates.round2)) {
    return { stage: "round2", price: prices.round2 || 0 };
  }

  if (dates.round3 && new Date(now) <= new Date(dates.round3)) {
    return { stage: "round3", price: prices.round3 || 0 };
  }

  return { stage: "expired", price: 0 };
}