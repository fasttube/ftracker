#!/bin/bash

echo " >>> Starting nginx <<< "

mkdir /run/nginx # needed because of bug in package
/usr/sbin/nginx -t
/usr/sbin/nginx

echo " >>> Checking / Installing SSL certificate <<< "

if [[ ${DOMAIN} ]]
then
	echo "Obtaining cert for '${DOMAIN}' ..."
	echo "Registering with email '${LE_EMAIL}' ..."

	certbot -n \
		--nginx \
		--keep-until-expiring \
		--redirect \
		--agree-tos \
		--cert-name ${DOMAIN} \
		-d ${DOMAIN} \
		-m ${LE_EMAIL}

	echo "Checked/Installed SSL certificate."
fi

echo " >>> Starting uwsgi <<< "

/usr/sbin/uwsgi --ini /root/ftracker/res/ftracker.alpine.uwsgi.ini
