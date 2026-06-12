# Stage 1 — grab the latest Node binary
# Both images are Alpine (musl libc), so the binary is drop-in compatible
FROM node:alpine AS node-latest

# Stage 2 — nginx serving the PWA + Node for the backoffice TUI
FROM nginx:alpine

# Pull in just the Node binary from stage 1 (no npm, no extras needed —
# the backoffice has zero dependencies and built-ins are compiled into the binary)
COPY --from=node-latest /usr/local/bin/node /usr/local/bin/node

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy app config
COPY nginx.conf /etc/nginx/conf.d/devstretch.conf

# Copy only the PWA files — tools/, docs/, hooks stay out
COPY index.html style.css manifest.json \
     version.js exercises.json notifications.js script.js pwa.js sw.js \
     /usr/share/nginx/html/
COPY icons/  /usr/share/nginx/html/icons/
COPY sounds/ /usr/share/nginx/html/sounds/

# Copy backoffice TUI — invoke with:
#   docker exec -it -w /usr/share/nginx/html devstretch-plus node /app/backoffice/cli.js
COPY tools/backoffice/cli.js /app/backoffice/cli.js

EXPOSE 80
