var express = require('express');
var bodyParser = require('body-parser');
var mustache = require('mustache');
var Crypto = require('crypto')
var fs = require('fs');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();

// Initialize DB
mysql = require("mysql");

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "saiddit"
});

//SQL FUNCTIONS

/*******
*
*	con.query('SELECT * FROM ? WHERE 5=5;', [something that fills in the ?], function(){
*		
*	})
*
*******/

// To get front page w/o user (U == '');
// Front page of Saiddit without a logged in user
// Should return a table of all the subs a given user has subscrubed to sorted.
// I think the user's logged in one is the same as query C?

app.get('/getFront', function(req, res) {
	
	console.log(req.session);
	if(req.session != undefined)
		(req.session.username ? user = req.session.username :  user = '');
	
	if(user != "" && user != undefined) {
			con.query('SELECT posts.id, title, creator, subsaiddit, upvotes, downvotes, (upvotes - downvotes) AS rating \
				FROM (	\
					(SELECT sub_id  \
						FROM ( \
							(SELECT DISTINCT sub_id \
							FROM subscriptions WHERE user_id = ?) AS T1  \
							JOIN subsaiddits ON \
							T1.sub_id = subsaiddits.id)) AS T2 \
					JOIN \
					posts ON T2.sub_id = posts.subsaiddit) \
				ORDER BY rating DESC \
				LIMIT 15', [user], function(err,rows){
				if(err) console.log(err);
				res.send(rows);
			});
		}
	else {
		con.query('SELECT posts.id, title, creator, subsaiddit, upvotes, downvotes, (upvotes - downvotes) AS rating \
				FROM ( \
					(SELECT subsaiddits.id \
						FROM subsaiddits \
						WHERE is_default = 1) AS T2 \
					JOIN \
					posts ON T2.id = posts.subsaiddit) \
				ORDER BY rating DESC \
				LIMIT 15', function(err,rows){
			if(err) console.log(err);
			res.send(rows);
		});
	}
})

// Create post req
// Insert a post
app.get('/newPost', function(req, res) {
	var str = req.query.data.split(",");
	var sub = 0;
	con.query('SELECT id FROM subsaiddits WHERE title = ?', [str[0]], function(err,rows){
		//if(err) alert(err);
		console.log('sub id: '+rows[0].id);
		sub = rows[0].id;
	});
	
	con.query('INSERT INTO posts (subsaiddit, title, creator, text) \
				VALUES (?, ?, ?, ?)' ,[sub,str[1],str[3],str[2]] ,function(err,rows){
		if(err) throw(err);
	});
})

// Delete a post
app.get('/deletePost', function(req, res) {
	var str = req.query.data.split(",");
	console.log(str);
	
	var sub = 0;
	con.query('SELECT id FROM subsaiddits WHERE title = ?', [str[0]], function(err,rows){
		//if(err) alert(err);
		console.log('sub id: '+rows[0].id);
		sub = rows[0].id;
	});
	
	con.query('DELETE FROM posts WHERE \
			subsaiddit = ? AND \
			title = ? AND \
			creator = ?' ,[sub,str[1],str[2]] ,function(err,rows){
		if(err) throw(err);
	});
})


// Query A
// Get all of the posts by account A, sorted by highest rating (upvotes - downvotes).
app.get('/queryA', function (req, res){
	con.query('SELECT id, title, text, creator, upvotes, downvotes, (upvotes - downvotes) AS rating \
				FROM posts WHERE creator = ? \
				ORDER BY rating DESC' ,[req.query.data] ,function(err,rows){
		if(err) console.log(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query B
// Get all of the posts from account B's friends, sorted by highest rating
app.get('/queryB', function (req, res){
	con.query('SELECT id, title, text, creator, upvotes, downvotes, (upvotes - downvotes) AS rating \
				FROM ( \
					((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = ?) \
					UNION \
					(SELECT user_id1 FROM friends WHERE user_id2 = ?)) AS T1 \
					JOIN \
					posts ON T1.F_names = posts.creator) \
				ORDER BY rating DESC' ,[req.query.data, req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})

// Query C
// Get all of account C's subscribed subsaiddits (include the default subsaiddits)
app.get('/queryC', function (req, res){
	con.query('SELECT id, title, creator \
				FROM ( \
					(SELECT DISTINCT sub_id \
					FROM subscriptions WHERE user_id = ?) AS T1  \
					JOIN subsaiddits ON \
					T1.sub_id = subsaiddits.id)' ,[req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query D
// Get account D's favourite posts
app.get('/queryD', function (req, res){
	con.query('SELECT id, title, text, creator  \
				FROM( \
					(SELECT post_id FROM accounts JOIN favourites ON \
					accounts.username = favourites.user_id \
					WHERE accounts.username = ?) AS T1 \
					JOIN \
					posts ON T1.post_id = posts.id)' ,[req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query E
// Get account E's friend's favourite posts
app.get('/queryE', function (req, res){
	con.query('SELECT id, title, text, creator  \
				FROM ( \
					(SELECT post_id \
					FROM ( \
						((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = ?) \
						UNION \
						(SELECT user_id1 FROM friends WHERE user_id2 = ?)) AS T1 \
						JOIN \
						favourites ON T1.F_names = favourites.user_id)) AS T2 \
				JOIN \
				posts ON T2.post_id = posts.id)' ,[req.query.data, req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query F
// Get account F's friend's subscribed subsaiddits (no duplicates)
app.get('/queryF', function (req, res){
	con.query('SELECT id, title, creator \
				FROM ( \
					(SELECT DISTINCT sub_id \
					FROM ( \
						((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = ?) \
						UNION \
						(SELECT user_id1 FROM friends WHERE user_id2 = ?)) AS T1 \
						JOIN \
						subscriptions ON T1.F_names = subscriptions.user_id)) AS T2 \
					JOIN \
					subsaiddits ON T2.sub_id = subsaiddits.id)' ,[req.query.data, req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query G
// Get all of subsaiddit G's creator's posts
app.get('/queryG', function (req, res){
	con.query('SELECT id, title, text, posts.creator \
				FROM ( \
					(SELECT subsaiddits.creator \
					FROM subsaiddits \
					WHERE title = ?) AS T1 \
					JOIN \
					posts ON T1.creator = posts.creator)' ,[req.query.data] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})


// Query H
// Get all of the posts in subsaiddit H that contain <some text> (basic search)
//get req for query H
app.get('/queryH', function (req, res){
	var str = req.query.data.split(",");
	//str[0] for subsaiddit and str[1] for search
	con.query('SELECT posts.id, title, text, creator \
				FROM ( \
					(SELECT subsaiddits.id \
					FROM subsaiddits \
					WHERE title = ?) AS T1 \
					JOIN \
					posts ON T1.id = posts.subsaiddit) \
				WHERE text LIKE ?' ,[str[0], ("%" + str[1] + "%")] ,function(err,rows){
		if(err) throw(err);
		//console.log(rows);
		res.send(rows);
	});
})



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

// Post page
app.get('/post', function (req, res) {
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
	var password = req.body.p;
	
	console.log('Login attempt for user: '+username);

	// Compare with user in DB to see if match
	//need some sql
	
	con.query('SELECT username, password FROM accounts \
				WHERE username = ?' , [username], function(err, rows){
		if(rows.length > 0){
			// Ok so that user exists, but did we supply right password?
			// Lets encrypt supplied pass with that users salt and see if matches their pass
			var salt = 'catdog';
			var temp_password = sha.hex_sha512(password + salt);

			// Make the comparison
			if(temp_password === rows[0].password){
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
	// more sql
	
	con.query('SELECT username FROM accounts \
				WHERE username = ?', [username], function(err, result){
		if(result.length > 0){
			// Redirect to register page with error that user exists
			res.redirect('/register?e=2')
		} else {
			// If not, create a salted password and a salt
			var salt = 'catdog';
			password = sha.hex_sha512(password + salt);

			//inserting default subscriptions
			con.query('INSERT INTO subscriptions VALUES (?, 1)', [username], function(err, result){});
			con.query('INSERT INTO subscriptions VALUES (?, 2)', [username], function(err, result){});
			con.query('INSERT INTO subscriptions VALUES (?, 3)', [username], function(err, result){});
			con.query('INSERT INTO subscriptions VALUES (?, 4)', [username], function(err, result){});
			con.query('INSERT INTO subscriptions VALUES (?, 5)', [username], function(err, result){});
			
			
			// Store new user into db
			con.query('INSERT INTO accounts (username, password) \
			values (?, ?)', [username, password], function(err, result){
				if(err) res.redirect('/register?e=1');
				res.redirect('/login?s=1');
			});
		}
	});
})

// Redirect all unsupported pages to the home page
//app.get('*', function (req, res) {
    //res.redirect('/');
//});

// Listen on default port 
var server = app.listen(8000, function () {
  console.log("Server running at 127.0.0.1.");
	  con.connect(function(err) {
		if(err){
			console.log("error connecting to database");
			return;
		}
		console.log("connection established");
	})
})
