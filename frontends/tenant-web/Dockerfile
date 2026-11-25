# tenant-web 이미지 (멀티 스테이지: Vite 빌드 → nginx)
# VITE_ 값은 빌드 때 박힌다. API 주소를 바꾸면 이미지를 다시 만든다.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BACKEND_API_BASE_URL=https://api.darkhanmarie.site
ENV VITE_BACKEND_API_BASE_URL=$VITE_BACKEND_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
