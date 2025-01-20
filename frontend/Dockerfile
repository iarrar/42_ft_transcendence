FROM nginx:alpine

RUN apk add --update openssl && \
    rm -rf /var/cache/apk/*

RUN mkdir /etc/certs && mkdir /etc/certs/tls
RUN openssl req -new -newkey rsa:4096 -x509 -nodes -keyout \
    etc/certs/tls/inception.key -out etc/certs/tls/inception.csr \
    -subj "/C=FR/ST=PO/L=Perpignan/O=42/OU=42Perpignan/CN=Transcendence/UID=login"

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
