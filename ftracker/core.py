import json
from datetime import datetime
from slugify import slugify

from .config import Config
config = Config()
SPACES = int(config['json_indent']) if config['json_indent'] else None


from tinydb import TinyDB, Query, operations
dbfile = config['db_file'] or '/tmp/ftracker-db.json'
db = TinyDB(dbfile, indent=SPACES)


from .namelist import NameList
namefile = config['name_file'] or None
namelist = NameList(namefile)


from flask import Flask, request
app = Flask(__name__)


@app.route('/')
def get_root():
	return "Error: No Endpoint selected. See docs/API.md for reference.", 404


@app.route('/arrival', methods=['POST'])
def post_arrival():

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

	if not name in namelist:
		return "Error: Name not in permitted list.", 401

	Entry = Query()
	openarrival = db.get((Entry.name == name) & (Entry.departure == None))
	if openarrival:
		# Did not depart last time
		# TODO: Return structured request to resend departure
		return json.dumps({
			'request': 'departure',
			'arrival': openarrival['arrival'],
			'message': "Error: Undeparted arrival exists"
		}, indent=SPACES), 409

	now = datetime.utcnow()
	db.insert({
		'name': name,
		'arrival': now.isoformat(),
		'departure': None
	})

	return 'OK', 200


@app.route('/departure', methods=['POST'])
def post_departure():

	try:
		payload = request.data.decode('UTF-8')
		data = json.loads(payload)
	except ValueError as e:
		return 'Error: JSON decode error:\n' + str(e), 400

	if not ('name' in data and 'cleanedworkspace' in data):
		return "Error: Key missing. See docs/API.md for reference.", 400

	if not data['cleanedworkspace']:
		return "Error: Didn't clean workspace.", 406

	name = slugify(data['name'])

	if not name in namelist:
		return "Error: Name not in permitted list.", 401

	Entry = Query()
	if not db.contains((Entry.name == name) & (Entry.departure == None)):
		# Did not arrive before
		# TODO: Return structured request to resend arrival
		return json.dumps({
			'request': 'arrival',
			'message': "Error: No arrival exists"
		}, indent=SPACES), 409

	now = datetime.utcnow()
	db.update(
		operations.set('departure', now.isoformat()),
		(Entry.name == name) & (Entry.departure == None)
	)

	return 'OK', 200


@app.route('/data')
def get_data():

	if not 'Authorization' in request.headers:
		return 'Error: No Authorization', 401, {'WWW-Authenticate': 'Basic'}

	if request.authorization.username != config['admin_user']:
		return "Wrong username", 403

	if request.authorization.password != config['admin_pass']:
		return "Wrong password", 403

	return json.dumps(db.all(), indent=SPACES), 200
