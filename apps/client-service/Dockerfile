FROM node:16.18.0-buster  AS development
WORKDIR /app

COPY package.json yarn.lock ./

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    make \
    g++ \
    libjpeg-dev \
    libcairo2-dev \
    libgif-dev \
    libpango1.0-dev \
    libtool \
    autoconf \
    automake \
    && rm -rf /var/lib/apt/lists/*

RUN yarn install --frozen-lockfile

COPY . .

RUN npm run build dating-backend

FROM node:16.18.0-buster

COPY --from=development /app/dist ./dist

CMD ["node", "dist/apps/dating-backend/main"]