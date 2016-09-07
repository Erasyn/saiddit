import MySQLdb
import getpass
import hashlib
import random

db = MySQLdb.connect(host="localhost",   
                     user="root",       
                     passwd=getpass.getpass(), 
                     db="saiddit")        

cur = db.cursor()

#Numbers to be used for table population functions
num_users = 8
num_posts = 2
subsaids_per_user = 2
num_default_subs = 5
comments_per_post = 10
num_subbed = 10
num_favs = 10

users = []
default_subs = []
post_reps = []
comment_reps = []

#Classes to represent table entries
class User:
	def __init__(self, username, passwrd, num):
		self.username = username
		self.password = passwrd
		self.reputation = 0
		self.friendsList = []
		self.subsaid_Names = []
		self.post_ids = []
		self.comment_ids = []
		self.user_num = num
	
default_user = User("!DEFAULT_USER", int(hashlib.sha512("pass" + "catdog").hexdigest(), 16), -1)
	
def clearDB():
	print("Clearing database")
	cur.execute('DELETE FROM favourites')
	cur.execute('DELETE FROM subscriptions')
	cur.execute('DELETE FROM friends')
	cur.execute('DELETE FROM comment_votes')
	cur.execute('DELETE FROM post_votes')
	cur.execute('DELETE FROM comments')
	cur.execute('DELETE FROM posts')
	cur.execute('DELETE FROM subsaiddits')
	cur.execute('DELETE FROM accounts')
	
#Insert users numbered from 0 to num_users-1.		
def insertUsers():
	print("Inserting users")
	
	#Default user is always included. Creates all default subsaiddits.
	username = default_user.username
	password = default_user.password
	cur.execute('''insert into accounts values
				("%s", "%x", 0)''' % (username, password))
	
	#Remaining users
	for i in range(num_users):
		password = hashlib.sha512(str(i)).hexdigest()
		password = hashlib.sha512(password + "catdog").hexdigest()
		password = int(password, 16)
		
		next = User( "user " + str(i), password, i )
		
		cur.execute('insert into accounts values \
					("%s", "%x", 0)' % (next.username, next.password))
		
		users.append(next)

#Adds 3 friends for each user, which consist of the user 
#numbers within their immediate vicinity (either before or after).
#Divides users into groups of 4 from the beginning, if num_users+1 is
#not divisible by 4, the remainder are ignored for now.
def insertFriends():
	print("Inserting friends")
	iterations = ((num_users + 1) / 4)
	
	j = 0
	for i in range(iterations):
		f1 = int(j)
		f2 = f1 + 1
		f3 = f1 + 2
		f4 = f1 + 3
		
		users[f1].friendsList.append(users[f2])
		users[f1].friendsList.append(users[f3])
		users[f1].friendsList.append(users[f4])
		
		users[f2].friendsList.append(users[f1])
		users[f2].friendsList.append(users[f3])
		users[f2].friendsList.append(users[f4])
		
		users[f3].friendsList.append(users[f1])
		users[f3].friendsList.append(users[f2])
		users[f3].friendsList.append(users[f4])
		
		users[f4].friendsList.append(users[f1])
		users[f4].friendsList.append(users[f2])
		users[f4].friendsList.append(users[f3])
		
		#insert 6 total friendship relationships
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f1].username, users[f2].username))
					
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f1].username, users[f3].username))
					
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f1].username, users[f4].username))
		
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f2].username, users[f3].username))
		
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f2].username, users[f4].username))
					
		cur.execute('insert into friends values \
					("%s", "%s")' % (users[f3].username, users[f4].username))
					
		j += 4
		
#Each user creates a number of subsaiddits
#equal to subsaids_per_user value. The subsaiddits
#made by each user are numbered from 0 to 
#subsaids_per_user - 1.
#The first subsaiddit made by each user is default,
#the remainder are not.
def insertSubsaiddits():
	print("Inserting subsaiddits")
	
	#Insert default subsaiddits
	for m in range(num_default_subs):
		title = "DEFAULT_SUBSAIDDIT " + str(m) 
		desc = "Default subsaiddits " + str(m)
		creator = default_user.username
		default = 1
		
		default_subs.append(title)
		
		cur.execute('insert into subsaiddits (title, description, creator, is_default) \
						values ("%s", "%s", "%s", %d)' % (title, desc, creator, default))
	
	#Remaining subsaiddits, these are not defaults
	for x in users:
		for i in range(subsaids_per_user):
			title = x.username + " Subsaiddit " + str(i)
			x.subsaid_Names.append(title)
			desc = "U" + str(x.user_num) + " sub " + str(i + 1)
			creator = x.username
			default = 0
			
			cur.execute('insert into subsaiddits (title, description, creator, is_default) \
						values ("%s", "%s", "%s", %d)' % (title, desc, creator, default))

#Each user creates num_posts posts in each of their friends subsaiddits.
def insertPosts():
	print("Inserting posts")
	
	#Each user makes one post in each default subsaiddit
	for x in users:
		i = 0
		for defs in default_subs:
			title = x.username + " default sub Post " + str(i)
			text = x.username + " 's " + defs + " post, friend of "
			
			for fri in x.friendsList:
				text += ("U" + str(fri.user_num) + ", ")
				
			creator = x.username
									
			
			cur.execute('''select id from subsaiddits
						where title = "%s"''' % (defs))
						
			temp = cur.fetchone()
			subsaiddit = temp[0]
			
			cur.execute('insert into posts (title, text, creator, subsaiddit) \
								values ("%s", "%s", "%s", "%d")' % (title, text, creator, subsaiddit))
								
			#store post id for later use
			cur.execute('''select id from posts where title = "%s"''' % (title)) 
			temp = cur.fetchone()
			x.post_ids.append(int(temp[0]))
			i += 1
					
	
	for x in users:
		i = num_default_subs
		for j in range(num_posts):
			for friend in x.friendsList:
				for sub in friend.subsaid_Names:
					title = x.username + " Post " + str(i)
					text = x.username + "'s post " + str(i) + ", friend of "
					
					for fri in x.friendsList:
						text += ("U" + str(fri.user_num) + ", ")
									
					creator = x.username
					
					cur.execute('''select id from subsaiddits
								where title = "%s"''' % (sub))
					
					temp = cur.fetchone()
					subsaiddit = temp[0]
					
					cur.execute('insert into posts (title, text, creator, subsaiddit) \
								values ("%s", "%s", "%s", "%d")' % (title, text, creator, subsaiddit))
								
					#store post id for later use
					cur.execute('''select id from posts where title = "%s"''' % (title)) 
					temp = cur.fetchone()
					x.post_ids.append(int(temp[0]))
					i += 1
		
#Friends subscribe to each of their friends subsaiddits
def insertSubscribed():
	print "Inserting subscriptions"
	
	#Each user is subscribed to default subsaiddits automatically
	for x in users: 
		cur.execute('''select username from accounts
					where username = "%s"''' % x.username)
		temp = cur.fetchone()
		user_id = temp[0]
				
		cur.execute('''select id from subsaiddits
						where is_default = 1''')
		
		for row in cur.fetchall():
			sub_id = row[0]
			cur.execute('''insert into subscriptions
						values("%s", "%s")''' % (user_id, sub_id))
	
	#Now sub to their friends subsaiddits
	for x in users:
		for friend in x.friendsList:
			for sub in friend.subsaid_Names:
				cur.execute('''select username from accounts
							where username = "%s"''' % x.username)
				temp = cur.fetchone()
				user_id = temp[0]
				
				cur.execute('''select id from subsaiddits
								where title = "%s"''' % (sub))
				temp = cur.fetchone()
				sub_id = temp[0]
				
				cur.execute('''insert into subscriptions
								values ("%s", "%s")''' % (user_id, sub_id))
				
				
#Users favourite the first default post of each of their friends
#and the first non-default post
def insertFavs():
	print "Inserting favourites"
	
	for x in users:
		for friend in x.friendsList:
			for post in friend.post_ids[:1]:
				cur.execute('''select id from posts where id = "%d"''' % (post))
				temp = cur.fetchone()
				post_id = temp[0]
				
				cur.execute('''select username from accounts where username = "%s"''' % (x.username))
				temp = cur.fetchone()
				user_id = temp[0]
				
				cur.execute('''insert into favourites values
							("%s", "%d")''' % (user_id, post_id))
			
			for post in friend.post_ids[num_default_subs:(num_default_subs + 1)]:
				cur.execute('''select id from posts where id = "%d"''' % (post))
				temp = cur.fetchone()
				post_id = temp[0]
				
				cur.execute('''select username from accounts where username = "%s"''' % (x.username))
				temp = cur.fetchone()
				user_id = temp[0]
				
				cur.execute('''insert into favourites values
							("%s", "%d")''' % (user_id, post_id))


#Each user makes 1 comment on each of their friends posts
def insertComments():
	print "Inserting comments"
	
	for x in users:
		for friend in x.friendsList:
			for post in friend.post_ids:
				text = "Comment by " + x.username + " on post id " + str(post) + " posted by " + friend.username
				pst = post 
				creator = x.username
				
				cur.execute('''insert into comments (text, post, creator) values
							("%s", "%d", "%s")''' % (text, pst, creator))
				
				#store comment id for later use
				cur.execute('''select id from comments where text = "%s"''' % (text)) 
				temp = cur.fetchone()
				x.comment_ids.append(int(temp[0]))
	
	db.commit()
#Each user goes through all other posts/comments and randomly upvotes, downvotes,
#or does nothing. Upvotes have a higher probability of occuring.
def insertVotes():
	print ("Inserting votes")
	post_count = 0
	comment_count = 0
	
	#first number is upvote numbers, second is downvote numbers, and third is whether they upvoted
	#store all this info so we have to write to db less
	for x in users:
		for post in x.post_ids:
			post_reps.append([x, post, 0, 0, 0]) 
		for comment in x.comment_ids:
			comment_reps.append([x, comment, 0, 0, 0])
			
	for x in post_reps:
		for user in users:
			if(x[0].username == user.username):
				continue
				
			rand = random.randint(0,3)
			
			if (rand == 0): #downvote
				x[3] += 1
				x[0].reputation -= 1
				x[4] = 0
			elif(rand == 1): #no vote
				continue
			else: #upvote
				x[2] += 1
				x[0].reputation += 1 
				x[4] = 1
			
			cur.execute('''insert into post_votes values
						("%s", "%d", "%d")''' % (user.username, x[1], x[4]))
						
		db.commit()
		
	print "Done post votes"
		
	for x in comment_reps:
		for user in users:
			if(x[0].username == user.username):
				continue
				
			rand = random.randint(0,3)
			
			if (rand == 0): #downvote
				x[3] += 1
				x[0].reputation -= 1
				x[4] = 0
			elif(rand == 1): #no vote
				continue
			else: #upvote
				x[2] += 1
				x[0].reputation += 1
				x[4] = 1
				
			cur.execute('''insert into comment_votes values
						("%s", "%d", "%d")''' % (user.username, x[1], x[4]))
		
		db.commit()
		
	print "Done comment votes"
	
	#now insert into database
	for x in post_reps:
		cur.execute('''update posts
					 set downvotes = "%d", upvotes = "%d"
					 where id = "%d"''' % (x[3], x[2], x[1]))
					 
	db.commit()
	
	print "Post votes inserted"
	
	for x in comment_reps:
		cur.execute('''update comments
						set downvotes = %d, upvotes = "%d"
						where id = "%d"''' % (x[3], x[2], x[1]))
						
	print "Comment votes inserted"
						
	db.commit()
						
	for x in users:
		cur.execute('''update accounts
						set reputation = "%d"
						where username = "%s"''' % (x.reputation, x.username))
	
	#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	
	
clearDB()

insertUsers()
insertFriends()
insertSubsaiddits()
insertPosts()
insertSubscribed()
insertFavs()
insertComments()
insertVotes()

db.commit()

print "End"
db.close()