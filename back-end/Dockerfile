FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run && npm run start:dev"]

FROM deps AS production
ENV NODE_ENV=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]
