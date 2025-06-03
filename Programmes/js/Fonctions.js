// Fonctions.js optimisé et commenté ligne par ligne

// --- Gestion des modales ---
function ouvertureModel() {
    document.getElementById('model').style.display = 'block'; // Affiche la modale de sélection temporelle principale
}

function fermetureModel() {
    document.getElementById('model').style.display = 'none'; // Cache la modale de sélection temporelle principale
}

function ouvertureModelAjout() {
    // Cette fonction semble redondante ou mal nommée si elle ouvre la même modale que ouvertureModel.
    // Si elle est censée ouvrir la modale d'ajout de courbe, elle devrait cibler '#ajoutCourbeDiv'.
    // Pour l'instant, je la laisse telle quelle, mais c'est un point à vérifier.
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
                if (!data || !Array.isArray(data.mesures)) { // Vérification plus robuste de 'data' et 'data.mesures'
                    console.error("Données invalides ou non reçues:", data);
                    // Optionnel: Afficher un message à l'utilisateur sur le graphique ou dans la zone d'info
                    renderChart(canvas, [], [], unite, grandeur); // Afficher un graphique vide
                    updateInfoGraphique([], unite, capteurId, 1, grandeur); // Mettre à jour les infos avec des données vides
                    return;
                }
                const labels = data.mesures.map(m => m.Horodatage); // Horodatages
                const values = data.mesures.map(m => parseFloat(parseFloat(m.Valeur).toFixed(1))); // Valeurs arrondies à 1 décimale

                renderChart(canvas, labels, [{
                    label: grandeur === "Direction du vent" ? grandeur : `${grandeur} (${unite})`,
                    data: values,
                    borderColor: 'rgb(231, 57, 57)', // Couleur pour le graphique principal
                    tension: 0.1
                }], unite, grandeur); // Ajout de grandeur pour renderChart

                updateInfoGraphique(values, unite, capteurId, 1, grandeur); // Met à jour les infos
            });
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des informations du capteur:", error);
            // Gérer l'erreur, par exemple en affichant un message à l'utilisateur
        });
}

// --- Création / mise à jour d’un graphique Chart.js ---
function renderChart(canvas, labels, datasets, unite, grandeur = null) { // Ajout du paramètre grandeur
    const ctx = canvas.getContext('2d');
    // canvas.width = canvas.height = null; // Peut causer des problèmes de redimensionnement intempestifs. Chart.js gère cela.
    if (canvas.myChart) {
        canvas.myChart.destroy(); // Détruit l'ancien graphique s'il existe
    }

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
                    ticks: { color: isDark ? '#fff' : '#000', autoSkip: true, maxTicksLimit: 10 }, // Amélioration pour l'axe X
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
                    <span>Actuelle : ${values.at(-1).toFixed(1)}° (${actuelle.direction || 'N/A'})</span><br>
                    <span>Minimum (plage) : ${min.toFixed(1)}° (${minDir.direction || 'N/A'})</span><br>
                    <span>Maximum (plage) : ${max.toFixed(1)}° (${maxDir.direction || 'N/A'})</span><br>
                    <span>Moyenne (plage) : ${moyenne.toFixed(1)}° (${moyenneDir.direction || 'N/A'})</span><br><br>
                `;
            }).catch(error => console.error("Erreur getDirectionVent:", error));
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
    if (capteurId && grandeur !== "Direction du vent" && unite !== "°") { // Ne pas chercher la dernière mesure si c'est une direction de vent (déjà géré)
        fetch(`getDerniereMesure.php?capteur_id=${capteurId}`)
            .then(res => res.json())
            .then(data => {
                const span = bloc.querySelector('.valActuelle');
                if (span) { // S'assurer que le span existe
                    span.textContent = data && data.Valeur ? `Actuelle : ${parseFloat(data.Valeur).toFixed(1)} ${unite}` : "Actuelle : non disponible";
                }
            })
            .catch(() => {
                const span = bloc.querySelector('.valActuelle');
                if (span) span.textContent = "Actuelle : erreur";
            });
    } else if (grandeur === "Direction du vent" || unite === "°") {
        // La valeur "Actuelle" pour la direction du vent est déjà mise à jour par le Promise.all
        // Si values est vide, on peut mettre à jour ici
        if (!values || values.length === 0) {
            const span = bloc.querySelector('.valActuelle'); // Il n'y aura pas de span avec cette classe si values est vide
                                                          // Le bloc.innerHTML aura déjà "Aucune donnée..."
        }
    }
}

// --- Définir plage par défaut : hier -> maintenant ---
function definirPlageTemporelleParDefaut() {
    const maintenant = new Date();
    const debut = new Date(maintenant);
    debut.setDate(debut.getDate() - 1); // Hier

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

    if (!startDateValue || !startTimeValue || !endDateValue || !endTimeValue) {
        alert("Veuillez sélectionner une date et une heure de début et de fin.");
        return;
    }

    const startDateTime = new Date(startDateValue + 'T' + startTimeValue);
    const endDateTime = new Date(endDateValue + 'T' + endTimeValue);

    if (startDateTime >= endDateTime) {
        alert("La date de début ne peut pas être après ou égale à la date de fin. Veuillez corriger la sélection.");
        return;
    }

    updateChart(capteurId, document.getElementById('monGraphique'), startDateValue, startTimeValue, endDateValue, endTimeValue);
    fermetureModel();
}

// --- Génériques de gestion des select ---
function remplirSelect(selectId, options, valueKey, labelKey) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">-- Sélectionnez --</option>`; // Option par défaut
    if (options && Array.isArray(options)) {
        options.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[labelKey];
            select.appendChild(option);
        });
    } else {
        console.warn(`Options non valides pour le select ${selectId}:`, options);
    }
}

function reinitialiserSelects(ids) {
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.innerHTML = `<option value="">-- Sélectionnez --</option>`;
    });
}

function selectionnerParDefaut(selectId, valeurParDefaut, callback = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const option = Array.from(select.options).find(opt => opt.value == valeurParDefaut);
    if (option) {
        option.selected = true;
        const event = new Event('change', { bubbles: true }); // Assurer la propagation de l'événement
        select.dispatchEvent(event);

        if (typeof callback === 'function') {
             // Le callback est souvent utilisé pour chaîner des actions asynchrones.
             // Le délai de 100ms est une béquille. Idéalement, la fonction appelée par 'change'
             // devrait retourner une promesse ou avoir son propre callback.
            setTimeout(() => callback(), 100); // Délai pour permettre au 'change' de potentiellement charger des données
        }
    } else {
        console.warn(`Option avec valeur ${valeurParDefaut} non trouvée dans ${selectId}`);
    }
}

function activerSelect(id) {
    const select = document.getElementById(id);
    if (select) select.removeAttribute('disabled');
}

function desactiverSelects(ids) {
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.setAttribute('disabled', true);
    });
}

// --- Utilitaires divers ---
const couleurListe = [
    'rgb(57, 130, 231)',  // Bleu
    'rgb(57, 231, 123)',  // Vert
    'rgb(255, 165, 0)',   // Orange
    'rgb(156, 39, 176)',  // Violet
    'rgb(0, 188, 212)',   // Cyan
    'rgb(231, 57, 57)'    // Rouge (utilisé pour le principal, donc on le remet à la fin pour qu'il soit moins probable pour les premiers graphiques secondaires)
];

let indexCouleurActuel = 0; // Commence par la première couleur pour les graphiques secondaires

function getNextColor() {
    // On saute la première couleur si c'est pour un graphique secondaire et que la liste est utilisée pour le principal aussi.
    // Ou on utilise une liste de couleurs distincte. Pour l'instant, on cycle.
    const couleur = couleurListe[indexCouleurActuel];
    indexCouleurActuel = (indexCouleurActuel + 1) % couleurListe.length;
    return couleur;
}


function formaterHorodatage(horodatage) {
    const date = new Date(horodatage);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function exportCSV() {
    const canvas = document.getElementById('monGraphique');
    const chart = canvas.myChart;
    if (!chart || !chart.data.labels || !chart.data.labels.length) {
        alert("Aucune donnée à exporter pour le graphique principal.");
        return;
    }
    exportDataToCSV(chart, document.getElementById('lstCapteur'), document.getElementById('startDate').value, document.getElementById('startTime').value, document.getElementById('endDate').value, document.getElementById('endTime').value);
}

function exportCSVDepuisCanvas(canvas) {
    const chart = canvas.myChart;
    if (!chart || !chart.data.labels || !chart.data.labels.length) {
        alert("Aucune donnée à exporter pour ce graphique.");
        return;
    }

    const blocParent = canvas.closest('.graphiqueBloc'); // Trouver le conteneur .graphiqueBloc
    if (!blocParent) {
        alert("Impossible de trouver les informations du graphique.");
        return;
    }
    const capteurId = blocParent.getAttribute('data-capteur-id');
    const plage = blocParent.getAttribute('data-plage'); // "YYYY-MM-DD HH:MM -> YYYY-MM-DD HH:MM"

    if (!capteurId || !plage) {
        alert("Informations manquantes pour l'export (capteurId ou plage).");
        return;
    }

    const [plageDebutFull, plageFinFull] = plage.split(' -> ');
    const [startDate, startTime] = plageDebutFull.split(' ');
    const [endDate, endTime] = plageFinFull.split(' ');

    // Pour obtenir le nom du capteur, on pourrait stocker le nom dans un data-attribute aussi,
    // ou refaire un fetch, mais c'est moins performant.
    // Pour l'instant, on va construire un nom générique ou utiliser l'ID.
    // Idéalement, lors de la création du graphique secondaire, stocker aussi le nom du capteur.
    const selectCapteurSimule = { // Simuler un objet select pour la fonction exportDataToCSV
        options: [{ value: capteurId, textContent: `Capteur ${capteurId}` }], // Option basique
        selectedIndex: 0
    };
    // Si le nom du capteur est disponible (ex: via un data-nom-capteur sur blocParent)
    const nomCapteurAttr = blocParent.getAttribute('data-nom-capteur');
    if (nomCapteurAttr) {
        selectCapteurSimule.options[0].textContent = nomCapteurAttr;
    }


    exportDataToCSV(chart, selectCapteurSimule, startDate, startTime, endDate, endTime);
}


function exportDataToCSV(chartInstance, selectCapteurElement, startDate, startTime, endDate, endTime) {
    const labels = chartInstance.data.labels;
    const dataset = chartInstance.data.datasets[0];
    const values = dataset.data;

    const now = new Date();
    const exportDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const formatNom = (str) => String(str).replace(/[:\/\s]/g, "_").replace(/__/g, "_"); // Échappement plus robuste

    const debut = formatNom(`${startDate}_${startTime}`);
    const fin = formatNom(`${endDate}_${endTime}`);

    let nomCapteur = "Capteur_inconnu";
    if (selectCapteurElement && selectCapteurElement.options && selectCapteurElement.options[selectCapteurElement.selectedIndex]) {
        nomCapteur = selectCapteurElement.options[selectCapteurElement.selectedIndex].textContent.trim();
    }

    const grandeurAvecUnite = dataset.label.trim();

    let csvContent = `Export réalisé par : ${typeof utilisateurNomComplet !== 'undefined' ? utilisateurNomComplet : 'Utilisateur inconnu'}\r\n`;
    csvContent += `Date d'export : ${exportDate}\r\n`;
    csvContent += `Nom du capteur : ${nomCapteur}\r\n`;
    csvContent += `Grandeur mesurée : ${grandeurAvecUnite}\r\n`;
    csvContent += `Plage de mesure : ${startDate} ${startTime} -> ${endDate} ${endTime}\r\n\r\n`;
    csvContent += "Horodatage;Valeur\r\n";

    for (let i = 0; i < labels.length; i++) {
        csvContent += `${formaterHorodatage(labels[i])};${parseFloat(values[i]).toFixed(1)}\r\n`;
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const fileName = `Export_${formatNom(nomCapteur)}_${debut}_a_${fin}.csv`;

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


function gererSelectionSerreAjout(serreId, chapelleId, carteId, capteurId) {
    const serreSelect = document.getElementById(serreId);
    const chapelleSelect = document.getElementById(chapelleId);
    const carteSelect = document.getElementById(carteId);
    const capteurSelect = document.getElementById(capteurId);

    if (!serreSelect || !chapelleSelect || !carteSelect || !capteurSelect) {
        console.error("Erreur : un ou plusieurs sélecteurs n'existent pas pour gererSelectionSerreAjout.");
        return;
    }

    serreSelect.addEventListener('change', function () {
        const idSerre = this.value;
        reinitialiserSelects([chapelleId, carteId, capteurId]);
        desactiverSelects([chapelleId, carteId, capteurId]);
        if (idSerre) {
            fetch(`getChapelles.php?serre_id=${idSerre}`)
                .then(response => response.json())
                .then(chapelles => {
                    if (chapelles && chapelles.error) { console.error("Erreur getChapelles:", chapelles.error); return; }
                    remplirSelect(chapelleId, chapelles, 'IdChapelle', 'Nom');
                    activerSelect(chapelleId);
                }).catch(err => console.error("Fetch error getChapelles:", err));
        }
    });

    chapelleSelect.addEventListener('change', function () {
        const idChapelle = this.value;
        reinitialiserSelects([carteId, capteurId]);
        desactiverSelects([carteId, capteurId]);
        if (idChapelle) {
            fetch(`getCartes.php?chapelle_id=${idChapelle}`)
                .then(response => response.json())
                .then(cartes => {
                    if (cartes && cartes.error) { console.error("Erreur getCartes:", cartes.error); return; }
                    remplirSelect(carteId, cartes, 'DevEui', 'Nom');
                    activerSelect(carteId);
                }).catch(err => console.error("Fetch error getCartes:", err));
        }
    });

    carteSelect.addEventListener('change', function () {
        const idCarte = this.value;
        reinitialiserSelects([capteurId]);
        desactiverSelects([capteurId]);
        if (idCarte) {
            fetch(`getCapteurs.php?carte_id=${idCarte}`)
                .then(response => response.json())
                .then(capteurs => {
                    if (capteurs && capteurs.error) { console.error("Erreur getCapteurs:", capteurs.error); return; }
                    remplirSelect(capteurId, capteurs, 'IdCapteur', 'Nom');
                    activerSelect(capteurId);
                }).catch(err => console.error("Fetch error getCapteurs:", err));
        }
    });
}

function synchroniserPlageTemporelleAjout() {
    document.getElementById('startDateAjout').value = document.getElementById('startDate').value;
    document.getElementById('startTimeAjout').value = document.getElementById('startTime').value;
    document.getElementById('endDateAjout').value = document.getElementById('endDate').value;
    document.getElementById('endTimeAjout').value = document.getElementById('endTime').value;
}

function supprimerCourbeSelectionnee() { // Renommée pour plus de clarté
    const selectSuppression = document.getElementById('listeGraphiquesASupprimer');
    const indexASupprimer = selectSuppression.value;

    if (indexASupprimer === "") {
        alert("Veuillez sélectionner un graphique à supprimer.");
        return;
    }

    const graphiqueInfoASupprimer = graphiquesAjoutes[parseInt(indexASupprimer)];
    if (!graphiqueInfoASupprimer) {
        alert("Graphique non trouvé.");
        return;
    }

    // Trouver le bloc DOM du graphique à supprimer
    const divGraphiques = document.getElementById('divGraphiques');
    const blocsSecondaires = divGraphiques.querySelectorAll('.graphiqueBloc.graphiqueSecondaire');
    let blocASupprimer = null;

    for (const bloc of blocsSecondaires) {
        if (bloc.getAttribute('data-capteur-id') === String(graphiqueInfoASupprimer.capteurId) &&
            bloc.getAttribute('data-plage') === graphiqueInfoASupprimer.plage) {
            blocASupprimer = bloc;
            break;
        }
    }

    if (blocASupprimer) {
        const canvas = blocASupprimer.querySelector('canvas');
        if (canvas && canvas.myChart) {
            canvas.myChart.destroy();
        }
        blocASupprimer.remove();

        // Supprimer l'infobulle associée
        const numBlocInfo = parseInt(indexASupprimer) + 2; // +1 car index, +1 car graphique principal est 1
        const blocInfo = document.getElementById(`blocGraphique${numBlocInfo}`);
        if (blocInfo) {
            blocInfo.remove();
        }
        
        // Mettre à jour les IDs et titres des infobulles restantes
        for (let i = numBlocInfo + 1; ; i++) {
            const blocInfoSuivant = document.getElementById(`blocGraphique${i}`);
            if (!blocInfoSuivant) break;
            blocInfoSuivant.id = `blocGraphique${i - 1}`;
            const titre = blocInfoSuivant.querySelector('strong');
            if (titre) titre.textContent = `— Données Graphique ${i - 1} —`;
        }


        // Supprimer de la liste graphiquesAjoutes
        graphiquesAjoutes.splice(parseInt(indexASupprimer), 1);

        // Mettre à jour la liste déroulante de suppression
        mettreAJourListeSuppressionGraphiques();


        // Vérifier s'il reste des graphiques secondaires
        const graphiquesSecondairesRestants = divGraphiques.querySelectorAll('.graphiqueBloc.graphiqueSecondaire');
        const graphiquePrincipal = document.getElementById('Graphique');

        if (graphiquePrincipal) {
            if (graphiquesSecondairesRestants.length === 0) {
                graphiquePrincipal.classList.remove('graphiqueMoitié');
                graphiquePrincipal.classList.add('graphiquePlein');
                graphiquePrincipal.style.flex = ''; 
                graphiquePrincipal.style.maxWidth = '';
                graphiquePrincipal.style.height = ''; // Permet au height: 100% de .graphiquePlein de fonctionner

                const canvasPrincipal = graphiquePrincipal.querySelector('canvas#monGraphique');
                if (canvasPrincipal && canvasPrincipal.myChart) {
                    void graphiquePrincipal.offsetHeight; 
                    setTimeout(() => {
                        canvasPrincipal.myChart.resize();
                    }, 50);
                }
            } else {
                 // S'assurer que le graphique principal reste 'graphiqueMoitié'
                graphiquePrincipal.classList.remove('graphiquePlein');
                graphiquePrincipal.classList.add('graphiqueMoitié');
                graphiquePrincipal.style.height = ''; // Laisser l'aspect-ratio de .graphiqueMoitié gérer

                const canvasPrincipal = graphiquePrincipal.querySelector('canvas#monGraphique');
                 if (canvasPrincipal && canvasPrincipal.myChart) {
                    void graphiquePrincipal.offsetHeight;
                    setTimeout(() => {
                        canvasPrincipal.myChart.resize();
                    }, 50);
                }
            }
        }
    } else {
        console.error("Bloc DOM du graphique à supprimer non trouvé.");
        // Peut-être resynchroniser graphiquesAjoutes avec le DOM
    }
    document.getElementById('suppressionCourbeDiv').style.display = 'none';
}


function ajouterDonneesCourbe(capteurId) {
    if (!capteurId) {
        console.warn("Aucun capteur sélectionné pour ajouter une courbe.");
        return;
    }

    const utiliseSynchro = document.getElementById('synchroPlageAjout').checked;
    let startDate, startTime, endDate, endTime;

    if (utiliseSynchro) {
        startDate = document.getElementById('startDate').value;
        startTime = document.getElementById('startTime').value;
        endDate = document.getElementById('endDate').value;
        endTime = document.getElementById('endTime').value;
    } else {
        startDate = document.getElementById('startDateAjout').value;
        startTime = document.getElementById('startTimeAjout').value;
        endDate = document.getElementById('endDateAjout').value;
        endTime = document.getElementById('endTimeAjout').value;

        if (!startDate || !startTime || !endDate || !endTime) {
            alert("Veuillez sélectionner une plage temporelle complète pour le nouveau graphique.");
            return;
        }
        const startDt = new Date(startDate + 'T' + startTime);
        const endDt = new Date(endDate + 'T' + endTime);
        if (startDt >= endDt) {
            alert("La date de début du nouveau graphique ne peut pas être après ou égale à la date de fin.");
            return;
        }
    }


    const plage = `${startDate} ${startTime} -> ${endDate} ${endTime}`;
    const capteurSelectAjout = document.getElementById('lstCapteurAjout');
    const nomCapteurSelectionne = capteurSelectAjout.options[capteurSelectAjout.selectedIndex]?.textContent.trim() || `Capteur ${capteurId}`;


    const dejaAjoute = graphiquesAjoutes.some(item =>
        String(item.capteurId) === String(capteurId) && item.plage.trim() === plage.trim()
    );

    if (dejaAjoute) {
        alert(`Erreur : le capteur "${nomCapteurSelectionne}" est déjà affiché pour la plage suivante :\n${plage}`);
        return;
    }

    fetch(`getCapteurInfo.php?capteur_id=${capteurId}`)
        .then(res => res.json())
        .then(capteurInfo => {
            if (capteurInfo && capteurInfo.error) { console.error("Erreur getCapteurInfo:", capteurInfo.error); return; }
            const grandeur = capteurInfo.GrandeurCapt;
            const unite = capteurInfo.Unite;
            const nomCapteurComplet = capteurInfo.Nom || nomCapteurSelectionne; // Utiliser le nom de la BDD si disponible

            getMesures(capteurId, startDate, startTime, endDate, endTime).then(data => {
                if (!data || !Array.isArray(data.mesures)) {
                     console.error("Données invalides pour le nouveau graphique:", data);
                     alert(`Aucune mesure trouvée pour le capteur ${nomCapteurComplet} sur la plage sélectionnée.`);
                     return;
                }
                 if (data.mesures.length === 0) {
                    alert(`Aucune mesure trouvée pour le capteur ${nomCapteurComplet} sur la plage sélectionnée.`);
                    return; // Ne pas ajouter de graphique vide
                }


                const labels = data.mesures.map(m => m.Horodatage);
                const values = data.mesures.map(m => parseFloat(parseFloat(m.Valeur).toFixed(1)));

                const divGraphiques = document.getElementById('divGraphiques');
                const graphiquePrincipalBloc = document.getElementById('Graphique');

                if (graphiquePrincipalBloc) {
                    graphiquePrincipalBloc.classList.remove('graphiquePlein');
                    graphiquePrincipalBloc.classList.add('graphiqueMoitié'); // Correct
                    graphiquePrincipalBloc.style.flex = ''; 
                    graphiquePrincipalBloc.style.maxWidth = '';
                    graphiquePrincipalBloc.style.height = ''; // Permet à l'aspect-ratio de .graphiqueMoitié de fonctionner

                    const canvasPrincipal = graphiquePrincipalBloc.querySelector('canvas#monGraphique');
                    if (canvasPrincipal && canvasPrincipal.myChart) {
                        void graphiquePrincipalBloc.offsetHeight; 
                        setTimeout(() => canvasPrincipal.myChart.resize(), 50);
                    }
                }

                const newBloc = document.createElement('div');
                // La classe graphiqueMoitié est déjà dans Fonctions.js, ligne 424
                newBloc.className = 'graphiqueBloc graphiqueMoitié graphiqueSecondaire';
                newBloc.style.position = 'relative'; // Pour le bouton export
                newBloc.setAttribute('data-capteur-id', String(capteurId));
                newBloc.setAttribute('data-plage', plage);
                newBloc.setAttribute('data-nom-capteur', nomCapteurComplet);


                const newCanvas = document.createElement('canvas');
                newBloc.appendChild(newCanvas);

                const boutonExport = document.createElement('img');
                boutonExport.src = '../img/download.svg';
                boutonExport.alt = 'Export';
                boutonExport.title = 'Export CSV';
                boutonExport.className = 'img-export'; // Assurez-vous que cette classe est stylée
                boutonExport.addEventListener('click', function () { exportCSVDepuisCanvas(newCanvas); });

                newBloc.appendChild(boutonExport);
                divGraphiques.appendChild(newBloc);

                renderChart(newCanvas, labels, [{
                    label: grandeur === "Direction du vent" ? grandeur : `${nomCapteurComplet} - ${grandeur} (${unite})`,
                    data: values,
                    borderColor: getNextColor(),
                    tension: 0.1
                }], unite, grandeur);


                graphiquesAjoutes.push({ capteurId: String(capteurId), plage: plage, nomCapteur: nomCapteurComplet, grandeur: grandeur, unite: unite });
                mettreAJourListeSuppressionGraphiques(); // Mettre à jour la liste pour la suppression

                const numeroGraphiquePourInfo = graphiquesAjoutes.length + 1;
                updateInfoGraphique(values, unite, capteurId, numeroGraphiquePourInfo, grandeur);
                
                document.getElementById('ajoutCourbeDiv').style.display = 'none'; // Fermer la modale
            });
        }).catch(err => console.error("Fetch error getCapteurInfo pour ajout:", err));
}


function rafraichirCouleursGraphiques() {
    const isDark = document.body.classList.contains('dark-mode');
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
            chart.update();
        }
    });
}

function mettreAJourListeSuppressionGraphiques() {
    const select = document.getElementById('listeGraphiquesASupprimer');
    select.innerHTML = '<option value="">-- Sélectionner un graphique --</option>'; // Option par défaut

    graphiquesAjoutes.forEach((graph, index) => {
        const option = document.createElement('option');
        option.value = index; // Utiliser l'index du tableau comme valeur
        // Utiliser le nom du capteur stocké, la grandeur et l'unité pour un libellé plus clair
        option.textContent = `Graphique ${index + 2} : ${graph.nomCapteur} (${graph.grandeur} - ${graph.plage})`;
        select.appendChild(option);
    });

    // Activer ou désactiver le bouton de suppression principal en fonction du nombre de graphiques secondaires
    document.getElementById('supprimerCourbe').disabled = graphiquesAjoutes.length === 0;
}

// Initialiser la liste de suppression au chargement
document.addEventListener('DOMContentLoaded', () => {
    mettreAJourListeSuppressionGraphiques();
});