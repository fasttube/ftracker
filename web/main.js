var spage = document.getElementById('startpage')
var mform = document.getElementById('mainform')

if (qp) {
	spage.style.display = 'none'
	mform.style.display = 'block'
}

// Prefill the name field if it was successfully entered before
var savedName = localStorage.getItem('name')
if (savedName && qp)
	document.getElementById('name').value = savedName

// 2nd script, server API communication
var name, agreed, tested
mform.onsubmit = function(e) {

	e.preventDefault()

	name = e.srcElement[0].value
	agreed = e.srcElement[1].checked
	if (e.srcElement.length > 2)
		tested = e.srcElement[2].checked

	sendMainData()

}

function sendMainData() {

	// POST JSON. See docs/API.md
	var payload = (qp.action == 'arrival') ?
		{
			'room': qp.room,
			'name': name,
			'agreetoguidelines': agreed,
			'tested': tested
		} :
		{
			'name': name,
			'cleanedworkspace': agreed
		}

	post("/" + qp.action, payload)

}

function post(url, payload) {

	console.log("Sending payload:", payload)

	return fetch(url, {
		method: "POST",
		body: JSON.stringify(payload)
	}).then(res => {
		handleResponse(res)
	})

}

function handleResponse(res) {

	console.log("Request complete! response:", res)

	if (Math.floor(res.status / 100) == 2) {

		// Success
		mform = document.getElementById('mainform')
		mform.innerHTML = "<h2>Done. Thanks!</h2>"
		localStorage.setItem('name', name)

	} else if (res.status == 409) {

		// Conflict, more data requested
		handleRequest(res)

	} else {

		// Any other generic error
		res.text().then(function (text) {
			alert(text)
		})

	}

}

function handleRequestSubmit(e, json) {

	e.preventDefault()

	var input = e.srcElement[0].value
	var iso = new Date(input).toISOString()

	// POST JSON. See docs/API.md
	var payload = (json.request == 'arrival') ?
		{
			'room': qp.room,
			'name': name,
			'arrival': iso,
			'agreetoguidelines': agreed
		} :
		{
			'name': name,
			'departure': iso,
			'cleanedworkspace': agreed
		}

	return post("/" + json.request, payload)

}

function localISOTimeMinutes(date) {

	var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
	var localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, -1);

	return localISOTime.split(':').slice(0,2).join(':')

}

function handleRequest(res) {

	var reqt = {
		'arrival': 'You probably forgot to sign in when you arrived. Please enter your arrival time now:',
		'departure': 'You probably forgot to sign out when you left. Please enter your departure time now:'
	}

	mform.innerHTML = "<h2>Processing Request...</h2>"

	res.json().then(function (json) {

		var aInfo = ''
		var minD = ''
		var doubleT = ''
		if (json.request == 'departure') {
			var d = new Date(json.arrival.time)
			var dInfo = d.toString('en-GB').split(' ').slice(0,5).join(' ')
			aInfo = `Your last arrival was on <b>${dInfo}</b> in room <b>${json.arrival.room}</b>.`
			minD = `min="${localISOTimeMinutes(d)}"`
			if (new Date() - d < 3 * 60 * 1000) {
				doubleT = '<b style="color:red">Your last sign in was less than 3 minutes ago. You might be accidentally trying to sign in twice. If you don\'t intend to log 2 arrivals within the last 3 minutes, please abort below.</b>'
			}
		}

		var now = localISOTimeMinutes(new Date())

		document.body.innerHTML +=
			`<div class="request">
				<h1>${json.request} missing!</h1>
				<form id="reqform">
					<label>
						${reqt[json.request]}
						<input type="datetime-local" id="datetime" ${minD} max="${now}" required>
						${aInfo}
					</label>
					${doubleT}
					<input type="submit">
					<input type="button" value="Abort" onclick="document.body.innerHTML='<h1>Aborted</h1><form>Nothing was logged.<br>You can close this tab/window now.</form>'">
				</form>
			</div>`

		rform = document.getElementById('reqform')
		rform.onsubmit = async function(e) {
			await handleRequestSubmit(e, json)
			document.querySelector('.request').remove()
			setTimeout(sendMainData, 200)
		}

	})

}
