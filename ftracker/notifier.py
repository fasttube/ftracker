import json
import copy
from slugify import slugify
from threading import Thread, Event
from datetime import datetime, timedelta

from tinydb import Query

from pywebpush import webpush, WebPushException

ONE_HOUR_IN_S = 60 * 60

class Notifier(Thread):

	def subscribe_user(self, data):

		pushsubs = self.db.table('pushsubs')

		name = slugify(data['name'])
		data['name'] = name

		Entry = Query()
		pushsubs.upsert(data, Entry.name == name)

	def notify_user(self, arrival):

		pushsubs = self.db.table('pushsubs')

		Entry = Query()
		ps = pushsubs.search(Entry.name == arrival['name'])
		if len(ps) == 0:
			print("User is not subscribed to notifications :(")
			return "User is not subscribed to notifications :("

		ps = ps[0]

		print("Sending notification", arrival, ps, self.vapid_creds)

		subscription = ps['sub']
		notification = {
			'title': "Forgot to sign out?",
			'body': "You didn't sign out of ftracker yet",
			'arr': arrival
		}
		privkey = self.vapid_creds['private_key']
		claims = copy.copy(self.vapid_creds['claims'])

		try:
			webpush(
				subscription,
				json.dumps(notification),
				vapid_private_key = privkey,
				vapid_claims = claims
			)
			print("Notification sent")
			return None
		except WebPushException as exc:
			print("Notification failed", exc)
			return repr(exc)


	def notify_logged_in_users(self):

		print("Notifying users that aren't signed out yet...")

		td = timedelta(hours=self.hours)

		threshold = datetime.utcnow() - td

		iso = threshold.isoformat() + 'Z'

		Entry = Query()
		arrivals = self.db.search(
			(Entry.arrival < iso) & (Entry.departure == None)
		)

		for arrival in arrivals:
			self.notify_user(arrival)

		print("Notified everything until UTC", iso)

	def __init__(self, db, hours, vapid_creds):

		self.db = db
		self.hours = hours
		self.vapid_creds = vapid_creds

		self.notify_logged_in_users()

		Thread.__init__(self, daemon=True)
		self.stopped = Event()
		self.start()

	def run(self):

		while not self.stopped.wait(ONE_HOUR_IN_S):
			self.notify_logged_in_users()

	def stop(self):
		self.stopped.set()
