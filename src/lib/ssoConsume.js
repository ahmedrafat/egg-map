// Cross-app SSO consumer — pairs with ssoHandoff.js in egypt-globe-os.
// Picks up Supabase tokens from URL hash after the main OS bounces the user
// back here, and hands them to Supabase so the session is restored.
import { supabase } from './supabase.js'

const OS_URL = 'https://www.egyptbulkers.com/'

/** redirectTo URL that asks main OS to bounce the user back to this origin. */
export function ssoRedirectUrl() {
  return `${OS_URL}?sso_target=${encodeURIComponent(window.location.origin)}`
}

/**
 * Consume `#sso_at=...&sso_rt=...` from the URL hash, hand tokens to
 * Supabase, and strip the hash. Returns true if a session was set.
 */
export async function consumeSsoHash() {
  try {
    const hash = window.location.hash
    if (!hash || hash.length < 2) return false
    const params = new URLSearchParams(hash.slice(1))
    const at = params.get('sso_at')
    const rt = params.get('sso_rt')
    if (!at || !rt) return false
    await supabase.auth.setSession({ access_token: at, refresh_token: rt })
    history.replaceState(null, '', window.location.pathname + window.location.search)
    return true
  } catch (e) {
    console.warn('SSO handoff failed:', e)
    return false
  }
}
