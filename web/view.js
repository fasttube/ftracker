var data = null;

var names = document.querySelector('main #names')
var times = document.querySelector('main #times')

function exportCSV() {

	if (data == null) {
		alert('No data found.')
		return
	}

	var startInput = document.querySelector('input#start')
	var endInput   = document.querySelector('input#end')
	var roomInput  = document.querySelector('input#room')

	var startDate = new Date(startInput.value)
	var endDate   = new Date(endInput.value)
	var roomRE    = new RegExp(roomInput.value || '.*')

	csv = '"ftracker-export",'
	days = []

	var tc = new Date(startDate.getTime())
	tc.setHours(1,0,0,0)
	while (tc < endDate) {
		var isodate = tc.toISOString().split('T')[0]
		csv += ('"' + isodate + '",')
		days.push(isodate)
		tc.setDate(tc.getDate() + 1);
	}

	csv = csv.replace(/,$/, '')

	csv += '\n'

	for (var [name, list] of Object.entries(data)) {

		csv += '"' + name + '"'

		for (day of days) {

			csv += ',"'

			daytexts = []

			for (entry of list) {

				if (entry.room.match(roomRE) == null)
					continue

				var arrD = new Date(entry.arrival)
				var depD = entry.departure ? new Date(entry.departure) : new Date()

				if (depD < startDate || arrD > endDate)
					continue

				var [arrDay, arrT] = localISOTimeMinutes(arrD).split('T')
				var [depDay, depT] = localISOTimeMinutes(depD).split('T')

				if ((arrDay == day) && (depDay == day)) {
					daytexts.push(arrT + '-' + depT + ' (' + entry.room + ')')
				} else if (arrDay == day) {
					daytexts.push(arrT + '-... (' + entry.room + ')')
				} else if (depDay == day) {
					daytexts.push('...-' + depT + ' (' + entry.room + ')')
				}

			}

			csv += daytexts.join('\n')

			csv += '"'

		}

		csv += '\n'

	}

	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
	element.setAttribute('download', 'ftracker-export.csv');
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);

}

function renderData() {

	if (data == null) {
		alert('No data found.')
		return
	}

	names = document.querySelector('main #names')
	times = document.querySelector('main #times')

	names.innerHTML = ''
	times.innerHTML = ''

	var startInput = document.querySelector('input#start')
	var endInput   = document.querySelector('input#end')
	var roomInput  = document.querySelector('input#room')

	var startDate = new Date(startInput.value)
	var endDate   = new Date(endInput.value)
	var roomRE    = new RegExp(roomInput.value || '.*')

	// Clear everything below hours because that would lead to
	// misalignments with the day grid
	startDate.setMinutes(0,0,0)

	var tc = new Date(startDate.getTime())
	var content = ''
	while (tc < endDate) {
		var h = tc.getHours()
		var t = (h == 0) ?
			'<b>'+tc.getDate()+'.'+(tc.getMonth()+1)+'.</b>' :
			h+':00'
		var left = ((tc - startDate) / (1000 * 60))
		content += '<span style="left:'+left+'px;">'+t+'</span>'
		tc.setTime(tc.getTime() + (60*60*1000));
	}
	var timeheader = document.getElementById('timelabels')
	timeheader.innerHTML = content

	var viewwidth = ((endDate - startDate) / (1000 * 60))
	timeheader.style.width = viewwidth + 'px'
	times.style.width = viewwidth + 'px'

	var rowCount = 0

	for (var [name, list] of Object.entries(data)) {

		var row = document.createElement('div')
		row.classList.add('row')

		var rowHasBlock = false

		for (entry of list) {

			if (entry.room.match(roomRE) == null)
				continue

			var arrD = new Date(entry.arrival)
			var depD = entry.departure ? new Date(entry.departure) : new Date()

			if (depD < startDate || arrD > endDate)
				continue

			rowHasBlock = true

			// Minutes since start date / beginning
			var arr = (arrD - startDate) / (1000 * 60)
			var dep = (depD - startDate) / (1000 * 60)
			var dur = dep - arr

			var block = document.createElement('span')
			block.innerHTML = entry.room
			block.style.left  = arr + 'px' // 1px/min
			block.style.width = Math.max(0,(dur-14)) + 'px' // 1px/min
			if (entry.tested)
				block.classList.add('tested') // = 3G

			if (dur > 60 * 24)
				block.classList.add('implausible')

			row.appendChild(block)

		}

		if (rowHasBlock) {
			var vname = name.replace(/-/g, ' ')
			names.innerHTML += '<div class="row"><span>'+vname+'</span></div>'
			times.appendChild(row)
			rowCount += 12
		}

	}

	//var viewheight = rowCount * 32;
	//times.style.height = viewheight + 'px'

	var tw = document.querySelector('main .scroll')
	tw.scrollLeft = tw.scrollWidth

}

function saveData(rdata) {

	data = rdata.reduce((acc, entry) => {
		var name = entry.name
		delete entry.name
		acc[name] = [...acc[name] || [], entry];
		return acc;
	}, {});

	console.log(data)
	renderData()

}

function submitCredentials() {
	var cp = document.querySelector('#credprompt')
	var user = cp.querySelector('#user').value
	var pass = cp.querySelector('#pass').value
	cp.remove()
	var auth = btoa(user + ":" + pass)
	localStorage.setItem('dataauth', auth)
	loadData()
}

function loadData() {

	var auth = localStorage.getItem('dataauth')
	if (auth == null) {
		var prompt = document.createElement('div')
		prompt.id = 'credprompt'
		prompt.innerHTML = '<h1>Credentials Required</h1>\
			<input type="text" id="user" placeholder="username" onkeydown="if (event.keyCode == 13) {submitCredentials()}">\
			<input type="password" id="pass" placeholder="password" onkeydown="if (event.keyCode == 13) {submitCredentials()}">\
			<input type="submit" onclick="submitCredentials()">'
		document.body.appendChild(prompt)
		document.querySelector('#credprompt #user').focus()
		return // Abort load, wait for submit
	}

	var headers = new Headers()
	headers.append('Authorization', 'Basic ' + auth)

	var fetchopts = {
		method: 'GET',
		headers: headers
	}

	fetch('/data', fetchopts)
		.then(res => {
			if (Math.floor(res.status / 100) == 2)
				return res.json()
			else
				localStorage.removeItem('dataauth')
				res.text().then(function (text) {
					alert(text)
					location.reload()
				})
		})
		.then(rdata => saveData(rdata))

}

function localISOTimeMinutes(date) {

	var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
	var localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, -1);

	return localISOTime.split(':').slice(0,2).join(':')

}

var now = new Date()
var startDate = new Date()
startDate.setDate(now.getDate() - (4*7))
startDate.setHours(0,0,0,0)
document.querySelector('input#start').value = localISOTimeMinutes(startDate)
document.querySelector('input#end').value = localISOTimeMinutes(now)

var scrollbox = document.querySelector('.scroll')
var timehead = document.querySelector('#timeheader')
var namebox = document.querySelector('section.names')
scrollbox.onscroll = function() {
	timehead.scrollLeft = scrollbox.scrollLeft
	namebox.scrollTop = scrollbox.scrollTop
}

loadData()
