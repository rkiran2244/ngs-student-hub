# Frontend Dockerfile (multi-stage build)
FROM node:20-alpine as build
WORKDIR /app

# Install deps
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent

# Copy and build
COPY frontend/ .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage - nginx static host
FROM nginx:stable-alpine as runtime
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback to index.html
RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/studenthub.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
