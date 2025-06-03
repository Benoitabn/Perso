// Gestionnaire d'événement pour le chargement du DOM
document.addEventListener('DOMContentLoaded', function () {

    // Gestion du changement de sélection de la serre
    document.getElementById('lstSerre').addEventListener('change', function () {
        var serreId = this.value; // Récupère l'ID de la serre sélectionnée
        if (serreId) {
            fetch('getChapelles.php?serre_id=' + serreId) // Appel pour récupérer les chapelles de la serre
                .then(response => response.json()) // Conversion en JSON
                .then(chapelles => {
                    var chapelleSelect = document.getElementById('lstChapelle'); // Sélecteur de chapelle
                    chapelleSelect.innerHTML = '<option value="">-- Sélectionnez une chapelle --</option>'; // Réinitialisation
                    chapelles.forEach(chapelle => {
                        chapelleSelect.innerHTML += '<option value="' + chapelle.IdChapelle + '">' + chapelle.Nom + '</option>'; // Ajoute les options
                    });
                    document.getElementById('lstCarte').innerHTML = '<option value="">-- Sélectionnez une carte --</option>'; // Reset carte
                    document.getElementById('lstCapteur').innerHTML = '<option value="">-- Sélectionnez un capteur --</option>'; // Reset capteur
                    document.getElementById('lstChapelle').removeAttribute('disabled'); // Active chapelle
                    document.getElementById('lstCarte').setAttribute('disabled', true); // Désactive carte
                    document.getElementById('lstCapteur').setAttribute('disabled', true); // Désactive capteur
                });
        } else {
            document.getElementById('lstChapelle').innerHTML = '<option value="">-- Sélectionnez une chapelle --</option>'; // Reset chapelle
            document.getElementById('lstCarte').innerHTML = '<option value="">-- Sélectionnez une carte --</option>'; // Reset carte
            document.getElementById('lstCapteur').innerHTML = '<option value="">-- Sélectionnez un capteur --</option>'; // Reset capteur
            document.getElementById('lstChapelle').setAttribute('disabled', true); // Désactive chapelle
            document.getElementById('lstCarte').setAttribute('disabled', true); // Désactive carte
            document.getElementById('lstCapteur').setAttribute('disabled', true); // Désactive capteur
        }
    });

    // Changement de chapelle
    document.getElementById('lstChapelle').addEventListener('change', function () {
        var chapelleId = this.value; // Récupère l'ID chapelle
        if (chapelleId) {
            fetch('getCartes.php?chapelle_id=' + chapelleId) // Récupère les cartes
                .then(response => response.json()) // Convertit JSON
                .then(cartes => {
                    var carteSelect = document.getElementById('lstCarte'); // Sélecteur carte
                    carteSelect.innerHTML = '<option value="">-- Sélectionnez une carte --</option>'; // Réinit
                    cartes.forEach(carte => {
                        carteSelect.innerHTML += '<option value="' + carte.DevEui + '">' + carte.Nom + '</option>'; // Ajoute options
                    });
                    document.getElementById('lstCapteur').innerHTML = '<option value="">-- Sélectionnez un capteur --</option>'; // Réinit capteurs
                    document.getElementById('lstCarte').removeAttribute('disabled'); // Active carte
                    document.getElementById('lstCapteur').setAttribute('disabled', true); // Désactive capteur
                });
        } else {
            document.getElementById('lstCarte').innerHTML = '<option value="">-- Sélectionnez une carte --</option>'; // Réinit carte
            document.getElementById('lstCapteur').innerHTML = '<option value="">-- Sélectionnez un capteur --</option>'; // Réinit capteur
            document.getElementById('lstCarte').setAttribute('disabled', true); // Désactive carte
            document.getElementById('lstCapteur').setAttribute('disabled', true); // Désactive capteur
        }
    });

    // Changement de carte
    document.getElementById('lstCarte').addEventListener('change', function () {
        var carteId = this.value; // Récupère ID carte
        if (carteId) {
            fetch('getCapteurs.php?carte_id=' + carteId) // Appel pour capteurs
                .then(response => response.json()) // JSON
                .then(capteurs => {
                    var capteurSelect = document.getElementById('lstCapteur'); // Sélecteur capteur
                    capteurSelect.innerHTML = '<option value="">Sélectionnez un capteur</option>'; // Réinit
                    capteurs.forEach(capteur => {
                        capteurSelect.innerHTML += '<option value="' + capteur.IdCapteur + '">' + capteur.Nom + '</option>'; // Ajoute options
                    });
                    document.getElementById('lstCapteur').removeAttribute('disabled'); // Active capteur
                });
        } else {
            document.getElementById('lstCapteur').innerHTML = '<option value="">-- Sélectionnez un capteur --</option>'; // Réinit capteur
            document.getElementById('lstCapteur').setAttribute('disabled', true); // Désactive
        }
    });

    // Changement de capteur = mise à jour graphique
    document.getElementById('lstCapteur').addEventListener('change', function () {
        const capteurId = this.value; // ID capteur
        const startDate = document.getElementById('startDate').value; // Date début
        const startTime = document.getElementById('startTime').value; // Heure début
        const endDate = document.getElementById('endDate').value; // Date fin
        const endTime = document.getElementById('endTime').value; // Heure fin
        updateChart(capteurId, document.getElementById('monGraphique'), startDate, startTime, endDate, endTime); // MAJ graphique
    });

    // Ouverture de la modale d'ajout
    document.getElementById('ajoutCourbe').addEventListener('click', function () {
        synchroniserPlageTemporelleAjout(); // Copie la plage
        document.getElementById('ajoutCourbeDiv').style.display = 'block'; // Affiche modale
    });

    // Fermeture modale d'ajout
    document.getElementById('closeAjoutCourbe').addEventListener('click', function () {
        document.getElementById('ajoutCourbeDiv').style.display = 'none'; // Cache modale
        const backdrop = document.getElementById('ajoutCourbeBackdrop'); // Fond si présent
        if (backdrop) backdrop.remove(); // Supprime fond
    });

    // Validation ajout courbe
    document.getElementById('validerAjoutCourbe').addEventListener('click', function () {
        if (document.getElementById('synchroPlageAjout').checked) synchroniserPlageTemporelleAjout(); // Si synchro activée
        var capteurId = document.getElementById('lstCapteurAjout').value; // ID capteur
        const startDate = document.getElementById('startDateAjout').value; // Date début
        const startTime = document.getElementById('startTimeAjout').value; // Heure début
        const endDate = document.getElementById('endDateAjout').value; // Date fin
        const endTime = document.getElementById('endTimeAjout').value; // Heure fin
        const plage = `${startDate} ${startTime} -> ${endDate} ${endTime}`; // Plage textuelle
        ajouterDonneesCourbe(capteurId); // Ajout courbe
        document.getElementById('ajoutCourbeDiv').style.display = 'none'; // Ferme modale
        const backdrop = document.getElementById('ajoutCourbeBackdrop'); // Fond
        if (backdrop) backdrop.remove(); // Supprime fond
    });

    definirPlageTemporelleParDefaut(); // Définit valeurs plage par défaut

    var serreIdParDefaut = 1; // ID par défaut serre
    var chapelleIdParDefaut = 1; // Chapelle
    var carteDevEuiParDefaut = "0004a30b00216c4c"; // Carte
    var capteurIdParDefaut = 1; // Capteur

    // Sélection par défaut en cascade
    selectionnerParDefaut('lstSerre', serreIdParDefaut, function () {
        setTimeout(function () {
            selectionnerParDefaut('lstChapelle', chapelleIdParDefaut, function () {
                setTimeout(function () {
                    selectionnerParDefaut('lstCarte', carteDevEuiParDefaut, function () {
                        setTimeout(function () {
                            selectionnerParDefaut('lstCapteur', capteurIdParDefaut); // Fin cascade
                        }, 100);
                    });
                }, 100);
            });
        }, 100);
    });

    // Ouverture modale suppression
    document.getElementById('supprimerCourbe').addEventListener('click', function () {
        if (graphiquesAjoutes.length < 1) {
            alert("Il ne reste que le graphique principal. Vous ne pouvez pas le supprimer."); // Empêche suppression du principal
            return;
        }
        const liste = document.getElementById('listeGraphiquesASupprimer'); // Liste déroulante
        liste.innerHTML = '<option value="">-- Sélectionner un graphique --</option>'; // Reset options
        graphiquesAjoutes.forEach((graph, index) => {
            const option = document.createElement('option'); // Crée option
            option.value = index; // Index
            option.textContent = `Graphique ${index + 2} – Capteur ${graph.capteurId} (${graph.plage})`; // Libellé
            liste.appendChild(option); // Ajoute
        });
        document.getElementById('suppressionCourbeDiv').style.display = 'block'; // Affiche modale
    });

    // Annule suppression
    document.getElementById('annulerSuppressionGraphique').addEventListener('click', function () {
        document.getElementById('suppressionCourbeDiv').style.display = 'none'; // Cache modale
    });

    // Ferme la modale suppression
    document.getElementById('closeSuppressionCourbe').addEventListener('click', function () {
        document.getElementById('suppressionCourbeDiv').style.display = 'none'; // Cache modale
    });

    // Confirme suppression graphique
    document.getElementById('confirmerSuppressionGraphique').addEventListener('click', function () {
        const index = document.getElementById('listeGraphiquesASupprimer').value; // Index sélectionné
        if (index === "") return; // Rien sélectionné
        const graphique = graphiquesAjoutes[index]; // Données du graphique
        const capteurId = graphique.capteurId; // ID capteur
        const plage = graphique.plage; // Plage horaire
        const blocs = document.querySelectorAll('.graphiqueSecondaire'); // Tous les blocs secondaires
        blocs.forEach(bloc => {
            if (bloc.getAttribute('data-capteur-id') === capteurId && bloc.getAttribute('data-plage') === plage) {
                const canvas = bloc.querySelector('canvas'); // Canvas
                if (canvas && canvas.myChart) canvas.myChart.destroy(); // Détruit le graphique
                bloc.remove(); // Supprime le bloc
            }
        });
        const numeroGraphique = parseInt(index) + 2; // Numéro visuel
        const blocInfo = document.getElementById(`blocGraphique${numeroGraphique}`); // Bloc info
        if (blocInfo) blocInfo.remove(); // Supprime info
        let i = numeroGraphique + 1; // Boucle de décalage
        while (true) {
            const suivant = document.getElementById(`blocGraphique${i}`); // Bloc suivant
            if (!suivant) break; // Fin
            suivant.id = `blocGraphique${i - 1}`; // Change ID
            const titre = suivant.querySelector('strong'); // Titre
            if (titre) titre.textContent = `— Données Graphique ${i - 1} —`; // MAJ titre
            i++;
        }
        graphiquesAjoutes.splice(index, 1); // Supprime de la liste
        document.getElementById('suppressionCourbeDiv').style.display = 'none'; // Ferme modale
        const encoreSecondaires = document.querySelectorAll('.graphiqueSecondaire'); // Vérifie restants
        if (encoreSecondaires.length === 0) {
            const principal = document.getElementById('Graphique'); // Bloc principal
            principal.classList.remove('graphiqueMoitié'); // Plein écran
            principal.classList.add('graphiquePlein'); // Plein écran
        }
    });

    const synchroCheckbox = document.getElementById('synchroPlageAjout'); // Checkbox synchro
    if (synchroCheckbox) {
        synchroCheckbox.addEventListener('change', function () {
            const disabled = this.checked; // Vérifie état
            document.getElementById('startDateAjout').disabled = disabled; // Active/désactive
            document.getElementById('startTimeAjout').disabled = disabled;
            document.getElementById('endDateAjout').disabled = disabled;
            document.getElementById('endTimeAjout').disabled = disabled;
            if (disabled) synchroniserPlageTemporelleAjout(); // MAJ si synchro
        });
    }

    gererSelectionSerreAjout('lstSerreAjout', 'lstChapelleAjout', 'lstCarteAjout', 'lstCapteurAjout'); // Cascade pour ajout

    document.getElementById('closePlageMain').addEventListener('click', function () {
        document.getElementById('model').style.display = 'none'; // Ferme modale plage
    });

    // Mode sombre
    const modeIcon = document.getElementById('modeIcon'); // Icône
    const body = document.body; // Corps

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode'); // Applique thème sombre
        modeIcon.src = '../img/soleil.svg'; // Change icône
        modeIcon.title = 'Mode clair'; // Change tooltip
    }

    document.getElementById('modeIcon').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode'); // Alterne le thème
        const modeIcon = document.getElementById('modeIcon'); // Récupère icône
        const isDark = document.body.classList.contains('dark-mode'); // Vérifie mode
        modeIcon.src = isDark ? '../img/soleil.svg' : '../img/lune.svg'; // Icône
        modeIcon.title = isDark ? 'Mode clair' : 'Mode sombre'; // Tooltip
        modeIcon.alt = isDark ? 'Mode sombre' : 'Mode clair'; // Alt
        rafraichirCouleursGraphiques(); // MAJ couleurs
    });

});

const graphiquesAjoutes = []; // Tableau des courbes secondaires