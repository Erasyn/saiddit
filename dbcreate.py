import MySQLdb
import getpass

print "You're gonna have to enter the password twice"
print "I'm sure there's a better way to do this..."
print ""

db = MySQLdb.connect(host="localhost", 
                     user="root",        
                     passwd=getpass.getpass()) 
               
cursor = db.cursor()
cursor.execute('DROP DATABASE IF EXISTS saiddit')
cursor.execute('CREATE DATABASE saiddit')

db.commit()
db.close()

db = MySQLdb.connect(host="localhost",  
                     user="root",        
                     passwd=getpass.getpass(),
					 db = "saiddit"
					 )  
					 
cursor = db.cursor()

def createAccounts():
	cursor.execute('''CREATE TABLE Accounts
					(
					username VARCHAR(20) PRIMARY KEY, 
					password CHAR(128) NOT NULL, 
					reputation INT NOT NULL DEFAULT 0 
					)''')

def createSubsaiddits():
	cursor.execute('''CREATE TABLE Subsaiddits
					(
					id INT PRIMARY KEY AUTO_INCREMENT,
					title VARCHAR(50) NOT NULL,
					description VARCHAR(500) NOT NULL,
					creator VARCHAR(20)  NOT NULL REFERENCES Accounts(username),
					created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
					is_default BOOL NOT NULL,
					UNIQUE (title)
					)''')

def createPosts():
	cursor.execute('''CREATE TABLE Posts
					(
					id INT PRIMARY KEY AUTO_INCREMENT,
					title VARCHAR(255) NOT NULL,
					text TEXT NOT NULL,
					url TEXT,
					creator VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					subsaiddit INT NOT NULL REFERENCES Subsaiddits(id),
					edit_date DATETIME ON UPDATE CURRENT_TIMESTAMP,     
					publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
					downvotes INT NOT NULL DEFAULT 0, 
					upvotes INT NOT NULL DEFAULT 0,
					UNIQUE (title, creator, subsaiddit)
					)''')


def createComments():
	cursor.execute('''CREATE TABLE Comments
					(
					id INT PRIMARY KEY AUTO_INCREMENT,
					text TEXT NOT NULL,
					post INT NOT NULL,
					reply_to INT,
					creator VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
					downvotes INT NOT NULL DEFAULT 0,  
					upvotes INT NOT NULL DEFAULT 0,
					CONSTRAINT FOREIGN KEY (post) REFERENCES posts(id) ON DELETE CASCADE,
					CONSTRAINT FOREIGN KEY (reply_to) REFERENCES comments(id) ON DELETE CASCADE
					)''')

def createSubscriptions():
	cursor.execute('''CREATE TABLE Subscriptions 
					(
					user_id VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					sub_id VARCHAR(20) NOT NULL REFERENCES Subsaiddits(id),
					PRIMARY KEY(user_id, sub_id)	
					)''')


def createFriends():
	cursor.execute('''CREATE TABLE Friends (
					user_id1 VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					user_id2 VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					PRIMARY KEY (user_id1, user_id2)
					)''')

def createFavourites():
	cursor.execute('''CREATE TABLE Favourites 
					(
					user_id VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					post_id VARCHAR(20) NOT NULL REFERENCES Posts(id),
					PRIMARY KEY(user_id, post_id)
					)''')


def createPost_votes():
	cursor.execute('''CREATE TABLE Post_Votes (
					user_id VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					post_id VARCHAR(20) NOT NULL REFERENCES Posts(id),
					upvoted BOOL NOT NULL,
					PRIMARY KEY(user_id, post_id)
					)''')


def createComment_votes():
	cursor.execute('''CREATE TABLE Comment_Votes (
					user_id VARCHAR(20) NOT NULL REFERENCES Accounts(username),
					comment_id VARCHAR(20) NOT NULL REFERENCES Comments(id),
					upvoted BOOL NOT NULL,
					PRIMARY KEY(user_id, comment_id)
					)''')


createAccounts()
createSubsaiddits()
createPosts()
createComments()
createSubscriptions()
createFriends()
createFavourites()
createPost_votes()
createComment_votes()

db.commit()
db.close()