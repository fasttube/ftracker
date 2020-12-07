FROM alpine:latest

RUN apk add --update --no-cache \
	bash python3 py3-pip nginx uwsgi uwsgi-python3 certbot certbot-nginx



WORKDIR /root/ftracker

COPY ftracker/ ./ftracker/
COPY setup.py .
COPY README.md .
COPY LICENSE.md .
COPY res/config.deploy.ini /etc/ftracker/config.ini

RUN pip3 install wheel
RUN pip3 install .



COPY web/ /var/www/html/ftracker/
COPY res/ ./res/

COPY res/ftracker.nossl.nginx.conf /etc/nginx/conf.d/ftracker.conf
RUN rm /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/ftracker /var/ftracker \
	&& chown -R nginx:nginx /etc/ftracker /var/ftracker



STOPSIGNAL SIGINT
RUN chmod +x ./res/docker-entrypoint.sh
ENTRYPOINT [ "./res/docker-entrypoint.sh" ]
