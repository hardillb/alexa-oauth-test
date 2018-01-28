#!/bin/sh

curl -u admin:password --insecure -X PUT -H 'Content-Type: application/json' -d '{"title":"test", "oauth_secret":"password", "domains":["localhost:3001"] }'  https://127.0.0.1:3000/services

curl -u admin:password --insecure -X PUT -H 'Content-Type: application/json' -d '{"title":"alexa-skill", "oauth_secret":"password", "domains":["pitangui.amazon.com", "alexa.amazon.co.jp", "layla.amazon.com", "layla.amazon.co.uk"] }'  https://127.0.0.1:3000/services