# Testing Alexa Home Skill oAuth

A sample app to test how the Alexa Home Skill system interacts with a oAuth provider.

This should make a good base for building a custome Alexa Home Skill in NodeJS.

## Setup

There are 3 parts to the setup:

 - Web App -> to handle the oAuth
 - Alexa Skill -> self explanitory
 - Lambda -> to respond to the Alexa requests.

### Web App

Spin up an Ubuntu based t2.nano EC2 instance, ensure that ports 22, 80 and 433 are open.

Setup a DNS name to point to the public IP address of the VM

Then log in an run the following commands:

 - `sudo apt-get update`
 - `sudo apt-get upgrade -y`
 - `sudo apt-get install -y mongodb nginx`
 - `curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`
 - `sudo apt-get install -y nodejs`
 - `wget https://dl.eff.org/certbot-auto`
 - `chmod a+x certbot-auto`
 - `sudo ./certbot-auto --authenticator webroot --installer nginx`

Fill in the details asked for, specifically using the DNS name set up earlier. 

Edit the `/etc/nginx/sites-available/default` file, find the server section that matches the hostname
that you confured with certbot-auth and find the location section that looks like this:

```
location / {
    # First attempt to serve request as file, then
    # as directory, then fall back to displaying a 404.
    try_files $uri $uri/ =404;
}

```

and edit it to look like:

```
location / {
    proxy_pass https://127.0.0.1:3000/;
}

```


 - `git clone https://github.com/hardillb/alexa-oauth-test.git`
 - `cd alexa-oauth-test`
 - `screen -Dms web-app node index.js`


This last command has started the web app in a screen session called "web-app" (you can bring it to the forground with `scrceen -r web-app`). You should now be able to access it on the host name you set up earlier. User the register link to create a new user called "admin"
then edit `create-oauth-application.sh` to update the password.


 - `./create-oauth-application.sh`

 This last command creates 2 oAuth applications, the first is the test app (with clientID 1) that is found in the test directory. The second is a Alexa Home Skill (clientID 2).

### Alexa Skill

Create a new Alexa Home Skill

When setting up the "Configuration" section fill in the following values:
 
 - Authorization URL -> https://[domain name]/auth/start
 - ClientId -> 2
 - Scope "access_devices"
 - Access Token URI -> https://[domain name]/auth/exchange
 - Client Secret -> "password"
 - Client Authentication Scheme -> "Credentials in request body" 

### Lambda

Choose "Author from scratch" and pick the Node.js 6.10 runtime and a suitable role. Add the Alexa Smart Home Lambda trigger and fill in the Skill id and copy the Lambda back into the skill.

 - Run `npm install` in the lambda directory
 - Run `npm run package` to create the lambda.zip
 - Upload this file as the source for the lambda

## Testing

Once all the setup is complete then you should see the skill available under "DEV SKILLS" in the  "Your skills" area of the Alexa mobile app. If you've got everything working you should be able to enable the app and it will redirect you to the web app to sign in. Use the admin user with the password you created earlier. After discover completes you should have a new device called "Test Device". Any interaction with this device should raise a "EXPIRED_AUTHORIZATION_CREDENTIAL" error.

This should trigger the Alexa system to request a new token, but if you watch thet output from the web app you will see this never happens. 

The web app hands out tokens with a 10 minute life, but we don't actually need this to test as the Alexa should try to refesh as soon as it gets the error. I know the error generation should be working because if I change the error to "ENDPOINT_LOW_POWER" I get a warning about a low battery.
