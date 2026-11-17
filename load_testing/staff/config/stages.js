/**
 * Virtual Users (VU) configuration for ascending load testing.
 * You can tweak these constants here, or override them dynamically via CLI flags:
 * e.g. k6 run -e PROFILE=smoke scenario.js
 * e.g. k6 run -e STAGE_DURATION=1m scenario.js
 */

export const VU_LEVELS = {
  WARMUP: 10,       // Initial warmup / low off-peak hours
  NORMAL: 25,       // Regular restaurant operational traffic
  RUSH_HOUR: 50,    // High concurrency peak lunch/dinner rush
  PEAK_SURGE: 100,  // Stress test / maximum anticipated load
};

// Stage duration (default 2 minutes per plateau)
const DURATION = __ENV.STAGE_DURATION || '2m';
const RAMP_TIME = __ENV.RAMP_TIME || '30s';

/**
 * Ascending Staged Ramp-up:
 * 1. Ramp to 10 VUs -> hold ->
 * 2. Ramp to 25 VUs -> hold ->
 * 3. Ramp to 50 VUs -> hold ->
 * 4. Ramp to 100 VUs -> hold ->
 * 5. Cooldown to 0 VUs
 */
export const ASCENDING_STAGES = [
  // Tier 1: 10 VUs
  { duration: RAMP_TIME, target: VU_LEVELS.WARMUP },
  { duration: DURATION,  target: VU_LEVELS.WARMUP },

  // Tier 2: 25 VUs
  { duration: RAMP_TIME, target: VU_LEVELS.NORMAL },
  { duration: DURATION,  target: VU_LEVELS.NORMAL },

  // Tier 3: 50 VUs
  { duration: RAMP_TIME, target: VU_LEVELS.RUSH_HOUR },
  { duration: DURATION,  target: VU_LEVELS.RUSH_HOUR },

  // Tier 4: 100 VUs
  { duration: RAMP_TIME, target: VU_LEVELS.PEAK_SURGE },
  { duration: DURATION,  target: VU_LEVELS.PEAK_SURGE },

  // Cooldown
  { duration: '30s', target: 0 },
];

/**
 * Smoke test profile:
 * Quick 30s run with 1 VU to verify script functionality before running heavy tests.
 */
export const SMOKE_STAGES = [
  { duration: '30s', target: 1 },
];

/**
 * Fast 5-minute ascending test (useful for fast local docker validation)
 */
export const FAST_ASCENDING_STAGES = [
  { duration: '15s', target: 10 },
  { duration: '45s', target: 10 },
  { duration: '15s', target: 25 },
  { duration: '45s', target: 25 },
  { duration: '15s', target: 50 },
  { duration: '45s', target: 50 },
  { duration: '15s', target: 100 },
  { duration: '45s', target: 100 },
  { duration: '15s', target: 0 },
];

/**
 * Helper to select the active stage profile based on environment variable:
 * e.g.: k6 run -e PROFILE=smoke scenarios/01_queue_flow.js
 */
export function getActiveStages() {
  const profile = (__ENV.PROFILE || 'ascending').toLowerCase();
  switch (profile) {
    case 'smoke':
      return SMOKE_STAGES;
    case 'fast':
      return FAST_ASCENDING_STAGES;
    case 'ascending':
    default:
      return ASCENDING_STAGES;
  }
}

