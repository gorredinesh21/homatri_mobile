// Mirrors the backend meal clock (IST): LUNCH cutoff 11:30, DINNER cutoff 18:30.
// After the dinner cutoff the next orderable window is tomorrow's LUNCH.

const LUNCH_CUTOFF_MINUTES = 11 * 60 + 30; // 11:30 IST
const DINNER_CUTOFF_MINUTES = 18 * 60 + 30; // 18:30 IST

function istMinutes(now = new Date()) {
  const ist = new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000);
  return ist.getHours() * 60 + ist.getMinutes();
}

export function getOrderableMealWindow(now = new Date()) {
  const minutes = istMinutes(now);
  if (minutes < LUNCH_CUTOFF_MINUTES) {
    return { mealWindow: "LUNCH", label: "Lunch · today, 11:30 AM cutoff" };
  }
  if (minutes < DINNER_CUTOFF_MINUTES) {
    return { mealWindow: "DINNER", label: "Dinner · today, 6:30 PM cutoff" };
  }
  return { mealWindow: "LUNCH", label: "Lunch · tomorrow (dinner cutoff passed)" };
}

export function isWindowOrderable(mealWindow, now = new Date()) {
  const minutes = istMinutes(now);
  return mealWindow === "LUNCH" ? minutes < LUNCH_CUTOFF_MINUTES : minutes < DINNER_CUTOFF_MINUTES;
}

/**
 * Which meal_window should checkout send for this cart?
 * - Cart line says LUNCH/DINNER and that window is still orderable → keep it.
 * - Cart line says BOTH (or its window's cutoff passed) → the currently orderable window.
 */
export function resolveCheckoutMealWindow(cartLines = []) {
  const orderable = getOrderableMealWindow();
  const first = (cartLines || [])[0];
  const requested =
    first && (first.mealWindow === "LUNCH" || first.mealWindow === "DINNER") ? first.mealWindow : null;
  if (!requested || !isWindowOrderable(requested)) return orderable;
  return {
    mealWindow: requested,
    label: requested === "LUNCH" ? "Lunch · 11:30 AM cutoff" : "Dinner · 6:30 PM cutoff",
  };
}
