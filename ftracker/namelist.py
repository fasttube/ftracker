import csv
from slugify import slugify

class NameList:

	def __init__(self, namefile):

		print('(Re)loading name list')

		if not namefile:
			self.names = None
			return

		self.namefile = namefile
		self.names = {}

		with open(namefile) as f:

			reader = csv.reader(f)
			for line in reader:

				name = f"{line[0]} {line[1]}"
				slug = slugify(name)
				email = line[2] if len(line) > 2 else None

				self.names[slug] = {'email': email}

	def __contains__(self, val):
		# Don't check if there's no list
		if self.names == None:
			return True;

		contained = val in self.names

		# Reload name list if name is unknown and recheck
		if not contained:
			self.__init__(self.namefile)
			contained = val in self.names

		return contained
