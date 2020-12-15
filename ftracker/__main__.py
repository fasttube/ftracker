import os
from .core import app

# Start the flask server if run from terminal
if __name__ == "__main__":

	@app.route('/')
	def get_root():
		return app.send_static_file('index.html')

	@app.route('/<path:path>')
	def get_path(path):
		fpath = f"{app.static_folder}/{path}"

		# Prettier URLs by auto-loading <path>.html
		# Our nginx config does this as well
		if not os.path.isfile(fpath):
			return app.send_static_file(path + '.html')

		return app.send_static_file(path)

	# Just allow everything to avoid the hassle when running locally.
	@app.after_request
	def add_headers(response):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = '*'
		response.headers['Access-Control-Allow-Headers'] = '*'
		return response

	app.run(host='0.0.0.0')
