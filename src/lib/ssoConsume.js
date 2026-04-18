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
    if (!hash || hash.length < 2) {
      console.log('[SSO] consumeSsoHash: no hash on this origin', window.location.origin)
      return false
    }
    const params = new URLSearchParams(hash.slice(1))
    const at = params.get('sso_at')
    const rt = params.get('sso_rt')
    if (!at || !rt) {
      console.log('[SSO] consumeSsoHash: hash present but no sso_at/sso_rt', { hashLen: hash.length, hasAt: !!at, hasRt: !!rt })
      return false
    }
    console.log('[SSO] consumeSsoHash: got tokens from hash, calling setSession…')
    const { data, error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
    if (error) {
      console.warn('[SSO] consumeSsoHash: setSession error', error.message)
      return false
    }
    console.log('[SSO] consumeSsoHash: setSession OK, user =', data?.session?.user?.email || '(no user)')
    history.replaceState(null, '', window.location.pathname + window.location.search)
    return true
  } catch (e) {
    console.warn('[SSO] consumeSsoHash failed:', e)
    return false
  }
}
