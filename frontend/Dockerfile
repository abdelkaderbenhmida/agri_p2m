# Stage 1: Build the Angular application
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Angular application builder outputs the deployable app under the browser directory.
COPY --from=build /app/dist/agricultural-marketplace/browser/ /usr/share/nginx/html/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api-gateway:8080
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM
# create non-root user and adjust permissions, run nginx on 8080
RUN addgroup -S app && adduser -S -G app -u 1000 appuser \
	&& mkdir -p /var/cache/nginx /var/log/nginx /var/run /run /etc/nginx/conf.d \
	&& chown -R appuser:app /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run /run /etc/nginx/conf.d /etc/nginx/templates

USER 1000
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
