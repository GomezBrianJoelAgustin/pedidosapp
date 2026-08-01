FROM tangramor/nginx-php8-fpm:php8.4.16_node25.2.1

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apk add --no-cache php84-pgsql php84-pdo_pgsql

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN npm install && npm run build

RUN chmod +x deploy.sh

RUN chown -R nobody:nobody storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1

ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr

CMD ["/start.sh"]