# Firewall Configuration for Build Process

## Issue

The Next.js build process requires access to external resources, specifically `fonts.googleapis.com` for Google Fonts optimization. When running in environments with firewall restrictions, this can cause build failures.

## Affected Resources

The following domains need to be accessible during the build process:

- `fonts.googleapis.com` - Google Fonts CSS and font metadata
- `fonts.gstatic.com` - Google Fonts font files

## Why This is Needed

Next.js 15's `next/font/google` feature automatically optimizes Google Fonts by:
1. Downloading font files during build time
2. Self-hosting them to eliminate external requests at runtime
3. Removing layout shift with automatic font optimization

## Solutions

### Option 1: Allow List Configuration (Recommended)

Add the following domains to your firewall allowlist:
- `fonts.googleapis.com`
- `fonts.gstatic.com`

For GitHub Actions, this can be configured in the repository's Copilot coding agent settings.

### Option 2: Pre-Build Setup (Alternative)

Configure Actions setup steps to pre-download fonts before the firewall is enabled. See [Actions setup steps documentation](https://gh.io/copilot/actions-setup-steps).

### Option 3: Use Local Fonts Only

Remove Google Fonts imports and use only local fonts. However, this removes the optimization benefits of Next.js font loading.

## Current Font Configuration

The application uses the following Google Fonts:
- **Inter** - General UI text (400 weight)
- **Inter Tight** - Compact UI text (400 weight)
- **Roboto Mono** - Monospace text (400 weight)

All fonts are configured with:
- `display: 'swap'` - Show fallback font immediately while loading
- Fallback fonts - Ensure graceful degradation
- Font subsetting - Only load Latin characters to reduce file size

## Impact on Runtime

Even if fonts cannot be optimized during build due to firewall restrictions, the application will:
1. Fall back to system fonts (Arial, sans-serif, Courier New)
2. Attempt to load Google Fonts from CDN at runtime (if CSP allows)
3. Continue to function normally with slightly degraded typography

## Related Files

- `apps/web/app/layout.tsx` - Font configuration
- `apps/web/next.config.js` - CSP headers allowing runtime font loading
- `.gitignore` - Excludes sensitive configuration files

## Security Considerations

The CSP (Content Security Policy) headers in `next.config.js` explicitly allow Google Fonts:
- Runtime access to `fonts.googleapis.com` and `fonts.gstatic.com`
- This is required for OnchainKit (OCK) components that load fonts dynamically

These permissions are secure and follow Next.js and Google Fonts best practices.
