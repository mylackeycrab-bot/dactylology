FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json ./
RUN bun install

FROM base AS build
COPY . .
RUN bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY serve.ts .
EXPOSE 3000
CMD ["bun", "run", "serve.ts"]
