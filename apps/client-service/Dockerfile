FROM node:16.18.0-alpine AS development
WORKDIR /app

COPY package*.json ./

RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

RUN npm install

COPY . .

RUN npm run build client-service

FROM node:16.18.0-alpine

COPY --from=development /app/dist ./dist

CMD ["node", "dist/apps/client-service/main"]