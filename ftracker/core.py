import json
from datetime import datetime
from slugify import slugify

from .config import config
if not config:
	print('No configuration file found.')
	exit()


from tinydb import TinyDB
dbfile = config['global'].get('db_file') or '/tmp/ftracker-db.json'
db = TinyDB(dbfile, indent=4)
# TODO: Load name list if needed


from flask import Flask, request
app = Flask(__name__)


@app.route('/')
def get_root():
	return "Error: No Endpoint selected. See docs/API.md for reference.", 404

@app.route('/arrival', methods=['POST'])
def post_time():

	try:
		payload = request.data.decode('UTF-8')
		data = json.loads(payload)
	except ValueError as e:
		return 'Error: JSON decode error:\n' + str(e), 400

	if not ('name' in data and 'agreetoguidelines' in data):
		return "Error: Key missing. See docs/API.md for reference.", 400

	if not data['agreetoguidelines']:
		return "Error: Didn't agree to guidelines.", 406



	name = slugify(data['name'])

	now = datetime.utcnow()
	db.insert({
		'name': name,
		'arrival': now.isoformat(),
		'departure': None
	})

	return 'OK', 200
