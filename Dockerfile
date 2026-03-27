FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY dist/ ./dist/
COPY tickers.txt ./

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]