

## Plan: Add Google Sign-In

Lovable Cloud provides managed Google OAuth out of the box -- no API keys or external configuration needed.

### Steps

1. **Generate Lovable Cloud auth module** -- Use the "Configure Social Auth" tool to generate the `src/integrations/lovable/` module and install `@lovable.dev/cloud-auth-js`. This creates the `lovable.auth.signInWithOAuth()` function.

2. **Add `signInWithGoogle` to `useAuth` hook** -- Add a new function that calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` and export it from the hook.

3. **Add Google button to Auth page** -- Add a "Continuar con Google" button with a Google icon above the email/password form, separated by a visual divider ("o continuar con email"). The button will call `signInWithGoogle()`.

4. **Handle OAuth redirect** -- Ensure the existing `onAuthStateChange` listener in `useAuth` picks up the session after Google redirects back (it should work automatically since the Supabase client already listens for auth events).

### Technical Details

- Uses `lovable.auth.signInWithOAuth("google")` (NOT `supabase.auth.signInWithOAuth`)
- The `handle_new_user` trigger already creates profile + role on signup, so Google users get auto-provisioned
- No API keys needed -- Lovable Cloud manages Google OAuth credentials
- Redirect URL: `window.location.origin` (works for both preview and published domains)

### Files Modified
- `src/hooks/useAuth.tsx` -- add `signInWithGoogle` method
- `src/pages/Auth.tsx` -- add Google sign-in button + divider

### File Generated (by tool)
- `src/integrations/lovable/` -- auto-generated auth module

