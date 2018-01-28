# test-oAuth

This directory holds a small app to test the oAuth serice.

## Running

`node test-oAuth.js`

By default it will pick up configuration information from config.json or you can pass a similar
file as a command line arguement

`node test-oAuth.js config-local.json`

The config file looks like this.

```
{
	"testURL": "https://oauth-test.hardill.me.uk/testing",
	"authorizationURL": "https://oauth-test.hardill.me.uk/auth/start",
	"tokenURL": "https://oauth-test.hardill.me.uk/auth/exchange",
	"clientID": "1",
	"clientSecret": "password",
  "scope": "access_devices",
  "callbackURL": "https://localhost:3001/callback"
}
```

 - testURL -> a URL to call with the BEARER-TOKEN to test if the token is still valid
 - authorizationURL -> URL to start oAuth flow
 - tokenURL -> URL to request initial token and to renew tokens
 - clientID -> oAuth client identifier (number returned when `create-oauth-application.sh is called`)
 - scope -> scope to be requested when authorising with oAuth
 - callbackURL -> URL that oAuth grant token will be passed back to


This starts a web app on https://localhost:3001

Login in with admin/password to get started