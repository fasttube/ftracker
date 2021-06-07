import setuptools as st

with open("README.md", "r") as f:
	long_description = f.read()

with open("LICENSE.md", "r") as f:
    license_text = f.read()

st.setup(
	name="ftracker",
	version="1.0.0",
	author="Oskar @ FaSTTUBe",
	author_email="o.winkels@fasttube.de",
	description="Small webapp to track who was in which room at which time to backtrace potential viral infections",
	long_description=long_description,
	long_description_content_type="text/markdown",
	url="https://git.fasttube.de/FaSTTUBe/ftracker",
	packages=st.find_packages(exclude=['tests', 'docs']),
	install_requires=[
		"flask",
		"tinydb",
		"python-slugify",
		"pywebpush",
	],
	license=license_text,
	classifiers=[
		"Programming Language :: Python :: 3",
		"License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)",
		"Operating System :: OS Independent",
	],
	python_requires='>=3.6',
)
