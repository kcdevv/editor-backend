FROM node:alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8080

RUN npm run build

CMD ["sh", "-c", "PORT=${PORT:-8080} npm start"]