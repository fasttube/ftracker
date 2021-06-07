function receivePushNotification(event) {

	var data = event.data.json();

	console.log("[Service Worker] Push Received:", data)

	var room = data.arr ? data.arr.room : 'test'

	var options = {
		data: `/?departure=${room}&edittime=1`,
		body: data.body,
		icon: "/favicon.ico",
		actions: [{
			action: "depart",
			title: "Sign Out"
		}]
	};

	event.waitUntil(self.registration.showNotification(data.title, options))

}

self.addEventListener("push", receivePushNotification)


function openPushNotification(event) {

	console.log("[Service Worker] Notification click Received.", event.notification.data)

	event.notification.close()
	event.waitUntil(clients.openWindow(event.notification.data))

}

self.addEventListener("notificationclick", openPushNotification)
