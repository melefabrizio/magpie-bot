FROM node:24-alpine AS builder
WORKDIR /app

COPY .yarn/releases/ .yarn/releases/
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install --immutable

COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# ---- runtime ----
FROM node:24-alpine AS runner
WORKDIR /app

# package.json required for "type": "module"
COPY package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
