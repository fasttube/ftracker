from threading import Thread, Event
from datetime import datetime, timedelta

from tinydb import Query

ONE_DAY_IN_S = 24 * 60 * 60

class Deleter(Thread):

	def delete_old_entries(self):

		print('Clearing database of old entries...')

		td = timedelta(days=self.days)

		threshold = datetime.utcnow() - td

		iso = threshold.isoformat() + 'Z'

		Entry = Query()
		self.db.remove((Entry.arrival < iso))

		print('Deleted everything until UTC', iso)

	def __init__(self, db, days):

		self.db = db
		self.days = days

		self.delete_old_entries()

		Thread.__init__(self, daemon=True)
		self.stopped = Event()
		self.start()

	def run(self):

		while not self.stopped.wait(ONE_DAY_IN_S):
			self.delete_old_entries()

	def stop(self):
		self.stopped.set()
