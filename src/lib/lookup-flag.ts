// The profile lookup reads public linkedin.com/in pages and parses them. That
// is against LinkedIn's user agreement, and at public volume the deployment's
// egress IPs get rate limited or blocked, so it is off unless someone running
// their own copy turns it on deliberately.
//
// NEXT_PUBLIC_ so the client can hide the entry point and the routes can
// enforce it from the same value. The compliant import paths (CSV, Luma,
// manual entry, LinkedIn OAuth sign-in) are unaffected and always available.

export const LOOKUP_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LINKEDIN_LOOKUP === "true";

export const LOOKUP_DISABLED_MESSAGE =
  "Profile lookup is turned off on this deployment. Import a CSV or pull a Luma guest list instead.";
