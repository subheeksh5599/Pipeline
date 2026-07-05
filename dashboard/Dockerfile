FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S pipeline && adduser -S pipeline -G pipeline
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER pipeline
ENV PORT=3101
EXPOSE 3101
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3101 || exit 1
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
