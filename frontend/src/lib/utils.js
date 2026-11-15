import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names cleanly with Tailwind Merge
 * @param {...string} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a timestamp into an abbreviated readable 24h format with seconds
 * @param {Date | number | string} date
 * @returns {string}
 */
export function formatTimestamp(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Formats a similarity score into a clear percentage or fixed number
 * @param {number} score
 * @returns {string}
 */
export function formatScore(score) {
  if (typeof score !== "number") return "0.00";
  return score.toFixed(3);
}

/**
 * Generates a random alphanumeric mock device ID
 * @returns {string}
 */
export function generateDeviceId() {
  return "GAIT_" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Truncates an API key or org ID for secure UI presentation
 * @param {string} key
 * @returns {string}
 */
export function truncateKey(key = "") {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Sanitizes an internal redirect target and appends it as ?redirect= to an auth path.
 * Prevents open redirects to external URLs.
 * @param {string} authBasePath
 * @param {string} redirectTo
 * @returns {string}
 */
export function buildAuthUrl(authBasePath, redirectTo) {
  const isSafeInternalPath =
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//");
  if (!isSafeInternalPath || redirectTo === "/") {
    return authBasePath;
  }
  return `${authBasePath}?redirect=${encodeURIComponent(redirectTo)}`;
}
