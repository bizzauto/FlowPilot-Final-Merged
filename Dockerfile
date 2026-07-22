FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat wget

WORKDIR /app

COPY web/package*.json ./
COPY web/prisma ./prisma

RUN npm install

RUN npx prisma generate

COPY web/ .

RUN npm run build

RUN chmod +x ./scripts/docker-entrypoint.sh || true

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]