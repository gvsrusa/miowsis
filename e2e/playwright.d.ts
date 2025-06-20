import type { Page, Route } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js'

// Type declarations for Playwright test helpers
export type PlaywrightPage = Page;
export type PlaywrightRoute = Route;

// Extend Window interface for Supabase in tests
declare global {
  interface Window {
    supabase?: SupabaseClient
    authEvents?: Array<{
      event: string
      hasSession: boolean
      timestamp: string
    }>
  }
}