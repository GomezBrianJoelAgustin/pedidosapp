FROM composer:2 AS composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM node:20-alpine AS frontend

RUN apk add --no-cache \
    php83 \
    php83-mbstring \
    php83-openssl \
    php83-tokenizer \
    php83-xml \
    php83-ctype \
    php83-phar \
    php83-dom \
    php83-simplexml \
    php83-fileinfo \
    php83-session \
    && ln -sf /usr/bin/php83 /usr/bin/php

WORKDIR /app

COPY --from=composer /app /app

ENV APP_KEY=base64:0000000000000000000000000000000000000000=

COPY package.json package-lock.json ./
RUN npm install
RUN npm run build

FROM richarvey/nginx-php-fpm:3.1.6

COPY --from=composer /app /var/www/html

COPY --from=frontend /app/public/build /var/www/html/public/build

RUN chmod +x /var/www/html/deploy.sh

ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1

ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr

CMD ["/start.sh"]