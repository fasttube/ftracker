import sys
from pathlib import Path
from configparser import ConfigParser

class Config:

	def __init__(self):

		def findConfigFile():
			if len(sys.argv) > 1:
				return sys.argv[1]
			elif Path('/etc/ftracker/config.ini').is_file():
				return '/etc/ftracker/config.ini'
			elif Path('config.ini').is_file():
				return 'config.ini'
			else:
				return None

		configfile = findConfigFile()

		if configfile:
			self.config = ConfigParser()
			self.config.read(configfile)
		else:
			raise Exception("No config file found")

		if not 'global' in self.config:
			raise Exception("No 'global' section found in config file")


	def __getitem__(self, key):
		return self.config['global'].get(key)

	def __repr__(self):
		return repr(self.config.items('global'))
