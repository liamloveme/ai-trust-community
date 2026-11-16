FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p /app/data/uploads /app/data/stickers && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
