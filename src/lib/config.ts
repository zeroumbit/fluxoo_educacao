/**
 * System configuration.
 */

import { getHealthCheckResult } from './health-check'

// Run startup validation. Super Admin authorization must come from
// Supabase Auth app_metadata, never from a public frontend env var.
getHealthCheckResult()
