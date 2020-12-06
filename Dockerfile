FROM alpine:latest

ARG DOMAIN

RUN apk add --update --no-cache python3 py3-pip nginx uwsgi uwsgi-python3 certbot lsof

WORKDIR /root/ftracker

COPY ftracker/ ./ftracker/
COPY web/ /var/www/html/ftracker/
COPY res/ ./res/

COPY setup.py .
COPY README.md .
COPY LICENSE.md .

RUN mkdir -p /etc/ftracker /var/ftracker \
	&& chown -R nginx:nginx /etc/ftracker /var/ftracker

COPY res/config.deploy.ini /etc/ftracker/config.ini

RUN pip3 install .

RUN rm /etc/nginx/conf.d/default.conf
RUN if [ -n "$DOMAIN" ] ;\
	then \
		cp ./res/ftracker.docker.nginx.conf /etc/nginx/conf.d/ftracker.conf ;\
		certbot certonly --non-interactive --manual-public-ip-logging-ok -d ${DOMAIN} ;\
		sed -i "s|CERT|/usr/local/etc/letsencrypt/live/${DOMAIN}/fullchain.pem|g" /etc/nginx/conf.d/ftracker.conf ;\
		sed -i "s|KEY|/usr/local/etc/letsencrypt/live/${DOMAIN}/privkey.pem|g" /etc/nginx/conf.d/ftracker.conf ;\
		echo Installed certificate. ;\
	else \
		cp ./res/ftracker.nossl.nginx.conf /etc/nginx/conf.d/ftracker.conf ;\
		echo Skipped SSL installation. ;\
	fi

RUN chmod +x ./res/docker-entrypoint.sh
ENTRYPOINT [ "./res/docker-entrypoint.sh" ]
