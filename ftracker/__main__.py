from .core import *

# Start the flask server if run from terminal
if __name__ == "__main__":

	# Just allow everything to avoid the hassle when running locally.
	@app.after_request
	def add_headers(response):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = '*'
		response.headers['Access-Control-Allow-Headers'] = '*'
		return response

	app.run()
