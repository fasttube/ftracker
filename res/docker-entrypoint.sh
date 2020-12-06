#!/bin/sh

echo " >>> starting nginx <<< "

mkdir /run/nginx # needed because of bug in package
/usr/sbin/nginx -t
/usr/sbin/nginx

echo " >>> starting uwsgi <<< "

/usr/sbin/uwsgi --ini /root/ftracker/res/ftracker.alpine.uwsgi.ini
