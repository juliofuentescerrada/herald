#!/bin/sh
# Writes the admin's runtime-config.json from the environment (m4-images D-4); a missing value stops the container,
# because nginx's entry point stops at a failing script.
set -eu
for name in HERALD_AUTH_AUTHORITY HERALD_AUTH_CLIENT_ID HERALD_AUTH_API_SCOPE HERALD_PUBLIC_URL HERALD_API_URL; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "Herald admin: $name is not set; see docs/operations/identity.md." >&2
    exit 1
  fi
done
# With a path, even a trailing slash, nginx would replace /api/ in the forwarded path (default.conf.template).
case "${HERALD_API_URL#*://}" in
  */*) echo "Herald admin: HERALD_API_URL must have no path, not even a trailing slash." >&2; exit 1 ;;
esac
mkdir -p /tmp/herald
# The values are URLs, a GUID and a scope, none of which holds a quote or a backslash.
printf '{"authority":"%s","clientId":"%s","apiScope":"%s","publicUrl":"%s"}\n' \
  "$HERALD_AUTH_AUTHORITY" "$HERALD_AUTH_CLIENT_ID" "$HERALD_AUTH_API_SCOPE" "$HERALD_PUBLIC_URL" > /tmp/herald/runtime-config.json
