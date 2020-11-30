import json
from datetime import datetime

from .config import config
if not config:
	print('No configuration file found.')
	exit()


from tinydb import TinyDB
db = TinyDB(config.get('global','db_file', fallback='/tmp/ftracker-db.json'), indent=4)
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

	# TODO: JSON schema validation
	# TODO: JSON content validation

	now = datetime.utcnow()
	db.insert({
		'name': data['name'],
		'arrival': now.isoformat(),
		'departure': None
	})

	return 'OK', 200
