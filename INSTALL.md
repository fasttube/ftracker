How to install and set up an `ftracker` instance
================================================

## Installation

There are 2 methods: Docker and Manual

Docker is usually easier and faster but might not suit your needs.

### Method A: Docker

Pull the container from docker hub using

```bash
sudo docker pull fasttube/ftracker
```

OR build the container locally with

```bash
sudo docker build . -t fasttube/ftracker
```

Then, if you want the container to also handle SSL so it can run standalone you
need to pass it a domain and email so it can obtain a certificate from `Let's
encrypt`. Use the first path in the `-v` option to point to your config file
(see below for customization options):

```bash
sudo docker run \
	-it --rm \
	--name ftracker \
	-e DOMAIN=example.com \
	-e LE_EMAIL=admin@example.com \
	-p 80:80 \
	-p 443:443 \
	-v /your/full/path/to/config.ini:/etc/ftracker/config.ini \
	fasttube/ftracker
```

Otherwise you can run it without SSL (maybe behind your own web+ssl server)
using just

```bash
sudo docker run \
	-it --rm \
	--name ftracker \
	-p 80:80 \
	-v /your/full/path/to/config.ini:/etc/ftracker/config.ini \
	fasttube/ftracker
```

If those work in the foreground and everything looks okay, you can start them
without `-it --rm` and with `-d` instead to run them in the background. Keep in
mind that it can take around 10 seconds to fully start.

To stop/start/uninstall the container afterwards, run:

```bash
sudo docker stop ftracker  # might take a few seconds
sudo docker start ftracker # continue running
sudo docker rm -f ftracker # uninstall
```

### Method B: Manual

#### 1. FTracker Backend

Install backend system wide:
```bash
# clone, cd into repo
sudo -H pip install . # Use -e if you want to hack on the backend while installed.
```

#### 2. WSGI Server + Service file

You need a WSGI Middleware (using `Flask`'s included `werkzeug` is discouraged
for production environments). I recommend `uwsgi` since it's flexible, fast and
has `nginx` integration. A sample configuration file as well as service
description files for both `systemd` and `rc` are included in `res/` for you to
adapt (file paths etc.) and install to your system (The `systemd` service file
still untested though, feel free to leave feedback).

#### 3. Webserver

You need a webserver. I recommend `nginx` because it's the industry standard
and fast. A sample config file is included in `res/` for you to adapt (domain,
SSL certs) and install to your system. The configuration should include:
Webroot in `web/` with a fallback to the WSGI handler for the backend.

Enabling SSL (https) and redirecting http to https is strongly encouraged, i
recommend using `Let's Encrypt`'s `certbot` to easily obtain certificates.

#### 4. Start/Restart

Edit `config.ini` to your liking. Restart the backend by restarting the `uwsgi`
service, e.g. `sudo systemctl restart ftracker` or `sudo service ftracker
restart`. see below for customization options.

## Customization

`ftracker` has a couple of ways you can make it your own. Here is a breakdown
of the functionalities.

The configuration file is in the `ini` format and all options are in the
`[global]` section. It should be placed in/mounted at
`/etc/ftracker/config.ini` or passed to the python module as the first
argument.

### Storage

`ftracker` uses `TinyDB` for data storage, which is essentially a `json` file.
For manual installations, you can decide where on your filesystem it should be
using the `db_file` option. We recommend something like `/var/ftracker/db.json`
for which you'd need to create the `/var/ftracker` directory and set its
permissions to your webserver user. The docker container handles this
internally.

### Data access

The 'data view' at `/view` is used to view the attendance data. It is protected
using a hard-configured username/password combo because i'm lazy and we didn't
need anything more fancy. We recommend you choose a safe, unguessable password
to protect the attendance data using the `admin_user` and `admin_pass` config
options. Please note: Location data is very sensitive data and has to be
handled carefully under the GDPR. Make sure all users know what happens to
their data and who has access to it.

### Guidelines

When arriving/signing in, users have to agree to a set of guidelines. Insert
a link to a publicly hosted version of your guideline document in the
`guideline_url` option to allow users to find it easily.

### List of allowed names

Some places might require all users arriving/signing in to be in a list of
pre-approved users (i.e. users that signed a permit). To block all names not in
such a list, provide a CSV file with all approved names (and optionally email
adresses for future features ;)) and enter the file's full location in the
`name_file` option. The recommended location is `/var/ftracker/namelist.csv` or
similar.

If you're using docker, you need to mount this file to the location specified
in `name_file` when `run`ning the container using an argument like `-v
/your/host/path/to/namelist.csv:/var/ftracker/namelist.csv`.

The CSV format is:

```
Jane,Doe,j.doe@example.com
First Name,Last Name,f.lastname@example.com
```

Users have to enter their full name like `Jane Doe` in order to be admitted.
The names are slugified for comparison, meaning case, accents and double spaces
are ignored (i.e.

```
jänE   doé
```

would still work, but `Jane D` wouldn't).
