var spage = document.getElementById('startpage')
var mform = document.getElementById('mainform')

if (qp.action) {
	spage.style.display = 'none'
	mform.style.display = 'block'
}

// Prefill the name field if it was successfully entered before
var savedName = localStorage.getItem('name')
if (savedName && qp)
	document.getElementById('name').value = savedName

// 2nd script, server API communication
var name, datetime, agreed, tested
mform.onsubmit = function(e) {

	e.preventDefault()

	var i = 0;
	name = e.srcElement[i++].value
	if (qp.edittime && qp.edittime == 1) {
		var value = e.srcElement[i++].value
		datetime = new Date(value).toISOString()
	}
	agreed = e.srcElement[i++].checked
	if (qp.action && qp.action == 'arrival')
		tested = e.srcElement[i++].checked


	sendMainData()

	initPush(name)

}

function sendMainData() {

	// POST JSON. See docs/API.md
	var payload = (qp.action == 'arrival') ?
		{
			'room': qp.room,
			'name': name,
			'arrival': datetime,
			'agreetoguidelines': agreed,
			'tested': tested // = 3G
		} :
		{
			'name': name,
			'departure': datetime,
			'cleanedworkspace': agreed
		}

	post("/" + qp.action, payload)

}

function post(url, payload) {

	console.log("Sending payload:", payload)

	return fetch(url, {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
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

	if (e.srcElement.length > 1)
		tested = e.srcElement[1].checked // = 3G

	// POST JSON. See docs/API.md
	var payload = (json.request == 'arrival') ?
		{
			'room': qp.room,
			'name': name,
			'arrival': iso,
			'agreetoguidelines': agreed,
			'tested': tested // = 3G
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
		var testCheck = ''
		if (json.request == 'departure') {
			var d = new Date(json.arrival.time)
			var dInfo = d.toString('en-GB').split(' ').slice(0,5).join(' ')
			aInfo = `Your last arrival was on <b>${dInfo}</b> in room <b>${json.arrival.room}</b>.`
			minD = `min="${localISOTimeMinutes(d)}"`
			if (new Date() - d < 3 * 60 * 1000) {
				doubleT = '<b style="color:red">Your last sign in was less than 3 minutes ago. You might be accidentally trying to sign in twice. If you don\'t intend to log 2 arrivals within the last 3 minutes, please abort below.</b>'
			}
		} else if (json.request == 'arrival') {
			testCheck = testCheckBox.replace('have', 'had then');
		}

		var now = localISOTimeMinutes(new Date())

		document.body.innerHTML +=
			`<div class="request">
				<h1>${json.request} missing!</h1>
				<form id="reqform">
					<label>
						${reqt[json.request]}
						<input type="datetime-local" ${minD} max="${now}" required>
						${aInfo}
					</label>
					${doubleT}
					${testCheck}
					<input type="submit">
					<input type="button" value="Abort" onclick="document.body.innerHTML='<h1>Aborted</h1><form>Nothing was logged.<br>You can close this tab/window now.</form>'">
				</form>
			</div>`

		var rform = document.getElementById('reqform')
		rform.onsubmit = async function(e) {
			await handleRequestSubmit(e, json)
			document.querySelector('.request').remove()
			setTimeout(sendMainData, 200)
		}

	})

}


if (qp.edittime && qp.edittime == 1) {
	var now = localISOTimeMinutes(new Date())
	document.getElementById('datetime').value = now;
	document.getElementById('datetime').max = now;
}


/* Push Notifications */

function sendNotification() {

	navigator.serviceWorker.ready.then(function(serviceWorker) {
		serviceWorker.showNotification("Forgot to sign out?", {
			body: "You didn't sign out of ftracker yet",
			icon: "/favicon.ico",
			actions: [{
				action: "depart",
				title: "Sign Out"
			}]
		})
	})

}

function initPush(name) {

	// Check availability
	var supported = "serviceWorker" in navigator && "PushManager" in window
	if (!supported) {
		console.warn("Push Notifications not supported!")
		return
	}

	fetch('/pushinfo').then(function(res) {
		if (res.ok)
			res.json().then(function(push) {
				if (push.enabled)
					registerPush(name, push.publickey);
			});
	});

}

function registerPush(name, pushServerPublicKey) {

	// Register service worker
	navigator.serviceWorker.register("/sw.js").then(function(swRegistration) {
		console.log("ServiceWorker registered:", swRegistration)
	})

	// Request permission
	// TODO: Only do this AFTER the first? SUCCESSFUL sign-in
	Notification.requestPermission(function(result) {
		return (result === 'granted')
	}).then(function(consent) {
		console.log('Notifications', consent ? 'enabled' : 'denied');
	})

	// Check if already initialized
	if (localStorage.getItem('pushsub'))
		return

	// Register push service
	navigator.serviceWorker.ready.then(function(serviceWorker) {
		serviceWorker.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: pushServerPublicKey
		}).then(function(subscription) {
			console.log("User is subscribed:", subscription);

			fetch('/pushsubscribe', {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					name: name,
					sub: subscription
				})
			}).then(function(res) {
				if (res.ok)
					localStorage.setItem('pushsub', subscription);
			});
		});
	});

}
