import MySQLdb
import getpass

db = MySQLdb.connect(host="localhost",    # your host, usually localhost
                     user="root",         # your username
                     passwd=getpass.getpass(),  # your password
                     db="saiddit")        # name of the data base

# you must create a Cursor object. It will let
#  you execute all the queries you need
cur = db.cursor()

#For the form to delete a post
