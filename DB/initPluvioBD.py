# -*- coding: utf-8 -*-
"""
Created on Fri Jun  7 11:17:17 2019

@author: Thierno_M_B_DIALLO
"""


import csv
import sqlite3
conn = sqlite3.connect('pluvio.sqlite')

c = conn.cursor()


## ======== Création de la table 'stations' ================================================================

print("Création de la base de données 'stations' ...")
c.execute('''DROP TABLE IF EXISTS stations''')
c.execute('''CREATE TABLE stations       \
              ( latitude REAL,                         \
                longitude REAL,                         \
                nom TEXT,                       \
                adresse TEXT,                   \
                proprietaires TEXT,               \
                dateMS TEXT,               \
                dateHS TEXT,               \
                zsol REAL,                      \
                appartenance BOOL,                \
                identifiant INT,                 \
                gid INT PRIMARY KEY   )''')
print("... Base de données 'stations' créée. \n")


print("Chargement des données de 'station-pluvio-2018.csv' ...")
with open('stations-pluvio-2018.csv', newline='') as csvfile :
    lecturefichier = csv.reader(csvfile, delimiter=';', quotechar='"')
    premiereligne = True
    for row in lecturefichier :
        if premiereligne :
            premiereligne = False
        else :
            del row[2] #Car l'altitude n'est pas renseignée
            c.execute('INSERT INTO stations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', tuple(v for v in row))
            conn.commit()
print("... Données de 'station-pluvio-2018.csv' chargées. \n")



## ======== Création de la table histo =====================================================================

print("Création de la base de données : 'histo' ...")
c.execute('''DROP TABLE IF EXISTS histo''')
c.execute('''CREATE TABLE histo 
    (date text, sta_1 real, sta_1_e text, sta_2 real, sta_2_e text, sta_3 real, sta_3_e text, sta_4 real, sta_4_e text, sta_5 real, sta_5_e text, sta_6 real, sta_6_e text, sta_7 real, sta_7_e text, sta_8 real, sta_8_e text, sta_9 real, sta_9_e text,sta_10 real, sta_10_e text, sta_11 real, sta_11_e text, sta_12 real, sta_12_e text, sta_13 real, sta_13_e text, sta_14 real, sta_14_e text, sta_15 real, sta_15_e text, sta_16 real, sta_16_e text, sta_17 real, sta_17_e text, sta_18 real, sta_18_e text, sta_19 real, sta_19_e text, sta_21 real, sta_21_e text, sta_23 real, sta_23_e text, sta_24 real, sta_24_e text, sta_25 real, sta_25_e text, sta_26 real, sta_26_e text, sta_27 real, sta_27_e text, sta_28 real, sta_28_e text, sta_29 real, sta_29_e text, sta_30 real, sta_30_e text, sta_31 real, sta_31_e text, sta_32 real, sta_32_e text )''')
print("... Base de données 'histo' créée. \n")


print("Chargement des données de 'pluvio-histo-2018.csv' ...")
with open('pluvio-histo-2018.csv', newline='') as csvfile :
    lecturefichier = csv.reader(csvfile, delimiter=';', quotechar='"')
    i = 0 # Numéro de la ligne étudiée
    #ligne_reprise = 54841

    for row in lecturefichier :
        i += 1

        if i == 1 : # On ignore la première ligne du fichier           
            continue

        #if i >= ligne_reprise :
            #row.append('') # Manque un ';' dans les données à partir de la ligne 'ligne_reprise' = 54841

        c.execute('INSERT INTO histo VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', tuple(v for v in row))
        conn.commit()
print("... Données de 'pluvio-histo-2018.csv' chargées. \n")