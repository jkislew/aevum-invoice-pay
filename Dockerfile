# Serves the static dApp (app/) on port 8080.
FROM node:22-alpine
WORKDIR /srv
RUN npm install -g serve@14
COPY app/ ./app/
EXPOSE 8080
CMD ["serve", "-s", "app", "-l", "8080"]
