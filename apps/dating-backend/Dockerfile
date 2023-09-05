FROM node:16.18.0-alpine AS development
WORKDIR /app

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

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build dating-backend

FROM node:16.18.0-alpine

COPY --from=development /app/dist ./dist

CMD ["node", "dist/apps/dating-backend/main"]