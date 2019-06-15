# -*- coding: utf-8 -*-
"""
Created on Fri Jun  7 12:31:20 2019

@author: Thierno_M_B_DIALLO
"""


import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import json

#import numpy as np

from matplotlib import pyplot as plt
from matplotlib import dates
import datetime
from math import floor, ceil, sqrt
from statistics import mean, variance
import os
from decimal import Decimal
import sqlite3

GRAPH_IMAGE_DIR = 'Client/img/graphs/'
GRAPH_IMAGE_DIR_CLIENT = 'img/graphs/'
IMG_EXTENSION = '.png'
PLUVIO_DB_NAME = "../DB/pluvio.sqlite"
GRAPHS_DB_NAME = "../DB/graphes.sqlite"
#PAGES_DIR_NAME = "../Client"
#graph_image_dir = '../Client/img/graphs/'
#img_extension = '.png'


# Définition du handler
class RequestHandler(http.server.SimpleHTTPRequestHandler) :

    #static_dir = '/client' # Sous-répertoire racine des documents statiques
    PAGES_DIR_NAME = "Client"
    server_version = 'serveur.py/0.6' # version du serveur

    # Surcharge de la méthode traitant les requêtes GET :
    def do_GET(self) :
        self.init_params()
    
        ## Requête "location" - retourne la liste de lieux et leurs coordonnées géographiques
        if self.path_info[0] == "location" :
            data = [] # Liste des données à transmettre à la page WEB
            
            # Connexion à la base de données :
            conn = sqlite3.connect(PLUVIO_DB_NAME)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()

            # Envoi de la requête :
            c.execute('SELECT gid, nom, latitude, longitude, adresse, proprietaires, dateMS, dateHS, zsol, appartenance, identifiant FROM stations')
            a = c.fetchall() # Tableau contenant les réponses à la requête
            
            # Parcours des réponses obtenues :
            for i in range(len(a)) :
                d = {}
                # Parcours des colonnes/champs de la réponse :
                for j in a[i].keys() :
                    d[j] = a[i][j] # Ajout de la donnée au dictionnaire
                data.append(d) # Ajout du dictionnaire à la liste des données
            self.send_json(data) # Envoi des données à la page WEB, au format JSON
    
    
        ## Requête "date" - Retourne l'adresse de l'image contenant le graphe de pluviométrie (et la crée si elle n'existe pas)
        elif self.path_info[0] == "date" :
            
            # Récupération des infos contenues dans l'adresse de la requête GET :
            gid = self.path_info[1].split('-')[0] # ex: "1-%20SAINT%20GERMAIN" => gid = "1"
            gids = gid.split('_')
            datedeb = self.path_info[2] # ex: "02-01-2011"
            heuredeb = self.path_info[3] # ex: "18:32"
            datefin = self.path_info[4]
            heurefin = self.path_info[5]
            pas_minutes = self.path_info[6]
            
            selected_gid = "-".join(gids)
            
            parametres = [selected_gid] + datedeb.split('-') + heuredeb.split(':') + datefin.split('-') + heurefin.split(':') + [pas_minutes]            
            nom_image_new = "_".join(parametres) # Création du nom de l'image
            
            # Connexion à la base de données :
            conn = sqlite3.connect(GRAPHS_DB_NAME)
            c = conn.cursor()
            # Envoi de la requête :
            c.execute('''SELECT nom_image FROM graphes WHERE nom_image = "''' + str(nom_image_new) + '''"''')
            a = c.fetchall() # Tableau contenant les réponses à la requête

            nom_complet = GRAPH_IMAGE_DIR + nom_image_new + IMG_EXTENSION
            
            if not (len(a)>0 and os.path.isfile(nom_complet)) : # ie. aucune image ne correspond => construction du graphe

                # Connexion à la base de données
                conn = sqlite3.connect(PLUVIO_DB_NAME)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                
                # Récupération de l'identifiant de la station :
                r = c.execute('''SELECT identifiant, gid, nom FROM stations WHERE gid="''' + gids[0] + '''"''')
                result = r.fetchall()
                identifiant = result[0]['identifiant']
                identifiant2 = ""
                identifiant3 = ""
                nomStation =result[0]['nom']
                nomStation2 = ""
                if(len(gids)>1) :
                    r2 = c.execute('''SELECT identifiant, gid, nom FROM stations WHERE gid="''' + gids[1] + '''"''')
                    result2 = r2.fetchall()
                    identifiant2 = result2[0]['identifiant']
                    nomStation2 =result2[0]['nom']
                if(len(gids)>2) :
                    r3 = c.execute('''SELECT identifiant, gid, nom FROM stations WHERE gid="''' + gids[2] + '''"''')
                    result3 = r3.fetchall()
                    identifiant3 = result3[0]['identifiant']
                    nomStation = str(nomStation)+", "+str(nomStation2)+" et "+str(result3[0]['nom'])
                elif(len(gids)>1) : nomStation = str(nomStation)+" et "+str(nomStation2)
                    
                #identifiant = r.fetchall()[0]['identifiant']
                
                
                # Récupération des données de pluviométrie :
                texte_sta = 'sta_' + str(identifiant)
                texte_sta2 = ""
                texte_sta3 = ""
                a2 = ""
                a3 = ""
                r = c.execute('SELECT date, ' + texte_sta + ' FROM histo')
                a = r.fetchall() 
                if(len(gids)>1) :
                    texte_sta2 = 'sta_' + str(identifiant2)
                    r2 = c.execute('SELECT date, ' + texte_sta2 + ' FROM histo')
                    a2 = r2.fetchall() 
                if(len(gids)>2) :
                    texte_sta3 = 'sta_' + str(identifiant3)
                    r3 = c.execute('SELECT date, ' + texte_sta3 + ' FROM histo')
                    a3 = r3.fetchall() 
                
                def creation_date(date) :
                    JJ = int(date[:2]) # Année
                    MM = int(date[3:5]) # Mois
                    YYYY = int(date[6:10]) # Jour
                    hh = int(date[11:-3]) # Heure
                    mm = int(date[-2:]) # Minute
                    return datetime.datetime(YYYY, MM, JJ, hh, mm)
                
                date_min = creation_date(datedeb+heuredeb)
                date_max = creation_date(datefin+heurefin)
                
                n=len(a)
                
                D = [] # Liste des dates
                Y = [] # Liste des valeurs
                Y2 = []
                Y3 = []
                
                for i in range(n) :
                    date = creation_date(a[i]['date'])
                    if date_min <= date and date <= date_max :
                        val = a[i][texte_sta]
                        if val == '' :
                            val = 0
                        else :
                            val = float(val)
                        D.append(date)
                        Y.append(val)
                        
                        if len(gids)>1 :
                            val2 = a2[i][texte_sta2]
                            if val2 == '' :
                                val2 = 0
                            else :
                                val2 = float(val2)
                            Y2.append(val2)
                        
                        if len(gids)>2 :
                            val3 = a3[i][texte_sta3]
                            if val3 == '' :
                                val3 = 0
                            else :
                                val3 = float(val3)
                            Y3.append(val3)
 #//////////////////////////// A regarder //////////////////////////////////////:               
                
                # Conversion des dates pour matplotlib :
                fds = [] 
                for el in D :
                    fds.append(dates.date2num(el))
                
                
                ########## AFFICHAGE GRAPHE #################################################################
                
                #fig = plt.figure(figsize=(12,6), dpi=100)
                fig = plt.figure(figsize=(8.64,4.32), dpi=100)
                ax = fig.add_subplot(111)
                
                ## ===== Gestion des graduations ================================================
                
                # Unités de graduations :
                annee = datetime.timedelta(365)
                mois = datetime.timedelta(31)
                jour = datetime.timedelta(1)
                heure = datetime.timedelta(0,0,3600)
                
                n_unites = 3 # Nombre de graduations minimales pour le graphe
                diff = date_max-date_min # Intervalle de temps du graphe
                
                L_xticks = [] # Liste des valeurs des graduations
                
                if diff > n_unites*annee : # On gradue en années :
                    y = date_min.year
                    i = 0
                    while y+i <= date_max.year :
                        L_xticks.append( datetime.datetime(y+i,1,1) )
                        i += 1
                    hfmt = dates.DateFormatter('%Y') # Format d'affichage des graduations
                    angle_rotation = 0 # Angle d'affichage des graduations
                    
                elif diff > mois : # On gradue en mois :
                    y = date_min.year
                    m = date_min.month
                    (i, j) = (0, m)
                    while not( y+i >= date_max.year and j > date_max.month ) :
                        L_xticks.append( datetime.datetime(y+i, j, 1) )
                        if j == 12 :
                            j = 1
                            i += 1
                        else :
                            j += 1
                    hfmt = dates.DateFormatter('%m/%Y')
                    angle_rotation = 40
                    
                elif diff > n_unites*jour : # On gradue en jours :
                    y = date_min.year
                    m = date_min.month
                    d = date_min.day
                    (i, j, k) = (0, m, d)
                    while not( y+i >= date_max.year and j >= date_max.month and k >= date_max.day) :
                        L_xticks.append( datetime.datetime(y+i, j, k) )
                        if (j in [1,3,5,7,8,10,12] and k == 31) or (j == 2 and k == 28) or (j not in [1,2,3,5,7,8,10,12] and k == 30) :
                            k = 1
                            if j == 12 :
                                i += 1                
                                j = 1
                            else :
                                j += 1
                        else :
                            k+=1
                    hfmt = dates.DateFormatter('%d/%m/%Y')
                    angle_rotation = 70
                    
                elif diff > n_unites*heure : # On gradue en heures :
                    delta = diff/10
                    L_xticks = dates.drange(date_min, date_max+delta, delta)
                    hfmt = dates.DateFormatter('%d/%m/%Y %H:00')
                    angle_rotation = 70
                    
                else :  # On gradue en minutes :
                    delta = diff/10
                    L_xticks = dates.drange(date_min, date_max+delta, delta)
                    hfmt = dates.DateFormatter('%d/%m/%Y %H:%M')
                    angle_rotation = 70
                
                
                # ===== Regroupement des données suivant le pas ====================================
                
                # Conversion de la valeur de 'pas_minutes' au format compris par Python :
                pas = datetime.timedelta(0, int(pas_minutes)*60)
                
                resolution = datetime.timedelta(0,1) # Plus petit pas de temps possible           
                
                n_i = 1 # Numéro de l'intervalle de temps étudié
                inf_intervalle = date_min+(n_i-1)*pas # Borne inférieure de l'intervalle
                sup_intervalle = date_min+n_i*pas # Borne supérieure de l'intervalle
                
                fds_tronc = [dates.date2num(inf_intervalle)] # Nouvelle liste des dates converties
                Y_tronc = [0] # Nouvelle liste des valeurs
                
                somme = 0
                while i < len(fds) :
                    if fds[i] < dates.date2num(sup_intervalle) :
                        # Le point appartient à l'intervalle étudié donc on le rajoute à la somme :
                        somme += Y[i]
                        if len(gids)>1 : somme += Y2[i]
                        if len(gids)>2 : somme += Y3[i]
                            
                        i += 1
                    else :
                        # Le point n'appartient pas à l'intervalle étudié donc on passe à l'intervalle suivant :
                        n_i += 1
                        #if len(gids)>1 : somme = somme/2
                        #elif len(gids)>2 : somme = somme/3
                        # On trace artificiellement un graphe en barres :
                        fds_tronc.append(dates.date2num(inf_intervalle+resolution))
                        Y_tronc.append(somme)
                        fds_tronc.append(dates.date2num(sup_intervalle-resolution))
                        Y_tronc.append(somme)
                        fds_tronc.append(dates.date2num(sup_intervalle))
                        Y_tronc.append(0)
                        # On change les bornes de l'intervalle étudié
                        inf_intervalle = sup_intervalle
                        sup_intervalle = date_min+n_i*pas
                        somme = 0
                
                
                # ===== Tracé du graphe  ==============================================================

                plt.grid(color='#888888', linestyle=':')  
                
                plt.plot(fds_tronc, Y_tronc)
                
                station = "Station"
                
                if len(gids)>1 : station = "Stations"
                
                plt.fill_between(fds_tronc, Y_tronc, 0, color='#0055ff')
                plt.xlim([date_min, date_max]) # Définition des limites temporelles du graphique
                plt.ylabel("Précipitations en mm") # Ajout du nom des axes
                plt.title(station+' : ' + nomStation + "\nPluviométrie du " + datedeb + ' à ' + heuredeb + " au " + datefin + ' à ' + heurefin, fontsize=16)
                plt.subplots_adjust(bottom=0.3)
                
                ax.xaxis.set_major_formatter(hfmt) # Format d'affichage des graduations
                plt.xticks(L_xticks, rotation=angle_rotation) # Ajout des graduations (et de leur angle d'affichage)
                
                
                # ===== Sauvegarde du graphe et mise à jour de la base de données =======================
                
                fig.savefig(nom_complet) # Sauvegarde de l'image
                
                plt.close() # Fermeture de l'image (ouverte par Spyder lors du 'plot')
                
                ## Ajout du graphe et d'informations complémentaires à la base de données :
                mini = round(min(Y_tronc),2)
                maxi = round(max(Y_tronc),2)
                try :
                    moyenne = round(sum(Y_tronc)/2/((len(Y_tronc)-1)/3) / (int(pas_minutes))*(60*24*365),2) # moyenne annuelle
                    ecart_type = round(sqrt(variance(Y_tronc)),2)
#                    moyenne = (a[0][2]*1000)//1/1000
#                    ecart_type = (a[0][3]*1000)//1/1000
                except :
                    moyenne = 'N/A'
                    ecart_type = 'N/A'
            
                row = [nom_image_new, mini, maxi, moyenne, ecart_type]
                
                conn = sqlite3.connect(GRAPHS_DB_NAME)
                c = conn.cursor()
                c.execute('INSERT INTO graphes VALUES (?, ?, ?, ?, ?)', tuple(v for v in row))
                conn.commit()                
            
            else :  #C'est à dire le graphe existe déja
                c.execute('''SELECT mini, maxi, moyenne, ecart_type FROM graphes WHERE nom_image = "''' + str(nom_image_new) + '''"''')
                a = c.fetchall()
                print(a)
                mini = round(a[0][0]//1,2)
                maxi = round(a[0][1]//1,2)
                
                try :
                    moyenne = round((a[0][2]*1000)//1/1000,2)
                    ecart_type = round((a[0][3]*1000)//1/1000,2)
                    
                except :
                    moyenne = 'N/A'
                    ecart_type = 'N/A'
                
            # Nom complet d'accès à l'image (vu depuis la page HTML) :
            nom_image_new = GRAPH_IMAGE_DIR_CLIENT + nom_image_new + IMG_EXTENSION
                
            # Envoi de l'adresse de l'image à la page WEB, au format JSON :
            self.send_json([{"nom_image_new":nom_image_new, "mini":mini, "maxi":maxi, "moyenne":moyenne, "ecart_type":ecart_type}])
            
            
        ## Requête générique
        elif self.path_info[0] == "service" :
            self.send_html('<p>Path info : <code>{}</p><p>Chaîne de requête : <code>{}</code></p>' \
                    .format('/'.join(self.path_info), self.query_string));
    
    
        else :
            self.send_static()



    # Méthode pour traiter les requêtes HEAD
    def do_HEAD(self) :
        self.send_static()

    
    
    # Méthode pour traiter les requêtes POST - non utilisée dans l'exemple
    def do_POST(self) :
        self.init_params()
        
        ## requête générique
        if self.path_info[0] == "service":
            self.send_html(('<p>Path info : <code>{}</code></p><p>Chaîne de requête : <code>{}</code></p>' \
          + '<p>Corps :</p><pre>{}</pre>').format('/'.join(self.path_info),self.query_string,self.body));
          
        else:
            self.send_error(405)



    ## On envoie le document statique demandé :
    def send_static(self) :

        # On modifie le chemin d'accès en insérant le répertoire préfixe :
        self.path = self.PAGES_DIR_NAME + self.path
        print("self.PAGES_DIR_NAME : ")
        print(self.PAGES_DIR_NAME)
        print("self.path : ")
        print(self.path)
        # On calcule le nom de la méthode parent à appeler (do_GET ou do_HEAD)
        #  à partir du verbe HTTP (GET ou HEAD) :
        method = 'do_{}'.format(self.command)

        # On traite la requête via la classe parent :
        getattr(http.server.SimpleHTTPRequestHandler, method)(self)



    ## Envoi d'un document html dynamique :
    def send_html(self, content) :
        headers = [('Content-Type', 'text/html;charset=utf-8')]
        html = '<!DOCTYPE html><title>{}</title><meta charset="utf-8">{}' \
               .format(self.path_info[0], content)
        self.send(html, headers)



    ## Envoi d'un contenu encodé en JSON :
    def send_json(self, data, headers=[]) :
        body = bytes(json.dumps(data), 'utf-8') # encodage en json et UTF-8
        self.send_response(200)
        self.send_header('Content-Type' , 'application/json')
        self.send_header('Content-Length', int(len(body)) )
        [self.send_header(*t) for t in headers]
        self.end_headers()
        self.wfile.write(body) 



    ## Envoi d'une réponse :
    def send(self, body, headers=[]) :
        encoded = bytes(body, 'UTF-8')
        self.send_response(200)
        [self.send_header(*t) for t in headers]
        self.send_header('Content-Length', int(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)



    ## Analyse de la requête pour initialiser nos paramètres :
    def init_params(self) :
        # Analyse de l'adresse :
        info = urlparse(self.path)
        self.path_info = info.path.split('/')[1:]
        self.query_string = info.query
        self.params = parse_qs(info.query)

        # Récupération du corps
        length = self.headers.get('Content-Length')
        ctype = self.headers.get('Content-Type')
        if length :
            self.body = str(self.rfile.read(int(length)), 'utf-8')
        if ctype == 'application/x-www-form-urlencoded' : 
            self.params = parse_qs(self.body)
        else :
            self.body = ''

        #print(length, ctype, self.body, self.params)




# Instanciation et lancement du serveur :
httpd = socketserver.TCPServer(("", 8081), RequestHandler)
httpd.serve_forever()
