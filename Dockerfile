FROM node:16-alpine

WORKDIR /app

COPY package*.json .

RUN npm install --force

COPY . .

EXPOSE 4001

CMD ["npm", "run", "build"]