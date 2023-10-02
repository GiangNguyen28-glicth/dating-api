FROM node:16.18.0-alpine AS development
WORKDIR /app

COPY package.json yarn.lock ./

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

RUN yarn install --frozen-lockfile

COPY . .

RUN npm run build dating-backend

FROM node:16.18.0-alpine

COPY --from=development /app/dist ./dist

CMD ["node", "dist/apps/dating-backend/main"]