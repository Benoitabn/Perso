// Fonctions.js optimisé et commenté ligne par ligne

// --- Gestion des modales ---
function ouvertureModel() {
    document.getElementById('model').style.display = 'block'; // Affiche la modale de sélection temporelle principale
}

function fermetureModel() {
    document.getElementById('model').style.display = 'none'; // Cache la modale de sélection temporelle principale
}

function ouvertureModelAjout() {
    document.getElementById('model').style.display = 'block'; // Réutilisé pour affichage modale ajout (inutile car identique à ouvertureModel)
}

// --- Récupération des mesures depuis le serveur ---
function getMesures(capteurId, startDate = null, startTime = null, endDate = null, endTime = null) {
    let url = `getMesures.php?capteur_id=${capteurId}`; // Base de l'URL pour récupérer les mesures du capteur
    if (startDate && startTime && endDate && endTime) {
        url += `&startDate=${startDate}&startTime=${startTime}&endDate=${endDate}&endTime=${endTime}`; // Ajout des bornes temporelles si définies
    }
    return fetch(url).then(response => response.json()); // Requête et transformation JSON
}

// --- Mise à jour du graphique principal ---
function updateChart(capteurId, canvas, startDate = null, startTime = null, endDate = null, endTime = null) {
    if (!capteurId) return console.warn("Aucun capteur sélectionné."); // Vérifie qu'un capteur est sélectionné

    fetch(`getCapteurInfo.php?capteur_id=${capteurId}`) // Récupère les infos du capteur
        .then(res => res.json())
        .then(capteurInfo => {
            const { GrandeurCapt: grandeur, Unite: unite } = capteurInfo; // Récupère les infos utiles
            getMesures(capteurId, startDate, startTime, endDate, endTime).then(data => {
                if (!Array.isArray(data.mesures)) return console.error("Données invalides :", data); // Vérifie le format
                const labels = data.mesures.map(m => m.Horodatage); // Horodatages
                const values = data.mesures.map(m => parseFloat(parseFloat(m.Valeur).toFixed(1))); // Valeurs arrondies à 1 décimale

                renderChart(canvas, labels, [{
                    label: grandeur === "Direction du vent" ? grandeur : `${grandeur} (${unite})`,
                    data: values,
                    borderColor: 'rgb(231, 57, 57)',
                    tension: 0.1
                }], unite);

                updateInfoGraphique(values, unite, capteurId, 1, grandeur); // Met à jour les infos
            });
        });
}

// --- Création / mise à jour d’un graphique Chart.js ---
function renderChart(canvas, labels, datasets, unite, grandeur = null) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = null; // Réinitialise les dimensions
    if (canvas.myChart) canvas.myChart.destroy(); // Détruit l'ancien graphique s'il existe

    if (grandeur) canvas.setAttribute('data-grandeur', grandeur); // Ajoute l'attribut grandeur au canvas
    const isDark = document.body.classList.contains('dark-mode'); // Détecte le mode sombre

    canvas.myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: unite, color: isDark ? '#fff' : '#000' },
                    ticks: { color: isDark ? '#fff' : '#000' },
                    grid: { color: isDark ? '#555' : '#e0e0e0' }
                },
                x: {
                    ticks: { color: isDark ? '#fff' : '#000' },
                    grid: { color: isDark ? '#555' : '#e0e0e0' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: { family: 'Arial', size: 12 },
                        color: isDark ? '#fff' : '#000'
                    }
                }
            }
        }
    });
}

// --- Mise à jour des infos min/max/moy/actuelle ---
function updateInfoGraphique(values, unite, capteurId = null, numeroGraphique = 1, grandeur = null) {
    const infoDiv = document.getElementById('infoGraphique');
    if (!infoDiv) return;

    const ancienBloc = document.getElementById(`blocGraphique${numeroGraphique}`);
    if (ancienBloc) ancienBloc.remove(); // Supprime le précédent bloc si existant

    const bloc = document.createElement('div');
    bloc.id = `blocGraphique${numeroGraphique}`;
    bloc.className = 'blocInfoGraphique';
    bloc.innerHTML = `<strong>— Données Graphique ${numeroGraphique} —</strong><br>`;

    if (values && values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const moyenne = values.reduce((acc, val) => acc + val, 0) / values.length;

        if (grandeur === "Direction du vent" || unite === "°") {
            Promise.all([
                fetch(`getDirectionVent.php?angle=${values.at(-1)}`).then(r => r.json()),
                fetch(`getDirectionVent.php?angle=${min}`).then(r => r.json()),
                fetch(`getDirectionVent.php?angle=${max}`).then(r => r.json()),
                fetch(`getDirectionVent.php?angle=${moyenne}`).then(r => r.json())
            ]).then(([actuelle, minDir, maxDir, moyenneDir]) => {
                bloc.innerHTML += `
                    <span>Actuelle : ${values.at(-1).toFixed(1)}° (${actuelle.direction})</span><br>
                    <span>Minimum (plage) : ${min.toFixed(1)}° (${minDir.direction})</span><br>
                    <span>Maximum (plage) : ${max.toFixed(1)}° (${maxDir.direction})</span><br>
                    <span>Moyenne (plage) : ${moyenne.toFixed(1)}° (${moyenneDir.direction})</span><br><br>
                `;
            });
        } else {
            bloc.innerHTML += `
                <span class="valActuelle">Actuelle : ...</span><br>
                <span>Minimum (plage) : ${min.toFixed(1)} ${unite}</span><br>
                <span>Maximum (plage) : ${max.toFixed(1)} ${unite}</span><br>
                <span>Moyenne (plage) : ${moyenne.toFixed(1)} ${unite}</span><br><br>
            `;
        }
    } else {
        bloc.innerHTML += `<span>Aucune donnée à afficher pour cette plage.</span><br><br>`;
    }

    infoDiv.appendChild(bloc);

    // Met à jour la valeur actuelle en asynchrone
    if (capteurId) {
        fetch(`getDerniereMesure.php?capteur_id=${capteurId}`)
            .then(res => res.json())
            .then(data => {
                const span = bloc.querySelector('.valActuelle');
                span.textContent = data && data.Valeur ? `Actuelle : ${parseFloat(data.Valeur).toFixed(1)} ${unite}` : "Actuelle : non disponible";
            })
            .catch(() => {
                const span = bloc.querySelector('.valActuelle');
                if (span) span.textContent = "Actuelle : erreur";
            });
    }
}

// --- Définir plage par défaut : hier -> maintenant ---
function definirPlageTemporelleParDefaut() {
    const maintenant = new Date();
    const debut = new Date(maintenant);
    debut.setDate(debut.getDate() - 1);

    document.getElementById('startDate').value = debut.toISOString().slice(0, 10);
    document.getElementById('startTime').value = debut.toTimeString().slice(0, 5);
    document.getElementById('endDate').value = maintenant.toISOString().slice(0, 10);
    document.getElementById('endTime').value = maintenant.toTimeString().slice(0, 5);

    updateChartWithTimeRange(); // Charge les données avec la plage définie
}

// --- Met à jour le graphique avec la plage sélectionnée ---
function updateChartWithTimeRange() {
    const capteurId = document.getElementById('lstCapteur').value;
    const startDateValue = document.getElementById('startDate').value;
    const startTimeValue = document.getElementById('startTime').value;
    const endDateValue = document.getElementById('endDate').value;
    const endTimeValue = document.getElementById('endTime').value;

    // Vérifier que les dates et heures ne sont pas vides
    if (!startDateValue || !startTimeValue || !endDateValue || !endTimeValue) {
        alert("Veuillez sélectionner une date et une heure de début et de fin.");
        return; // Empêche la fermeture de la modale et la mise à jour du graphique
    }

    const startDateTime = new Date(startDateValue + 'T' + startTimeValue);
    const endDateTime = new Date(endDateValue + 'T' + endTimeValue);

    if (startDateTime >= endDateTime) {
        alert("La date de début ne peut pas être après ou égale à la date de fin. Veuillez corriger la sélection.");
        return; // Empêche la fermeture de la modale et la mise à jour du graphique
    }

    updateChart(capteurId, document.getElementById('monGraphique'), startDateValue, startTimeValue, endDateValue, endTimeValue);
    fermetureModel(); // Ferme la modale uniquement si la validation est réussie
}

// --- Génériques de gestion des select ---
function remplirSelect(selectId, options, valueKey, labelKey) {
    const select = document.getElementById(selectId); // Récupère le select
    select.innerHTML = '<option value="">-- Sélectionnez --</option>'; // Réinitialise avec une option par défaut
    options.forEach(item => {
        const option = document.createElement('option'); // Crée une nouvelle option
        option.value = item[valueKey]; // Définit la valeur
        option.textContent = item[labelKey]; // Définit le texte affiché
        select.appendChild(option); // Ajoute l’option au select
    });
}

function reinitialiserSelects(ids) {
    ids.forEach(id => {
        const select = document.getElementById(id); // Récupère le select
        if (select) select.innerHTML = '<option value="">-- Sélectionnez --</option>'; // Le vide avec l’option par défaut
    });
}

function selectionnerParDefaut(selectId, valeurParDefaut, callback = null) {
    const select = document.getElementById(selectId); // Récupère le select
    if (!select) return; // Sort si le select n’existe pas

    const option = Array.from(select.options).find(opt => opt.value == valeurParDefaut); // Trouve l’option par défaut
    if (option) {
        option.selected = true; // La sélectionne
        const event = new Event('change'); // Crée un événement de changement
        select.dispatchEvent(event); // Le déclenche

        if (typeof callback === 'function') callback(100); // Appelle le callback si défini
    }
}

function activerSelect(id) {
    const select = document.getElementById(id); // Récupère le select
    if (select) select.removeAttribute('disabled'); // Active le select
}

function desactiverSelects(ids) {
    ids.forEach(id => {
        const select = document.getElementById(id); // Récupère le select
        if (select) select.setAttribute('disabled', true); // Désactive le select
    });
}

// --- Utilitaires divers ---

// --- Couleurs fixes pour les courbes ---
const couleurListe = [
    'rgb(57, 130, 231)',  // Bleu
    'rgb(57, 231, 123)',  // Vert
    'rgb(255, 165, 0)',   // Orange
    'rgb(156, 39, 176)',  // Violet
    'rgb(0, 188, 212)',   // Cyan
    'rgb(231, 57, 57)'    // Rouge
];

let indexCouleur = 0; // Index de la couleur actuelle

function getNextColor() {
    const couleur = couleurListe[indexCouleur]; // Récupère la couleur actuelle
    indexCouleur = (indexCouleur + 1) % couleurListe.length; // Incrémente et boucle si nécessaire
    return couleur; // Retourne la couleur
}

function formaterHorodatage(horodatage) {
    const date = new Date(horodatage); // Convertit la chaîne en objet Date
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`; // Formate la date et l'heure
}

function exportCSV() {
    const canvas = document.getElementById('monGraphique'); // Récupère le canvas principal
    const chart = canvas.myChart; // Récupère le graphique
    if (!chart || !chart.data.labels.length) {
        alert("Aucune donnée à exporter."); // Alerte s'il n'y a pas de données
        return;
    }

    const labels = chart.data.labels; // Récupère les dates
    const dataset = chart.data.datasets[0]; // Récupère le dataset
    const values = dataset.data; // Récupère les valeurs

    const startDate = document.getElementById('startDate').value; // Début date
    const startTime = document.getElementById('startTime').value; // Début heure
    const endDate = document.getElementById('endDate').value; // Fin date
    const endTime = document.getElementById('endTime').value; // Fin heure

    const now = new Date(); // Date actuelle
    const exportDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // Format date d’export

    const formatNom = (str) => str.replaceAll(":", "-").replaceAll("/", "-").replaceAll(" ", "_"); // Remplace les caractères interdits

    const debut = formatNom(`${startDate} ${startTime}`); // Format du début
    const fin = formatNom(`${endDate} ${endTime}`); // Format de fin

    const selectCapteur = document.getElementById('lstCapteur'); // Récupère le select du capteur
    let nomCapteur = "Capteur inconnu"; // Valeur par défaut
    if (selectCapteur && selectCapteur.options[selectCapteur.selectedIndex]) {
        nomCapteur = selectCapteur.options[selectCapteur.selectedIndex].textContent.trim(); // Nom du capteur sélectionné
    }

    const grandeurAvecUnite = dataset.label.trim(); // Libellé du graphique

    let csvContent = `Export réalisé par : ${utilisateurNomComplet}\r\n`; // Ligne d’entête
    csvContent += `Date d'export : ${exportDate}\r\n`;
    csvContent += `Nom du capteur : ${nomCapteur}\r\n`;
    csvContent += `Grandeur mesurée : ${grandeurAvecUnite}\r\n`;
    csvContent += `Plage de mesure : ${startDate} ${startTime} -> ${endDate} ${endTime}\r\n\r\n`;
    csvContent += "Horodatage;Valeur\r\n"; // En-tête du tableau

    for (let i = 0; i < labels.length; i++) {
        csvContent += `${formaterHorodatage(labels[i])};${parseFloat(values[i]).toFixed(1)}\r\n`; // Ajoute chaque ligne
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Crée le blob CSV
    const url = URL.createObjectURL(blob); // Génère l’URL du fichier
    const fileName = `Capteur_${formatNom(nomCapteur)}__${debut}_a_${fin}.csv`; // Nom du fichier

    const link = document.createElement("a"); // Crée un lien de téléchargement
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link); // Ajoute le lien au DOM
    link.click(); // Déclenche le téléchargement
    document.body.removeChild(link); // Nettoyage
    URL.revokeObjectURL(url); // Libère l’URL
}

function gererSelectionSerreAjout(serreId, chapelleId, carteId, capteurId) {
    const serreSelect = document.getElementById(serreId);       // Select des serres
    const chapelleSelect = document.getElementById(chapelleId); // Select des chapelles
    const carteSelect = document.getElementById(carteId);       // Select des cartes
    const capteurSelect = document.getElementById(capteurId);   // Select des capteurs

    if (!serreSelect || !chapelleSelect || !carteSelect || !capteurSelect) {
        console.error("Erreur : un ou plusieurs sélecteurs n'existent pas."); // Vérifie l'existence des éléments
        return;
    }

    serreSelect.addEventListener('change', function () {
        const idSerre = this.value; // Récupère la serre sélectionnée
        if (idSerre) {
            fetch(`getChapelles.php?serre_id=${idSerre}`) // Récupère les chapelles associées
                .then(response => response.json())
                .then(chapelles => {
                    remplirSelect(chapelleId, chapelles, 'IdChapelle', 'Nom'); // Remplit le select chapelle
                    activerSelect(chapelleId); // Active le select
                    reinitialiserSelects([carteId, capteurId]); // Réinitialise les selects suivants
                    desactiverSelects([carteId, capteurId]); // Et les désactive
                });
        } else {
            reinitialiserSelects([chapelleId, carteId, capteurId]); // Réinitialise tous
            desactiverSelects([chapelleId, carteId, capteurId]);    // Désactive tous
        }
    });

    chapelleSelect.addEventListener('change', function () {
        const idChapelle = this.value; // Récupère la chapelle sélectionnée
        if (idChapelle) {
            fetch(`getCartes.php?chapelle_id=${idChapelle}`) // Récupère les cartes associées
                .then(response => response.json())
                .then(cartes => {
                    remplirSelect(carteId, cartes, 'DevEui', 'Nom'); // Remplit le select carte
                    activerSelect(carteId); // Active le select
                    reinitialiserSelects([capteurId]); // Réinitialise capteur
                    desactiverSelects([capteurId]);    // Et le désactive
                });
        } else {
            reinitialiserSelects([carteId, capteurId]); // Réinitialise les 2
            desactiverSelects([carteId, capteurId]);    // Désactive les 2
        }
    });

    carteSelect.addEventListener('change', function () {
        const idCarte = this.value; // Récupère la carte sélectionnée
        if (idCarte) {
            fetch(`getCapteurs.php?carte_id=${idCarte}`) // Récupère les capteurs associés
                .then(response => response.json())
                .then(capteurs => {
                    remplirSelect(capteurId, capteurs, 'IdCapteur', 'Nom'); // Remplit le select capteur
                    activerSelect(capteurId); // Active le select
                });
        } else {
            reinitialiserSelects([capteurId]); // Réinitialise capteur
            desactiverSelects([capteurId]);    // Désactive capteur
        }
    });
}

function synchroniserPlageTemporelleAjout() {
    // Copie les valeurs de la plage temporelle principale dans les champs d'ajout de courbe
    document.getElementById('startDateAjout').value = document.getElementById('startDate').value;
    document.getElementById('startTimeAjout').value = document.getElementById('startTime').value;
    document.getElementById('endDateAjout').value = document.getElementById('endDate').value;
    document.getElementById('endTimeAjout').value = document.getElementById('endTime').value;
}

function supprimerCourbe() {
    const divGraphiques = document.getElementById('divGraphiques'); // Conteneur des blocs de graphiques
    const canvasList = divGraphiques.querySelectorAll('canvas'); // Liste des canvas présents

    if (canvasList.length > 1) { // Vérifie qu'au moins un graphique secondaire existe
        const dernierCanvas = canvasList[canvasList.length - 1]; // Cible le dernier graphique ajouté

        if (dernierCanvas.id !== 'monGraphique') { // Ne supprime pas le graphique principal
            if (dernierCanvas.myChart) dernierCanvas.myChart.destroy(); // Détruit le graphique Chart.js

            const blocASupprimer = dernierCanvas.parentElement; // Récupère le conteneur du canvas
            const capteurId = blocASupprimer.getAttribute('data-capteur-id'); // ID du capteur du bloc
            const plage = blocASupprimer.getAttribute('data-plage'); // Plage temporelle du bloc

            const blocInfo = document.getElementById(`blocGraphique2`); // Cible l'info associée (fixé à 2)
            if (blocInfo) blocInfo.remove(); // Supprime l'infobulle associée (graphique 2 uniquement ici)

            // Décale les blocs suivants (si plus de 2 courbes)
            for (let i = 3; ; i++) {
                const blocSuivant = document.getElementById(`blocGraphique${i}`);
                if (!blocSuivant) break;

                blocSuivant.id = `blocGraphique${i - 1}`; // Met à jour l'ID
                const titre = blocSuivant.querySelector('strong'); // Met à jour le titre du bloc
                if (titre) titre.innerHTML = `— Données Graphique ${i - 1} —`;
            }

            // Supprime l'entrée dans graphiquesAjoutes
            const index = graphiquesAjoutes.findIndex(item => item.capteurId === capteurId && item.plage === plage);
            if (index !== -1) graphiquesAjoutes.splice(index, 1);

            blocASupprimer.remove(); // Supprime le bloc graphique du DOM

            const encoreSecondaires = divGraphiques.querySelectorAll('.graphiqueSecondaire'); // Vérifie les restants
            if (encoreSecondaires.length === 0) {
                const graphiquePrincipal = document.getElementById('Graphique'); // Cible le bloc principal
                graphiquePrincipal.classList.remove('graphiqueMoitié');
                graphiquePrincipal.classList.add('graphiquePlein');
            }
        }
    } else {
        alert('Il ne reste plus que le graphique principal. Vous ne pouvez pas le supprimer.'); // Message de protection
    }
}

function ajouterDonneesCourbe(capteurId) {
    if (!capteurId) {
        console.warn("Aucun capteur sélectionné pour ajouter une courbe."); // Capteur non défini
        return;
    }

    const startDate = document.getElementById('startDateAjout').value; // Date début
    const startTime = document.getElementById('startTimeAjout').value; // Heure début
    const endDate = document.getElementById('endDateAjout').value;     // Date fin
    const endTime = document.getElementById('endTimeAjout').value;     // Heure fin

    const plage = `${startDate} ${startTime} -> ${endDate} ${endTime}`; // Plage temporelle

    const dejaAjoute = graphiquesAjoutes.some(item =>
        item.capteurId == capteurId && item.plage.trim() === plage.trim()
    ); // Vérifie doublon

    if (dejaAjoute) {
        const capteurSelect = document.getElementById('lstCapteurAjout'); // Récupère select
        const capteurNom = capteurSelect.options[capteurSelect.selectedIndex]?.textContent.trim() || "inconnu";
        alert(`Erreur : le capteur "${capteurNom}" est déjà affiché pour la plage suivante :\n${plage}`); // Alerte
        return;
    }

    fetch(`getCapteurInfo.php?capteur_id=${capteurId}`) // Info capteur
        .then(res => res.json())
        .then(capteurInfo => {
            const grandeur = capteurInfo.GrandeurCapt; // Grandeur
            const unite = capteurInfo.Unite;           // Unité

            getMesures(capteurId, startDate, startTime, endDate, endTime).then(data => {
                if (!Array.isArray(data.mesures)) {
                    console.error("Données invalides :", data);
                    return;
                }

                const labels = data.mesures.map(m => m.Horodatage); // X : temps
                const values = data.mesures.map(m => parseFloat(parseFloat(m.Valeur).toFixed(1))); // Y : valeurs

                const divGraphiques = document.getElementById('divGraphiques');

                const graphiquePrincipalBloc = document.getElementById('Graphique');
                if (graphiquePrincipalBloc) {
                    graphiquePrincipalBloc.classList.remove('graphiquePlein');
                    graphiquePrincipalBloc.classList.add('graphiqueMoitié');
                    graphiquePrincipalBloc.classList.remove('graphiqueSecondaire');
                    graphiquePrincipalBloc.classList.add('graphiqueSecondaire');
                    graphiquePrincipalBloc.style.flex = '1 1 calc(50% - 10px)';
                    graphiquePrincipalBloc.style.maxWidth = 'calc(50% - 10px)';
                }

                const newBloc = document.createElement('div');
                newBloc.className = 'graphiqueBloc graphiqueSecondaire';
                newBloc.style.position = 'relative';
                newBloc.setAttribute('data-capteur-id', capteurId);
                newBloc.setAttribute('data-plage', plage);

                const newCanvas = document.createElement('canvas');
                newBloc.appendChild(newCanvas);

                const boutonExport = document.createElement('img');
                boutonExport.src = '../img/download.svg';
                boutonExport.alt = 'Export';
                boutonExport.title = 'Export CSV';
                boutonExport.className = 'img-export';
                boutonExport.addEventListener('click', function () { exportCSVDepuisCanvas(newCanvas); });

                newBloc.appendChild(boutonExport);
                divGraphiques.appendChild(newBloc);

                renderChart(newCanvas, labels, [{
                    label: grandeur === "Direction du vent" ? grandeur : `${grandeur} (${unite})`,
                    data: values,
                    borderColor: getNextColor(),
                    tension: 0.1
                }], unite, grandeur); // Affiche graphique

                graphiquesAjoutes.push({ capteurId: String(capteurId), plage }); // Ajoute à la liste

                const numeroGraphique = graphiquesAjoutes.length + 1; // Numérotation (1 = principal)
                updateInfoGraphique(values, unite, capteurId, numeroGraphique, grandeur); // Infos min/max/moy
            });
        });
}

function exportCSVDepuisCanvas(canvas) {
    const chart = canvas.myChart;
    if (!chart || !chart.data.labels?.length) {
        alert("Aucune donnée à exporter."); // Alerte si aucune donnée n’est présente
        return;
    }

    const labels = chart.data.labels; // Récupère les horodatages
    const dataset = chart.data.datasets[0]; // Récupère le dataset unique du graphique
    const values = dataset.data; // Récupère les valeurs

    const bloc = canvas.parentElement; // Accède au conteneur du graphique
    const capteurId = bloc.getAttribute('data-capteur-id'); // ID du capteur
    const plage = bloc.getAttribute('data-plage'); // Plage temporelle affichée

    const [startDateTime, endDateTime] = plage.split('->').map(str => str.trim()); // Découpe la plage
    const [startDate, startTime] = startDateTime.split(' '); // Sépare date et heure de début
    const [endDate, endTime] = endDateTime.split(' '); // Sépare date et heure de fin

    fetch(`getCapteurInfo.php?capteur_id=${capteurId}`) // Récupère les infos du capteur
        .then(res => res.json())
        .then(capteurInfo => {
            const grandeur = capteurInfo.GrandeurCapt; // Grandeur mesurée
            const unite = capteurInfo.Unite; // Unité de mesure
            const nomCapteur = capteurInfo.Nom || `Capteur ${capteurId}`; // Nom du capteur ou valeur par défaut

            const formatNom = str => str.replaceAll(":", "-").replaceAll("/", "-").replaceAll(" ", "_"); // Formatage nom de fichier
            const debut = formatNom(labels[0]); // Première date pour nom fichier
            const fin = formatNom(labels.at(-1)); // Dernière date

            const now = new Date(); // Date actuelle pour l’export
            const exportDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            let csvContent = `Export réalisé par : ${utilisateurNomComplet}\r\n`;
            csvContent += `Date d'export : ${exportDate}\r\n`;
            csvContent += `Nom du capteur : ${nomCapteur}\r\n`;
            csvContent += `Grandeur mesurée : ${dataset.label}\r\n`;
            csvContent += `Plage de mesure : ${startDateTime} -> ${endDateTime}\r\n\r\n`;
            csvContent += "Horodatage;Valeur\r\n";

            for (let i = 0; i < labels.length; i++) {
                csvContent += `${formaterHorodatage(labels[i])};${parseFloat(values[i]).toFixed(1)}\r\n`; // Ligne de données formatée
            }

            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Création du fichier avec BOM
            const url = URL.createObjectURL(blob); // Génère l’URL temporaire
            const fileName = `Capteur_${formatNom(nomCapteur)}__${debut}_a_${fin}.csv`; // Nom de fichier final

            const link = document.createElement("a"); // Création du lien
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            document.body.appendChild(link); // Ajout au DOM
            link.click(); // Déclenche le téléchargement
            document.body.removeChild(link); // Nettoyage
            URL.revokeObjectURL(url); // Libère l’URL
        });
}

function rafraichirCouleursGraphiques() {
    const isDark = document.body.classList.contains('dark-mode'); // Détection mode sombre
    const canvases = document.querySelectorAll('canvas');

    canvases.forEach(canvas => {
        if (canvas.myChart) {
            const chart = canvas.myChart;

            chart.options.scales.x.ticks.color = isDark ? '#fff' : '#000';
            chart.options.scales.y.ticks.color = isDark ? '#fff' : '#000';
            chart.options.scales.y.title.color = isDark ? '#fff' : '#000';
            chart.options.plugins.legend.labels.color = isDark ? '#fff' : '#000';

            chart.options.scales.x.grid.color = isDark ? '#555' : '#e0e0e0';
            chart.options.scales.y.grid.color = isDark ? '#555' : '#e0e0e0';

            chart.update(); // Rafraîchit le rendu
        }
    });
}