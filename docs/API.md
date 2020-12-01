API Endpoint Documentation
==========================

Arrival
```javascript
[Request]
POST /arrival

{
	"room": "roomname",
	"name": "Firstname Lastname",
	"agreetoguidelines": true
}

[Response]
200 OK

409 CONFLICT
{
	"request": "departure",
	"arrival": {
		"time": "UTC-ISO-TIMESTAMP",
		"room": "roomname"
	},
	"message": "Error: Undeparted arrival exists"
}
```


Departure
```javascript
[Request]
POST /departure

{
	"name": "Firstname Lastname",
	"cleanedworkspace": true
}

[Response]
200 OK

409 CONFLICT
{
	"request": "arrival",
	"message": "Error: No arrival exists"
}
```


Retrieve data
```javascript
[Request]
GET /data
Authorization: Basic < base64 USER:PASSWORD >

[Response]
200 OK

[
	{
		"room": "roomname",
		"name": "firstname-middlename-lastname",
		"arrival": "UTC-ISO-TIMESTAMP",
		"departure": "UTC-ISO-TIMESTAMP" || null
	},
	...
]
```
