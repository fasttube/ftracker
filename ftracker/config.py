import sys, os
from configparser import ConfigParser

class Config:

	def __init__(self):

		def findConfigFile():
			if len(sys.argv) > 1:
				return sys.argv[1]
			elif os.path.isfile('config.ini'):
				return 'config.ini'
			elif os.path.isfile('/etc/ftracker/config.ini'):
				return '/etc/ftracker/config.ini'
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
