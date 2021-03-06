var express = require('express');
var bodyParser = require('body-parser');
var mustache = require('mustache');
var Crypto = require('crypto')
var fs = require('fs');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();

// Initialize DB
var Storage = require('./lib/MongoDB');
var db = new Storage(null, null, 'saiddit');

// Include any scripts we need for the backend server
var sha = require('./lib/sha512.js');

// Add static files directory
app.use(express.static("public"));
app.use(cookieParser())

// Setup sessions and how the IDs are created
app.use(session({
  genid: function(req) {
    return Crypto.randomBytes(32).toString('base64'); // use UUIDs for session IDs 
  },
  secret: 'a10758sf31f1f9dsd90192e23smd546912fqsmsffn12',
  resave: false,
  saveUninitialized: true
}))


// Used to parse JSON objects from requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Define any used data structures



// Deliver our home page 
app.get('/', function (req, res) {
	// Check get params for messages to display
	var s = "", e = "";
	switch(req.query.s){
		case "1": s = '<div class="alert alert-success" role="alert">Welcome back! Succesfully logged in.</div>';
				break;
		default: break;
	}
	switch(req.query.e){
		case "1": e = '<div class="alert alert-danger" role="alert">Oops! We\'ve encountered an error with the system. Please try again later.</div>';
				break;
		default: break;
	}

	(req.session.username ? user = req.session.username :  user = '');
	var pageData;
	console.log("User logged in: "+user);
	if(user != ""){
		pageData = {loginstatus: '<div><p class="navbar-form navbar-right loginstatus">Logged in as: <span class="secondaryWord">'+user+'</span> | <a href="/actionLogout">Logout</a></p></div>', 
					error: e,
					post: '<li><a href="/post">Post Manager</a></li>',
					menu: '',
					success: s
				}; // replace all of the data
	} else {
		pageData = {loginstatus: '<form class="navbar-form navbar-right" action="/actionLogin" method="post"><div class="form-group"><input type="text" placeholder="Username" class="form-control" id="username" name="username"></div><div class="form-group"><input type="password" placeholder="Password" class="form-control" id="password" name="password"></div><input type="button" class="btn btn-primary" onclick="formhash(this.form, this.form.username, this.form.password);" value="Sign in" /></form>', 
					authreq: '(Authentication required)',
					menu: '<li><a href="/register">Register</a></li>',
					post: '',
					error: e,
					success: s
				}; // replace all of the data
	}
	var page = fs.readFileSync("views/index.html", "utf8"); // bring in the HTML file
	var html = mustache.to_html(page, pageData); // replace all of the data
	res.send(html);
})

// About page
app.get('/about', function (req, res) {
	(req.session.username ? user = req.session.username :  user = '');
	var pageData;
	if(user != ""){
		pageData = {loginstatus: '<div><p class="navbar-form navbar-right loginstatus">Logged in as: <span class="secondaryWord">'+user+'</span> | <a href="/actionLogout">Logout</a></p></div>', 
					post: '<li><a href="/post">Post Manager</a></li>',
					menu: ''};
	} else {
		pageData = {loginstatus: '<form class="navbar-form navbar-right" action="/actionLogin" method="post"><div class="form-group"><input type="text" placeholder="Username" class="form-control" id="username" name="username"></div><div class="form-group"><input type="password" placeholder="Password" class="form-control" id="password" name="password"></div><input type="button" class="btn btn-primary" onclick="formhash(this.form, this.form.username, this.form.password);" value="Sign in" /></form>',
					post: '',
					menu: '<li><a href="/register">Register</a></li>'};
	}
   	var page = fs.readFileSync("views/about.html", "utf8"); // bring in the HTML file
	var html = mustache.to_html(page, pageData); // replace all of the data
	res.send(html);
})

// Login page
app.get('/login', function (req, res) {
	// Check get params for messages to display
	var s = "", e = "";
	switch(req.query.s){
		case "1": s = '<div class="alert alert-success" role="alert">Thanks for registering! You may now sign in below.</div>';
				break;
		default: break;
	}
	switch(req.query.e){
		case "1": e = '<div class="alert alert-danger" role="alert">Oops! We\'ve encountered an error with the system. Please try again later.</div>';
				break;
		case "2": e = '<div class="alert alert-danger" role="alert">Incorrect credentials provided. Please try again.</div>';
				break;
		case "3": e = '<div class="alert alert-danger" role="alert">You must login before playing Online matches.</div>';
				break;
		default: break;
	}
	// Send login page with appropriate error messages
   	var page = fs.readFileSync("views/login.html", "utf8"); // bring in the HTML file
	var html = mustache.to_html(page, {error: e, success: s}); // replace all of the data
	res.send(html);
})


// Register page
app.get('/register', function (req, res) {
	// Check get params for messages to display
	var e = "";
	switch(req.query.e){
		case "1": e = '<div class="alert alert-danger" role="alert">Oops! We\'ve encountered an error with the system. Please try again later.</div>';
				break;
		case "2": e = '<div class="alert alert-danger" role="alert">Oops! That username is currently taken. Please choose a new one.</div>';
		break;
		default: break;
	}

	var page = fs.readFileSync("views/register.html", "utf8"); // bring in the HTML file
	var html = mustache.to_html(page, {error: e}); // replace all of the data
	res.send(html);
})


// Game page
app.get('/post', function (req, res) {
	console.log("gameId is: "+req.params.gameId);
	var page = fs.readFileSync("views/post.html", "utf8"); // bring in the HTML file
	(req.session.username ? user = req.session.username :  user = '');
	// Display login status
	if(user != ''){
		l = '<div><p class="navbar-form navbar-right loginstatus">Logged in as: <span class="secondaryWord">'+user+'</span> | <a href="/actionLogout">Logout</a></p></div>';
	} else {
		l = '<form class="navbar-form navbar-right" action="/actionLogin" method="post"><div class="form-group"><input type="text" placeholder="Username" class="form-control" id="username" name="username"></div><div class="form-group"><input type="password" placeholder="Password" class="form-control" id="password" name="password"></div><input type="button" class="btn btn-primary" onclick="formhash(this.form, this.form.username, this.form.password);" value="Sign in" /></form>';
	}
	var html = mustache.to_html(page, {gameId: req.params.gameId, loginstatus: l, user: user}); // replace all of the data
	res.send(html);
})


/*

### End of pages, begin actions/tasks ####

*/

// Login action
app.post('/actionLogin', function (req, res) {

	// Get post data
	var username = req.body.username;
	var password = req.body.p

	console.log('Login attempt for user: '+username);

	// Compare with user in DB to see if match
	db.getQuery('users', {username: username}, function(err, result){
		if(result.length > 0){
			// Ok so that user exists, but did we supply right password?
			// Lets encrypt supplied pass with that users salt and see if matches their pass
			var salt = result[0].salt;
			var temp_password = sha.hex_sha512(password + salt);

			// Make the comparison
			if(temp_password === result[0].password){
				// Success! Set session and redirect
				req.session.username = username;
				res.redirect("/?s=1");
			} else {
				// WRONG! Redirect
				res.redirect("/login?e=2");
			}
		} else {
			// No user with that Id exists
			res.redirect("/login?e=2");
		}
	});
})

// Logout action
app.get('/actionLogout', function (req, res) {
	req.session.username = '';
	res.redirect('/');
})

// Handle registration submission
app.post('/actionRegister', function (req, res) {
	// Get post params
	var username = req.body.username;
	var password = req.body.p

	// Check to see if username taken
	db.getQuery('users', {username: username}, function(err, result){
		if(result.length > 0){
			// Redirect to register page with error that user exists
			res.redirect('/register?e=2')
		} else {
			// If not, create a salted password and a salt
			var buf = Crypto.randomBytes(16).toString('base64'); 
			var salt = sha.hex_sha512(buf);
			password = sha.hex_sha512(password + salt);

			// Create user document
			var user = {username: username, password: password, salt: salt};

			// Store new user into db
			db.addDocuments(user, function(result){
				if(result.result.ok != 1){
					// Redirect to register page with error
					res.redirect('/register?e=1');
				} else {
					// Redirect to login page with success message
					res.redirect('/login?s=1');
				}
			}, 'users');
		}
	});
})


// Create handlers for starting up a new game
app.post('/newLocalGame', function (req, res) {
	// Get game properties 
	var userIP = req.connection.remoteAddress;
	var boardSize = req.body.boardSize;
	var player1 = req.body.player1;
	var player2 = req.body.player2;

	// Create the game and redirect to it
	createGame(userIP, player1, player2, boardSize, res);
})

app.post('/newAIGame', function (req, res) {
	// Make sure user is logged in
	(req.session.username ? username = req.session.username :  username = '');
	if(username = '') res.redirect('/login?e=3');

	// Create the game and redirect to it
	var boardSize = req.body.boardSize;
	createGame(null, req.session.username, null, boardSize, res);
})

app.post('/newPVPGame', function (req, res) {
	// Make sure user is logged in
	(req.session.username ? username = req.session.username :  username = '');
	if(username = '') res.redirect('/login?e=3');

	// Create the game and redirect to it
	var boardSize = req.body.boardSize;
	var opponent = req.body.opponent;
	createGame(null, req.session.username, opponent, boardSize, res);
})


// Get the status of a game
app.get('/getBoard', function (req, res) {
	gameId = req.query.id;
	db.getQuery('games', {gameId: gameId}, function(err, result){
		res.send(result);
	});
})

// Redirect all unsupported pages to the home page
//app.get('*', function (req, res) {
    //res.redirect('/');
//});

// Listen on default port 
var server = app.listen(8000, function () {
  console.log("Server running at 127.0.0.1.");
  db.connect(function(){console.log("Ready to serve requests.");});
})