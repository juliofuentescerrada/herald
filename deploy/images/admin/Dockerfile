# The admin application (m4-images D-1, D-2, D-4): the output of `pnpm --dir web build admin`, served by unprivileged nginx,
# which forwards /api/ to HERALD_API_URL and writes runtime-config.json at start.
FROM nginxinc/nginx-unprivileged:stable@sha256:ec0f7ecb1fbd84959ac114e65fb36074ffc97d4d51db0f18ee925162d889dcef
COPY web/dist/admin/browser/ /usr/share/nginx/html/
COPY deploy/images/admin/default.conf.template /etc/nginx/templates/
COPY --chmod=755 deploy/images/admin/40-herald-runtime-config.sh /docker-entrypoint.d/
