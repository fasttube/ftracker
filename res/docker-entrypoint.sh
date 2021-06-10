#!/bin/bash

echo " >>> Checking / Creating & patching VAPID creds <<< "

VAPID_CREDS_FILE=/etc/ftracker/vapid-creds.json
if [[ ! -f $VAPID_CREDS_FILE ]]
then

	echo "Generating keypair ..."

	web-push generate-vapid-keys --json > $VAPID_CREDS_FILE

	echo "Patching public key into frontend ..."
	PUB_KEY=`cat $VAPID_CREDS_FILE | jq -r .publicKey`
	sed -i "s/pushServerPublicKey = '[a-zA-Z0-9_\-]*'/pushServerPublicKey = '${PUB_KEY}'/" /var/www/html/ftracker/main.js

	echo "Patching private key into backend config ..."
	PRIV_KEY=`cat $VAPID_CREDS_FILE | jq -r .privateKey`
	echo "push_private_key = ${PRIV_KEY}" >> /etc/ftracker/config.ini

fi

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

exec /usr/sbin/uwsgi --ini /root/ftracker/res/ftracker.alpine.uwsgi.ini
