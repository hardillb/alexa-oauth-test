var fs = require('fs');
var http = require('http');
var https = require('https');
var flash = require('connect-flash');
var morgan = require('morgan');
var express = require('express');
var session = require('express-session');
var refresh = require('passport-oauth2-refresh');
var passport = require('passport');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var LocalStrategy = require('passport-local').Strategy;
var OAuth2Strategy = require('passport-oauth2');

// for local testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var cookieSecret = "plokij7888";
var auth = {
	"admin": {
		"username": "admin",
		"password": "password"
	}
};

//var config = require('./config.json');
var config = require('./config-local.json');


if (process.argv.length > 2) {
	config = require('./' + process.argv[2]);
} 

console.log("%j", config);


var users = {};
var tokens = {}

var app = express();

app.set('view engine', 'ejs');
app.enable('trust proxy');
app.use(morgan("combined"));
app.use(flash());
app.use(cookieParser(cookieSecret));
app.use(session({
  secret: cookieSecret,
  resave: false,
  saveUninitialized: true,
  name: 'foo',
  cookie: {
  	secure: true,
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

var alexStratergy = new OAuth2Strategy({
	authorizationURL: config.authorizationURL,
	tokenURL: config.tokenURL,
	clientID: config.clientID,
	clientSecret: config.clientSecret,
	scope: config.scope,
	callbackURL: config.callbackURL,
	passReqToCallback: true,
}, function(req, accessToken, refreshToken, params, profile, callback){
  console.log(params);
	profile.accessToken = accessToken;
	profile.refreshToken = refreshToken;
	profile.expires = params.expires_in;
	profile.id = 0;
	callback(null,profile);
});

passport.use('alexa-node-red', alexStratergy);
refresh.use('alexa-node-red',alexStratergy);

passport.use(new LocalStrategy(
	function(username, password, done){
		if(auth[username]) {
			var user = auth[username];
			if (user.password == password){
				done(null, user);
			} else {
				done(null,false);
			}
		} else {
			done(null, false);
		}
	})
);

passport.serializeUser(function(user, done){
	users[user.username] = user;
	done(null, user.username);
});
passport.deserializeUser(function(id, done){
	done(null,users[id]);
});

app.use('/',express.static('public'));

app.post('/login', 
	passport.authenticate('local',{ failureRedirect: '/login.html' }),
	function(req,res,next){
		res.redirect('/ready');
	}
);

app.get('/ready',
	function(req,res){
		res.set('x-timestamp', Date.now());
		var options = {
			root: __dirname + '/public/',
			dotfiles: 'deny',
			headers: {
	        	'x-timestamp': Date.now(),
	        	'x-sent': true
	    	}
		};
		res.sendFile('start.html',options,function(err){
			if (err) {
				console.log(err);
			}
		});
	}
);

app.get('/start',
	passport.authorize('alexa-node-red')
);

app.get('/callback',
	passport.authorize('alexa-node-red'),
	function(req, res){
		console.log("callback part 2");
		console.log(req.body);
		var user = req.user;
		var account = req.account;
		user.oauth = account;
		res.redirect('/test');
});

app.post('/refresh',
	function(req,res){
		if(req.user && req.isAuthenticated()) {
			var user = req.user;
			var oauth = user.oauth;
			console.log("/refresh user: %j",user);
			refresh.requestNewAccessToken('alexa-node-red',oauth.refreshToken, 
				function(err, accessToken, refreshToken){
					if (!err) {
						console.log("new accessToken: %s", accessToken);
						console.log("new refreshToken: %s", refreshToken);
						user.oauth.accessToken = accessToken;
						if (refreshToken) {
							user.oauth.refreshToken = refreshToken;
						}
						res.status(200).send({token: accessToken});
					} else {
						console.log(err);
						res.status(500).end();
					}
				});
		} else {
			res.status(401).end();
		}
	}
);

app.get('/test', 
	// passport.authenticate('local'),
	function(req,res){
	console.log("/test %j", req.session);
	console.log("/test %j", req.user);
	console.log("/test %s", req.isAuthenticated());
	res.render('gotToken',{token: req.user.oauth.accessToken, testURL: config.testURL});
});

var port = 3001;
var host = '127.0.0.1';
var options = {
	key: fs.readFileSync('../server.key'),
	cert: fs.readFileSync('../server.crt')
};
var server = https.createServer(options, app);
server.listen(port, host, function(){
	console.log('App listening on  %s:%d!', host, port);
});

console.log("done");