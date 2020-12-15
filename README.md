# FaSTTUBe Corona Tracker

Small webapp to track who was in which room at which time to backtrace
potential viral infections.

For Ideas, Progress, and Bugs visit
[Issues](https://git.fasttube.de/FaSTTUBe/ftracker/issues).

## Requirements

- Unixoid system (linux, BSD, macOS). Windows might also work.
- `python` 3.6+ (might be `python3` on your system)
- `pip` for python 3+ (might be `pip3` on your system)

## How to run

(Dev setup, for prod deployment see below)

```bash
# clone, cd into repo
pip install -e .
python3 -m ftracker
```

Edit `config.ini` to tune your installation (see
[INSTALL.md #customization](https://git.fasttube.de/FaSTTUBe/ft-corona-tracker/src/branch/master/INSTALL.md#customization)
for customization options).

Then, point your browser at <http://localhost:5000/>.

## Installation/Deployment

See
[INSTALL.md](https://git.fasttube.de/FaSTTUBe/ft-corona-tracker/src/branch/master/INSTALL.md)

## Open Sources

This project uses the `QRCode.js` library (Copyright (C) 2012 davidshimjs)
licensed under the MIT License, see `web/qrcodejs/LICENSE`. Thanks!

## License

FTracker is licensed under the GNU GPL v3 license, see
[LICENSE.md](https://git.fasttube.de/FaSTTUBe/ft-corona-tracker/src/branch/master/LICENSE.md)
for details.

Copyright (C) 2020 Oskar/FaSTTUBe
