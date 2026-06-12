FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy app config
COPY nginx.conf /etc/nginx/conf.d/devstretch.conf

# Copy only the PWA files — tools/, docs/, hooks stay out
COPY index.html style.css manifest.json \
     version.js exercises.js notifications.js script.js pwa.js sw.js \
     /usr/share/nginx/html/
COPY icons/  /usr/share/nginx/html/icons/
COPY sounds/ /usr/share/nginx/html/sounds/

EXPOSE 80
