import atexit
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


from flask import Flask, request, redirect
app = Flask(__name__, static_folder='../web')


if config['delete_after_days']:
	from .deleter import Deleter
	deleter = Deleter(db, int(config['delete_after_days']))

def shutdown():
	print('\rReceived stop signal, stopping threads...')
	deleter.stop()
	db.close()

atexit.register(shutdown)

@app.route('/guidelines')
def get_guidelines():
	dest = config['guideline_url'] or None
	if dest:
		return redirect(dest)
	return "No guideline document was configured.", 404


@app.route('/arrival', methods=['POST'])
def post_arrival():

	try:
		payload = request.data.decode('UTF-8')
		data = json.loads(payload)
	except ValueError as e:
		return 'Error: JSON decode error:\n' + str(e), 400

	if not ('room' in data and 'name' in data and 'agreetoguidelines' in data):
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
		return json.dumps({
			'request': 'departure',
			'arrival': {
				'time': openarrival['arrival'],
				'room': openarrival['room']
			},
			'message': "Error: Undeparted arrival exists"
		}, indent=SPACES), 409

	now = datetime.utcnow().isoformat() + 'Z'
	db.insert({
		'name': name,
		'room': data['room'],
		'arrival': data.get('arrival') or now,
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
	openarrival = db.get((Entry.name == name) & (Entry.departure == None))
	if not openarrival:
		# Did not arrive before
		return json.dumps({
			'request': 'arrival',
			'message': "Error: No arrival exists"
		}, indent=SPACES), 409

	now = datetime.utcnow().isoformat() + 'Z'
	db.update(
		operations.set('departure', data.get('departure') or now),
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

	start = request.args.get('start', default = None, type = str)
	end   = request.args.get('end'  , default = None, type = str)
	room  = request.args.get('room' , default = None, type = str)

	# Skip DB query if no parameters given
	# (Which is currently every request)
	if not (start or end or room):
		return json.dumps(db.all(), indent=SPACES), 200

	def is_after(val, iso):
		return (val >= iso if val else True ) if iso else True

	def is_before(val, iso):
		return (val <= iso if val else False) if iso else True

	Entry = Query()
	r = db.search(
		(Entry.departure.test(is_after, start)) &
		(Entry.arrival.test(is_before, end)) &
		(Entry.room.search(room or ".*"))
	)

	return json.dumps(r, indent=SPACES), 200
