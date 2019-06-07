# -*- coding: utf-8 -*-
"""
Created on Fri Jun  7 11:15:46 2019

@author: Thierno_M_B_DIALLO
"""


import sqlite3
conn = sqlite3.connect('graphes.sqlite')
c = conn.cursor()
c.execute('''DROP TABLE IF EXISTS graphes''')
c.execute('''CREATE TABLE graphes ( nom_image TEXT, mini REAL, maxi REAL, moyenne REAL, ecart_type REAL)''')