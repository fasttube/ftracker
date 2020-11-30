import sys, os
from configparser import ConfigParser

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
	config = ConfigParser()
	config.read(configfile)
else:
	config = None
