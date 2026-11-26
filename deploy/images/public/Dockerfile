# The public SSR server (m4-images D-1, D-2): the output of `pnpm --dir web build public`, which bundles its dependencies.
FROM node:26-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5
WORKDIR /app
COPY web/dist/public/ ./
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
USER node
ENTRYPOINT ["node", "server/server.mjs"]
