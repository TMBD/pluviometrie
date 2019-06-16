document.getElementById("loading_container").style.display = 'none';
document.getElementById("regions_selected_div").style.display = 'none';
document.getElementById('region_selected_1').style.display = 'none';
document.getElementById('region_selected_2').style.display = 'none';
document.getElementById('region_selected_3').style.display = 'none';
//$("#parms_div_error").hide();
// document.getElementById("graphique_img").style.display = 'none';
// document.getElementById("loading_container").style.display = 'block';
// Création d'une carte dans la balise <div id="map">, positionne la vue sur Lyon et définit le niveau de zoom
var map = L.map('map').setView([45.775, 4.83], 10);

// Ajout d'une couche de dalles OpenStreetMap
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var markers = new Array(); // Création de la liste des marqueurs positionnant les stations

var selecteur = document.getElementById("select_station"); // Récupération de l'emplacement de la liste déroulante

var stations_names = [];
var listStationsChoices = [0, 0, 0];

function load_data() {
    animTitle();
    var xhr = new XMLHttpRequest();

    xhr.onload = function() { // fonction callback
        if (this.status == 200) {
            // Récupération des données renvoyées par le serveur
            var data = JSON.parse(this.responseText);

            //var selecteur = document.getElementById("select_station"); // Récupération de l'emplacement de la liste déroulante
            // Boucle parcourant les enregistrements renvoyés par le serveur
            for (n = 0; n < data.length; n++) {
                stations_names.push(data[n].nom);
                // Texte descriptif de la station
                var texte = '<h2> <b>Station : ' + data[n].nom + '</b> </h2>' +
                    '<b>Adresse :</b> ' + data[n].adresse +
                    '<br><b>Propriétaires :</b> ' + data[n].proprietaires +
                    '<br><b>Date de mise en service :</b> ' + data[n].dateMS +
                    '<br><b>Date de mise hors service :</b> ' + data[n].dateHS +
                    '<br><b>Altitude :</b> ' + data[n].zsol + ' m' +
                    '<br><b>Appartient au Grand Lyon ? :</b> ' + data[n].appartenance +
                    '<br><b>Identifiant : </b>' + data[n].identifiant;

                // Création d'un marqueur aux coordonnées données et ajout d'un titre (s'affichant en survolant le marqueur)
                var LamMarker = new L.marker([data[n].longitude, data[n].latitude], {
                    title: 'Station ' + data[n].nom
                });

                // Ajout au marqueur d'une popup, d'un évenement (clic sur marqueur) et d'un paramètre
                LamMarker.bindPopup('<h2> <b>Station : ' + data[n].nom + '</b> </h2>' +
                        '<b>Adresse :</b> ' + data[n].adresse +
                        '<br><b>Propriétaires :</b> ' + data[n].proprietaires +
                        '<br><b>Identifiant : </b>' + data[n].identifiant)
                    .addEventListener('click', OnMarkerClick)
                    .infos = [data[n].gid, data[n].identifiant, texte]; // propriété personnalisée ajouté au marqueur

                markers.push(LamMarker); // Ajout du marqueur à la liste
                map.addLayer(markers[n]); // Création d'un layer contenant le marqueur

                // Par défaut, sélectionne la première station dans la liste déroulante des stations (cf. formulaire)
                if (data[n].gid == 1) {
                    SelectionStation(data[n].gid);
                }

                // Ajout des stations à la liste déroulante des stations (cf. formulaire)
                //var selecteur = document.getElementById("select_station"); // Récupération de l'emplacement de la liste déroulante
                var option = document.createElement("option"); // Création d'une nouvelle option
                option.text = data[n].gid + ' - ' + data[n].nom; // Ajout d'un texte à l'option (ex : "1 - SAINT GERMAIN")
                option.setAttribute("onclick", "SelectionStation(" + data[n].gid + ");"); // Ajout d'un évènement (clic sur option)
                selecteur.add(option, selecteur[-1]); // Ajout de l'option à la suite des précédentes

            }

            selecteur.setAttribute("onclick", "SelectionStationE(event);"); // Ajout d'un évènement (clic sur option)

        } else {
            //alert("Un problème inatendu est survenu, veuillez ressayer");

            displayError("Un problème inatendu est survenu, veuillez ressayer", "parms_div_error");
        }
    };
    //Envoi de la requete XHR
    xhr.open('GET', '/location', true);
    xhr.send();
}

//console.log(stations_names);

function SelectionStation(valeur_gid) {
    // Parcours de la liste des marqueurs
    for (i = 0; i < markers.length; i++) {
        if (i + 1 == valeur_gid) {
            markers[i].openPopup(); // Ouverture de la popup associée
            break; // On sort de la boucle
        }
    }
    // Remplacement du contenu de la balise <p id="description"> par le contenu de la popup
    description.innerHTML = markers[i].infos[2];
}

function SelectionStationE(e) {
    valeur_gid = e.target.value.split(" - ")[0];
    //console.log("SelectionStation -> " + e.target.value.split(" - ")[0]);
    // Parcours de la liste des marqueurs
    for (i = 0; i < markers.length; i++) {
        if (i + 1 == valeur_gid) {
            markers[i].openPopup(); // Ouverture de la popup associée
            //console.log(i + " = i");
            break; // On sort de la boucle
        }
    }
    // Remplacement du contenu de la balise <p id="description"> par le contenu de la popup
    description.innerHTML = markers[i].infos[2];
    console.log(valeur_gid);
    manageSelectedItem(valeur_gid);
}


//Fonction appelée lors du clique sur une station (dans la carte) pour mettre à jour la liste déroulante
//et la description de la station (seul ces deux éléments changent dans ce cas)
function OnMarkerClick(e) {
    // Sélection de la station (sur laquelle on a cliqué) dans la liste déroulante du formulaire
    document.getElementById("select_station").options.selectedIndex = e.target.infos[0] - 1;

    description.innerHTML = e.target.infos[2];
    //console.log(e.target.infos[0]);
    manageSelectedItem(e.target.infos[0]);
}

////////////////////// CALCULE DES GRAPHS ///////////////////////////////

//on rend les champs rouges lorsqu'ils ne sont pas bien saisi
document.getElementById("date_debut").onkeyup = VerificationDateDebut;
document.getElementById("date_fin").onkeyup = VerificationDateFin;
document.getElementById("heure_debut").onkeyup = VerificationHeureDebut;
document.getElementById("heure_fin").onkeyup = VerificationHeureFin;
document.getElementById("valeur_pas").onkeyup = VerificationValeurPas;

function AfficherGraphe() {
    var resultat = VerificationFormulaire();
    if (!resultat) {
        // il y a une erreur dans les valeurs entrées par l'utilisateur
        return false;
    }

    document.getElementById("boutonAfficher").disabled = true;
    document.getElementById("boutonAfficher").value = "Chargement ...";
    document.getElementById("boutonAfficher").setAttribute("class", "button buttonLoad");
    document.getElementById("graphique_img").style.display = 'none';
    document.getElementById("loading_container").style.display = 'block';

    // Si les valeurs sont correctes : on récupère les variables et on affiche le graphique
    var myForm = document.forms["formulaire"]
        //var nom_station = myForm["select_station"].value;
    var nom_station = "";
    if (document.getElementById('croisement').checked && listStationsChoices[1] != 0) {
        nom_station = listStationsChoices[0] + "_" + listStationsChoices[1];
        if (listStationsChoices[2] != 0)
            nom_station = nom_station + "_" + listStationsChoices[2];
    } else {
        nom_station = document.getElementById("select_station").value.split(" - ")[0];
    }

    var datedeb = myForm["date_debut"].value;
    var heuredeb = myForm["heure_debut"].value;
    var datefin = myForm["date_fin"].value;
    var heurefin = myForm["heure_fin"].value;
    var pas = myForm["valeur_pas"].value;
    var unite = myForm["unite_pas"].value;

    var pas_minutes = +pas * +unite;

    var xhr = new XMLHttpRequest();
    try{

        //Lorsque le status de la requete change
        xhr.onreadystatechange = function() {
            console.log("onreadystatechange ");
            // document.getElementById("graphique_img").style.display = 'block';
            // document.getElementById("loading_container").style.display = 'none';
            console.log("this.status = "+this.status);
            xhr.onerror = function() {
                console.log("juste onerror ");
                    document.getElementById("graphique_img").style.display = 'block';
                    document.getElementById("loading_container").style.display = 'none';
                    displayError("Un problème inatendu est survenu, veuillez ressayer", "parms_div_error");
                    document.getElementById("graphique_img").setAttribute("src", "./img/graphs/1_02_01_2011_00_00_30_10_2016_23_59_6.png");
                    document.getElementById("boutonAfficher").disabled = false;
                    document.getElementById("boutonAfficher").value = "Afficher";
                    document.getElementById("boutonAfficher").setAttribute("class", "button buttonShow");
                    console.log("after onerror ");
            }
            xhr.onload = function() {
                console.log("onload ");
                if (this.status === 200) {
                    
                    console.log("this.status === 200");
                    document.getElementById("graphique_img").style.display = 'block';
                    document.getElementById("loading_container").style.display = 'none';
                    var data = JSON.parse(this.responseText); // Récupération des données renvoyées par le serveur
                    // Modification de l'adresse de l'image contenue dans la balise <div id="graphique"> :
                    //console.log(data[0].nom_image_new)
        
                    document.getElementById("graphique_img").setAttribute("src", data[0].nom_image_new);
                    document.getElementById("pluvio_min").innerHTML = data[0].mini + ' mm';
                    document.getElementById("pluvio_max").innerHTML = data[0].maxi + ' mm';
                    document.getElementById("pluvio_moyenne").innerHTML = data[0].moyenne + ' mm';
                    document.getElementById("pluvio_ecart_type").innerHTML = data[0].ecart_type;
        
                    document.getElementById("boutonAfficher").disabled = false;
                    document.getElementById("boutonAfficher").value = "Afficher";
                    document.getElementById("boutonAfficher").setAttribute("class", "button buttonShow");
                    
                } else {
                    console.log("this.status != 200");
                    //alert("Un problème inatendu est survenu, veuillez ressayer");
                    document.getElementById("graphique_img").style.display = 'block';
                    document.getElementById("loading_container").style.display = 'none';
                    displayError("Un problème inatendu est survenu, veuillez ressayer", "parms_div_error");
                    document.getElementById("graphique_img").setAttribute("src", "./img/graphs/1_02_01_2011_00_00_30_10_2016_23_59_6.png");
                    document.getElementById("boutonAfficher").disabled = false;
                    document.getElementById("boutonAfficher").value = "Afficher";
                    document.getElementById("boutonAfficher").setAttribute("class", "button buttonShow");
                }
            }
        };
        //console.log(nom_station)
        xhr.open('GET', '/date/' + nom_station + '/' +
            datedeb + '/' +
            heuredeb + '/' +
            datefin + '/' +
            heurefin + '/' +
            pas_minutes, true);
        console.log('before send');
        xhr.send();
        console.log('after send');


    }catch(e){
        console.log('catch', e);
        document.getElementById("graphique_img").style.display = 'block';
        document.getElementById("loading_container").style.display = 'none';
        document.getElementById("boutonAfficher").disabled = false;
        document.getElementById("boutonAfficher").value = "Afficher";
        document.getElementById("boutonAfficher").setAttribute("class", "button buttonShow");
        displayError("Un problème inatendu est survenu, veuillez ressayer", "parms_div_error");
        document.getElementById("graphique_img").setAttribute("src", "./img/graphs/1_02_01_2011_00_00_30_10_2016_23_59_6.png");
    }
    
}

//Remet à jour les valeur du formulaire
function ResetFormulaire() {
    document.getElementById("date_debut").value = "02-01-2011"
    document.getElementById("date_debut").setAttribute("class", "caseDate");
    document.getElementById("date_fin").value = "30-10-2016";
    document.getElementById("date_fin").setAttribute("class", "caseDate");
    document.getElementById("heure_debut").value = "00:00";
    document.getElementById("heure_debut").setAttribute("class", "caseHeure");
    document.getElementById("heure_fin").value = "23:59";
    document.getElementById("heure_fin").setAttribute("class", "caseHeure");
    document.getElementById("valeur_pas").value = "6";
    document.getElementById("valeur_pas").setAttribute("class", "casePas");
    document.getElementById("unite_pas").options.selectedIndex = "3";
}


var validerOnKeyUpAttached = false;

function VerificationFormulaire() {
    if (!VerificationOrdre()) {
        //alert("La date de début est postérieure à la date de fin");
        displayError("La date de début est postérieure à la date de fin", "parms_div_error");
    } else if (!VerificationLimitesDates()) {
        //alert("Nous n'avons pas de données recouvrant l'intégralité de cette période.\nVeuillez choisir des dates comprises entre le 02-01-2011 et le 30-10-2016");

        displayError("Nous n'avons pas de données recouvrant l'intégralité de cette période.</br>Veuillez choisir des dates comprises entre le 02-01-2011 et le 30-10-2016", "parms_div_error");
    } else if (!VerificationDiffPas()) {
        //var myForm = document.forms["formulaire"];
        var pastxt = document.forms["formulaire"]["valeur_pas"].value;
        if (isNaN(pastxt)) displayError("Le pas de temps doit être un entier !", "parms_div_error");
        //alert("Le pas de temps est supérieur à la différence entre la date de fin et la date de début");
        else displayError("Le pas de temps est supérieur à la différence entre la date de fin et la date de début", "parms_div_error");
    }

    return (VerificationDateDebut() &&
        VerificationDateFin() &&
        VerificationHeureDebut() &&
        VerificationHeureFin() &&
        VerificationValeurPas() &&
        VerificationOrdre() &&
        VerificationLimitesDates() &&
        VerificationDiffPas());
}


function VerificationDateDebut() {
    var resultat = VerificationDate("date_debut");
    if (resultat) {
        var classeDate = 'caseDate';
    } else {
        var classeDate = 'caseDateError';
    }
    document.getElementById("date_debut").setAttribute('class', classeDate);
    return resultat;
}


function VerificationDateFin() {
    var resultat = VerificationDate("date_fin");
    if (resultat) {
        var classeDate = 'caseDate';
    } else {
        var classeDate = 'caseDateError';
    }
    document.getElementById("date_fin").setAttribute('class', classeDate);
    return resultat;
}


function VerificationHeureDebut() {
    var resultat = VerificationHeure("heure_debut");
    if (resultat) {
        var classeHeure = 'caseHeure';
    } else {
        var classeHeure = 'caseHeureError';
    }
    document.getElementById("heure_debut").setAttribute('class', classeHeure);
    return resultat;
}


function VerificationHeureFin() {
    var resultat = VerificationHeure("heure_fin");
    if (resultat) {
        var classeHeure = 'caseHeure';
    } else {
        var classeHeure = 'caseHeureError';
    }
    document.getElementById("heure_fin").setAttribute('class', classeHeure);
    return resultat;
}


function VerificationOrdre() {
    var resultat = VerificationOrdreDates();
    return resultat;
}


function VerificationOrdreDates() {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var datedeb = myForm["date_debut"].value.split("-");
    var heuredeb = myForm["heure_debut"].value.split(":");
    var datefin = myForm["date_fin"].value.split("-");
    var heurefin = myForm["heure_fin"].value.split(":");

    if (+datedeb[2] > +datefin[2]) {
        // Erreur 'annee_deb > annee_fin'
        return false;
    }
    if (+datedeb[2] == +datefin[2]) {
        if (+datedeb[1] > +datefin[1]) {
            // Erreur 'annee_deb = annee_fin' et 'mois_deb > mois_fin'
            return false;
        }
        if (+datedeb[1] == +datefin[1]) {
            if (+datedeb[0] > +datefin[0]) {
                // Erreur 'annee_deb = annee_fin' et 'mois_deb = mois_fin' et 'jour_deb > jour_fin'
                return false;
            }
            if (+datedeb[0] == +datefin[0]) {
                if (+heuredeb[0] > +heurefin[0]) {
                    // Erreur 'heure_deb > heure_fin'
                    return false;
                }
                if (+heuredeb[0] == +heurefin[0]) {
                    if (+heuredeb[1] > +heurefin[1]) {
                        // Erreur 'minute_deb > minute_fin'
                        return false;
                    }
                    if (+heuredeb[1] == +heurefin[1]) {
                        // Erreur dates identiques
                        return false;
                    }
                }
            }
        }
    }
    // Les dates sont dans le bon ordre
    return true;
}


function VerificationDate(nom_case) {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var datetxt = myForm[nom_case].value; // Récupération de la valeur du champ
    if (datetxt.length == 10 && datetxt.match(/^[0-9-]+$/)) {
        // ie. la date ne contient que des chiffres et "-"
        date = datetxt.split("-"); // On sépare les différentes parties de la date
        if (date.length == 3) {
            // ie. la date est du format "jour-mois-annee"
            var jour = date[0];
            var mois = date[1];
            var annee = date[2];
            // Vérification des valeurs :
            if (jour.length == 2 && mois.length == 2 && annee.length == 4) {
                // ie. la date est au format "JJ-MM-AAAA"
                // conversion des chaînes de caractères en entiers :
                jour = +jour;
                mois = +mois;
                annee = +annee;
                if (jour > 0 && mois > 0 && mois < 13) {
                    if (mois == 2) {
                        // ie. mois de février
                        if ((annee % 4 == 0 && annee % 400 != 0) || annee % 100 == 0) {
                            // ie. année bissextile (le mois de février a 29 jours)
                            if (jour <= 29) {
                                return true;
                            }
                            // Pas OK : valeur 'jour' trop grande
                        } else {
                            // ie. année pas bissextile (le mois de février a 28 jours)
                            if (jour <= 28) {
                                return true;
                            }
                            // Pas OK : valeur 'jour' trop grande
                        }
                    } else {
                        if ((mois % 2 == 1 && mois <= 7) || (mois % 2 == 0 && mois >= 8)) {
                            // ie. le mois possède 31 jours
                            if (jour <= 31) {
                                return true;
                            }
                            // Pas OK : valeur 'jour' trop grande
                        } else {
                            // ie. le mois possède 30 jours
                            if (jour <= 30) {
                                return true;
                            }
                            // Pas OK : valeur 'jour' trop grande
                        }
                    }
                }
                // Pas OK : 'jour=0' ou 'mois=0' ou 'mois>=13'
            }
            // Pas OK : format de date non correct (pas 'JJ-MM-AAAA')
        }
        // Pas OK : date entrée incorrecte (ex: '12-06-15-2' ou '1206-15156')	
    }
    // Pas OK : date entrée contient des caractères incorrects (ie. pas chiffres ou "-") ou n'est pas de la bonne longueur
    return false;
}


function VerificationHeure(nom_case) {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var heuretxt = myForm[nom_case].value; // Récupération de la valeur du champ
    if (heuretxt.length == 5 && heuretxt.match(/^[0-9:]+$/)) {
        // ie. l'heure ne contient que des chiffres et ':'
        heure = heuretxt.split(':');
        if (heure.length == 2) {
            //ie heure au format 'heure:minutes'
            heures = heure[0];
            minutes = heure[1];
            if (heures.length == 2 && minutes.length == 2) {
                heures = +heures;
                minutes = +minutes;
                if (heures < 24 && minutes < 60) {
                    return true
                }
                // Pas OK : heure>=24 ou minutes>=60
            }
            // Pas OK : format d'heure non correct (ie. pas hh:mm)
        }
        // Pas OK : heure entrée incorrecte (ex: '123:6' ou '1:2:3')
    }
    // Pas OK : l'heure entrée contient des caractères autres que des chiffres ou ':'
    return false
}


function VerificationValeurPas() {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var pastxt = myForm["valeur_pas"].value; // Récupération de la valeur du champ
    var case_entree = document.getElementById("valeur_pas");
    if (pastxt.match(/^[0-9]+$/)) {
        // ie. l'entrée ne contient que des chiffres
        if (pastxt.length > 0) {
            pas = +pastxt;
            if (pas >= 1) {
                case_entree.setAttribute('class', 'casePas');
                return true
            }
            // Pas OK : la valeur entrée est nulle
        }
        // Pas OK : aucune valeur entrée
    }
    // Pas OK : le pas entré contient des caractères autres que des chiffres

    // Erreur valeur entrée => Mise en évidence de la case (contour+fond en rouge)
    case_entree.setAttribute('class', 'casePasError');
    return false
}

function VerificationDiffPas() {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var datedebtxt = myForm["date_debut"].value; // Récupération de la valeur du champ
    var datefintxt = myForm["date_fin"].value; // Récupération de la valeur du champ
    var heuredebtxt = myForm["heure_debut"].value; // Récupération de la valeur du champ
    var heurefintxt = myForm["heure_fin"].value; // Récupération de la valeur du champ
    var pastxt = myForm["valeur_pas"].value; // Récupération de la valeur du champ
    var unite = myForm["unite_pas"].value;

    if (isNaN(pastxt)) return false
    pas = +pastxt * +unite;
    heure1 = heuredebtxt.split(':');
    heure2 = heurefintxt.split(':');
    date1 = datedebtxt.split('-');
    date2 = datefintxt.split('-');

    if ((parseInt(date2[2]) * 365 * 24 * 60 + parseInt(date2[1]) * 43800 + parseInt(date2[0]) * 1440 + parseInt(heure2[0]) * 60 + parseInt(heure2[1])) - (parseInt(date1[2]) * 365 * 24 * 60 + parseInt(date1[1]) * 43800 + parseInt(date1[0]) * 1440 + parseInt(heure1[0]) * 60 + parseInt(heure1[1])) > pas) {
        return true
    }
    return false
}

function VerificationLimitesDates() {
    var myForm = document.forms["formulaire"]; // Récupération de l'emplacement du formulaire
    var datedeb = myForm["date_debut"].value.split("-");
    var datefin = myForm["date_fin"].value.split("-");

    if (+datedeb[2] < 2011 ||
        +datefin[2] > 2016 ||
        (+datefin[2] == 2016 && +datefin[1] > 10) ||
        (+datedeb[2] == 2011 && +datedeb[1] == 1 && +datedeb[0] == 1)) {
        return false;
    }
    return true;
}

function check_croisement() {
    var regions_selected_div = document.getElementById('regions_selected_div');
    if (document.getElementById('croisement').checked) {
        regions_selected_div.style.display = 'block'
    } else {
        document.getElementById('region_selected_1').style.display = 'none';
        document.getElementById('region_selected_2').style.display = 'none';
        document.getElementById('region_selected_3').style.display = 'none';
        listStationsChoices[0] = 0;
        listStationsChoices[1] = 0;
        listStationsChoices[2] = 0;
        regions_selected_div.style.display = 'none';
    }

}

function manageSelectedItem(valeur_gid) {

    if (document.getElementById('croisement').checked) {
        if (listStationsChoices[0] == 0) {
            listStationsChoices[0] = +valeur_gid
            document.getElementById("region_selected_1").innerHTML = stations_names[+valeur_gid - 1];
            document.getElementById('region_selected_1').style.display = 'list-item';
        } else if ((listStationsChoices[1] == 0) && (+valeur_gid != listStationsChoices[0])) {
            listStationsChoices[1] = +valeur_gid
            document.getElementById("region_selected_2").innerHTML = stations_names[+valeur_gid - 1];
            document.getElementById('region_selected_2').style.display = 'list-item';
        } else if ((+valeur_gid != listStationsChoices[0]) && (+valeur_gid != listStationsChoices[1])) {
            listStationsChoices[2] = +valeur_gid
            document.getElementById("region_selected_3").innerHTML = stations_names[+valeur_gid - 1];
            document.getElementById('region_selected_3').style.display = 'list-item';
        }
    }
}


function displayError(message, element) {
    document.getElementById(element).innerHTML = message;
    $("#" + element).slideDown(1000).delay(5000).fadeOut(2000);
    //$("div.alert").show("slow").delay(4000).hide("slow");
    return false;
};



///////////////////////////////////////////////////////////////////////////////////////////::

$(function() {
    var dateFormat = "dd-mm-yy",
        from = $("#date_debut")
        .datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 1,
            changeYear: true,
            dateFormat: "dd-mm-yy",
            minDate: new Date(2011, 0, 2),
            maxDate: new Date(2016, 9, 30),
            showAnim: "drop",
        })
        .on("change", function() {
            startDate = getDate(this)
            to.datepicker("option", "minDate", getDate(this));
            // $("#date_fin").val(startDate);
            // $("#date_fin").datepicker("option", {
            //     minDate: startDate
            // })
            //var dFormat = $(this).datepicker("option", "dateFormat");
            console.log(startDate)
        }),
        to = $("#date_fin")
        .datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 1,
            changeYear: true,
            dateFormat: "dd-mm-yy",
            // minDate: new Date(2011, 0, 2),
            maxDate: new Date(2016, 9, 30),
            showAnim: "drop",
        })
        .on("change", function() {
            from.datepicker("option", "maxDate", getDate(this));
        });

    function getDate(element) {
        var date;
        try {
            date = $.datepicker.parseDate(dateFormat, element.value);
            //console.log(element.value);
            //date = $.datepicker.parseDate(dateFormat, element.value);
        } catch (error) {
            date = null;
        }

        return date;
    }
});


hTitle = document.getElementById("titre");
var titleArray = Array.from("Pluviométrie du Grand Lyon");
letterPosition = 0;
numberOfAnimation = 2;

var smallDisplayIntervalle = null;
var displayIntervalle = setInterval(animTitle, titleArray.length * 100 + 1000 + 5000 + 1000);

function animTitle() {
    //console.log("grand");
    hTitle.innerHTML = " ";
    $("#titre").show();
    smallDisplayIntervalle = setInterval(smallAnimTitle, 100);
    
    
    if(numberOfAnimation>0){
        $("#titre").delay(titleArray.length * 100 + 1000).fadeOut(5000);
    //     hTitle.innerHTML = "Pluviométrie du Grand Lyon";
    //     $("#titre").show();
    }

}



function smallAnimTitle() {
    hTitle.innerHTML += titleArray[letterPosition];
    letterPosition++;
    if (letterPosition >= titleArray.length) {
        clearInterval(smallDisplayIntervalle);
        letterPosition = 0;
        numberOfAnimation--;
        if(numberOfAnimation<=0){
            clearInterval(displayIntervalle);
            hTitle.innerHTML = "Pluviométrie du Grand Lyon";
            $("#titre").delay(titleArray.length * 100 + 1000).show(1000);
            //console.log("interieur");
        }
    }
    //console.log("petit");
    //console.log(titleArray)
    // for (i = 0; i < titleArray.length; i++) {
    //     setTimeout(function(i) {
    //         console.log(i)
    //         hTitle.innerHTML += titleArray[i];
    //     }, 1000);
    // }

}
