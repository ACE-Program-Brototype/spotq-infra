import { sleep } from 'k6';

/**
 * Pacing / Think Time:
 * Real restaurant staff do not click continuously.
 * Pauses execution for a random duration between min and max seconds.
 */
export function thinkTime(minSeconds = 1, maxSeconds = 3) {
  const duration = Math.random() * (maxSeconds - minSeconds) + minSeconds;
  sleep(duration);
}

/**
 * Pick an element from an array randomly
 */
export function randomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a valid dummy E.164 phone number for walk-in testing (+91 followed by 6-9 and 9 digits)
 */
export function generateE164Phone() {
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
  const remainingDigits = Math.floor(100000000 + Math.random() * 900000000);
  return `+91${firstDigit}${remainingDigits}`;
}

/**
 * Selects an authenticated staff session round-robin based on VU ID.
 * If 1 staff account exists, all VUs share it.
 * If 5 staff accounts exist, VUs are distributed evenly across them.
 */
export function getVuSession(sessions) {
  if (!sessions || sessions.length === 0) {
    throw new Error('No active staff sessions available for VU execution.');
  }
  // __VU is the 1-based index of the current virtual user in k6
  const index = (__VU - 1) % sessions.length;
  return sessions[index];
}

