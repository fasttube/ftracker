# FT Corona Tracker

Small webapp to track who was in which room at which time to backtrace potential viral infections.

**WORK IN PROGRESS** This project is still under heavy construction and not ready for use in production.

For Ideas and Progress see [Issues](https://git.fasttube.de/FaSTTUBe/ft-corona-tracker/issues).

## Requirements

- Unixoid system (linux, BSD, macOS). Windows might also work.
- `python` 3.6+ (might be `python3` on your system)
- `pip` for python 3+ (might be `pip3` on your system)

## How to run

(Dev setup, prod setup not finished yet)

```bash
# clone, cd into repo
pip install -e .
python3 -m ftracker
```

Edit `config.ini` to tune your installation.

Then, point your browser at <http://localhost:5000/?arrival=42>.

## Installation/Deployment

1. FTracker Backend

As above:
```bash
# clone, cd into repo
pip install . # Use -e if you want to hack on the backend while installed.
```

2. WSGI Server

You need a WSGI Middleware (using `Flask`'s included `werkzeug` is discouraged
for production environments.). I recommend `uwsgi` since it's flexible, fast
and has `nginx` integration. A sample configuration file as well as service
description files for both `systemd` and `rc` are included in `res/` which you
can adapt to your system (file paths etc.) (The `systemd` service file still
untested, feel free to leave feedback).

3. Webserver

You need a webserver. I recommend `nginx` because it's the industry standard
and fast. A sample config file is included at `res/ftracker.nginx.conf` which
you can adapt to your system (domain, SSL certs). The configuration should
include: Webroot in `web/` with a fallback to the WSGI handler for the backend.

Enabling SSL (https) and redirecting http to https is strongly encouraged, i
recommend using `let'sencrypt`'s `certbot` to easily obtain certificates.

4. Customization

Edit `config.ini` to your liking. Restart the backend by restarting the `uwsgi`
service, e.g. `sudo systemctl restart ftracker` or `sudo service ftracker
restart`

## License

Licensed under GNU GPL v3, see [LICENSE.md](https://git.fasttube.de/FaSTTUBe/ft-corona-tracker/src/branch/master/LICENSE.md) for details.

Copyright (C) 2020 Oskar/FaSTTUBe
