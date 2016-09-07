import MySQLdb
import getpass

db = MySQLdb.connect(host="localhost",    # your host, usually localhost
                     user="root",         # your username
                     passwd=getpass.getpass(),  # your password
                     db="saiddit")        # name of the data base

# you must create a Cursor object. It will let
#  you execute all the queries you need
cur = db.cursor()

users = []

cur.execute('''select username from accounts''')

for row in cur.fetchall():
	users.append(row[0])

test_account = users[1]

def printResults():
	#The following code was obtained from:
	#http://stackoverflow.com/questions/10865483/print-results-in-mysql-format-with-python
	results = cur.fetchall()

	widths = []
	columns = []
	tavnit = '|'
	separator = '+' 

	for cd in cur.description:
		widths.append(max(cd[2], len(cd[0])))
		columns.append(cd[0])

	for w in widths:
		tavnit += " %-"+"%ss |" % (w,)
		separator += '-'*w + '--+'

	print(separator)
	print(tavnit % tuple(columns))
	print(separator)
	for row in results:
		print(tavnit % row)
	print(separator)

#Get all of the posts by account A, 
#sorted by highest rating (upvotes - downvotes)
def testQA():
	print "Testing Query A on Account " + test_account
	
	cur.execute('''SELECT id, title, creator, upvotes, downvotes, (upvotes - downvotes) AS rating
				FROM posts WHERE creator = "%s"
				ORDER BY rating DESC''' % (test_account))
				
	printResults()

#Get all posts from account A's friends,
#sorted by highest rating.
def testQB():
	print "Testing Query B on Account " + test_account
	
	cur.execute('''SELECT id, title, creator, upvotes, downvotes, (upvotes - downvotes) AS rating 
				FROM (
					((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = "%s")
					UNION
					(SELECT user_id1 FROM friends WHERE user_id2 = '%s')) AS T1
					JOIN 
					posts ON T1.F_names = posts.creator)
				ORDER BY rating DESC''' % (test_account, test_account))
		
	printResults()

#Get accounts A's subscribed subsaiddits (including default subsaiddits)
def testQC():
	print "Testing Query C on Account " + test_account
	
	cur.execute('''SELECT id, title, creator 
				FROM (
					(SELECT DISTINCT sub_id
					FROM subscriptions WHERE user_id = "%s") AS T1 
					JOIN subsaiddits ON 
					T1.sub_id = subsaiddits.id)''' % (test_account))
				
	printResults()
	
#Get account A's favourite posts
def testQD():
	print "Testing Query D on Account " + test_account
	
	cur.execute('''SELECT id, title, text, creator 
				FROM(
					(SELECT post_id FROM accounts JOIN favourites ON
					accounts.username = favourites.user_id
					WHERE accounts.username = "%s") AS T1
					JOIN
					posts ON T1.post_id = posts.id)''' % (test_account))
	
	printResults()
	
#Get account A's friend's favourite posts
def testQE():
	print "Testing Query E on Account " + test_account
	
	cur.execute('''SELECT id, title, text, creator 
				FROM (
					(SELECT post_id
					FROM (
						((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = "%s")
						UNION
						(SELECT user_id1 FROM friends WHERE user_id2 = '%s')) AS T1
						JOIN
						favourites ON T1.F_names = favourites.user_id)) AS T2
				JOIN 
				posts ON T2.post_id = posts.id)''' % (test_account, test_account))
	
	printResults()

#Get account A's subscribed subsaiddits
def testQF():
	print "Testing Query F on Account " + test_account 
	
	cur.execute('''SELECT id, title, creator
				FROM (
					(SELECT DISTINCT sub_id
					FROM (
						((SELECT user_id2 AS F_names FROM friends WHERE user_id1 = "%s")
						UNION
						(SELECT user_id1 FROM friends WHERE user_id2 = "%s")) AS T1
						JOIN
						subscriptions ON T1.F_names = subscriptions.user_id)) AS T2
					JOIN
					subsaiddits ON T2.sub_id = subsaiddits.id)''' % (test_account, test_account))
		
	printResults()

test_subsaiddit = "user 0 Subsaiddit 0"
	
#Get all subsaiddits S's creator's posts
def testQG():
	print "Testing Query G on Account " + test_subsaiddit
	
	cur.execute('''SELECT id, title, posts.creator
				FROM (
					(SELECT subsaiddits.creator
					FROM subsaiddits 
					WHERE title = "%s") AS T1
					JOIN 
					posts ON T1.creator = posts.creator)''' % (test_subsaiddit))
	
	printResults()

test_text = "U2, U3"
	
#Get all the posts in subsaiddit S that contain <some text>
def testQH():
	print "Testing Query H on Account " + test_account
	
	cur.execute('''SELECT posts.id, title, text, creator
				FROM (
					(SELECT subsaiddits.id
					FROM subsaiddits 
					WHERE title = "%s") AS T1
					JOIN
					posts ON T1.id = posts.subsaiddit)
				WHERE text LIKE "%s"''' % (test_subsaiddit, "%" + test_text + "%"))
	
	printResults()
	
def testLoggedOutFP():
	cur.execute('''SELECT posts.id, title, creator, subsaiddit, upvotes, downvotes, (upvotes - downvotes) AS rating
				FROM (
					(SELECT subsaiddits.id
						FROM subsaiddits
						WHERE is_default = 1) AS T2
					JOIN
					posts ON T2.id = posts.subsaiddit)
				ORDER BY rating DESC
				LIMIT 15''')
				
	printResults()

def testLoggedInFP():
	cur.execute('''SELECT posts.id, title, creator, subsaiddit, upvotes, downvotes, (upvotes - downvotes) AS rating
				FROM (
					(SELECT sub_id 
						FROM (
							(SELECT DISTINCT sub_id
							FROM subscriptions WHERE user_id = "%s") AS T1 
							JOIN subsaiddits ON 
							T1.sub_id = subsaiddits.id)) AS T2
					JOIN
					posts ON T2.sub_id = posts.subsaiddit)
				ORDER BY rating DESC
				LIMIT 15
				''' % (test_account))
				
	printResults()

cur.execute('RESET QUERY CACHE')
testQA()
cur.execute('RESET QUERY CACHE')
testQB()
cur.execute('RESET QUERY CACHE')
testQC()
cur.execute('RESET QUERY CACHE')
testQD()
cur.execute('RESET QUERY CACHE')
testQE()
cur.execute('RESET QUERY CACHE')
testQF()
cur.execute('RESET QUERY CACHE')
testQG()
cur.execute('RESET QUERY CACHE')
testQH()
cur.execute('RESET QUERY CACHE')
testLoggedOutFP()
cur.execute('RESET QUERY CACHE')
testLoggedInFP()
cur.execute('RESET QUERY CACHE')
#testDeletePost()