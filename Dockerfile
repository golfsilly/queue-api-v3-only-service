FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl tzdata ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Bangkok
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
USER node
EXPOSE 5600
# docker-compose.yml จะเลือกเองว่ารันเป็น api หรือ sync
CMD ["node", "dist/main.api.js"]
