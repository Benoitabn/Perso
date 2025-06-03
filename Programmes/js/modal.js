// Fonction pour créer un titre (vous l'avez déjà)
function createTitle(text) {
    const title = document.createElement('h2');
    title.textContent = text;
    return title;
}

// Fonction pour obtenir le libellé (vous l'avez déjà)
function getLabel(key) {
    return {
        EtatComposant: 'État du composant',
        GrandeurCapt: 'Grandeur du capteur',
        Unite: 'Unité',
        DevEui: 'Carte associée'
    }[key] || key;
}

// Fonction pour créer un select (vous l'avez déjà)
function createSelect(name, options, selected = '', exclude = []) {
    const select = document.createElement('select');
    select.name = name;
    select.id = name;

    options.forEach(opt => {
        const val = opt.value ?? opt;
        const labelText = opt.label ?? opt; // Renommé pour éviter la confusion avec la variable 'label' externe
        if (exclude.includes(val)) return;
        const option = document.createElement('option');
        option.value = val;
        option.textContent = labelText;
        if (val == selected) option.selected = true;
        select.appendChild(option);
    });

    return select;
}

// Fonction pour créer le sélecteur de carte (vous l'avez déjà)
function createCarteSelect(cartes, selected = '') {
    const label = document.createElement('label');
    label.textContent = 'Carte associée';
    label.setAttribute('for', 'DevEui');

    const select = document.createElement('select');
    select.name = 'DevEui';
    select.id = 'DevEui';

    cartes.forEach(carte => {
        const opt = document.createElement('option');
        opt.value = carte.DevEui;
        opt.textContent = carte.NomCarte || `Carte #${carte.DevEui}`;
        if (carte.DevEui == selected) opt.selected = true;
        select.appendChild(opt);
    });

    const container = document.createElement('div');
    container.appendChild(label);
    container.appendChild(select);
    return container;
}

// Fonction pour créer les boutons de la modale (vous l'avez déjà)
function createButtonContainer(confirmText, onCancel) {
    const container = document.createElement('div');
    container.className = 'modal-buttons';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = confirmText;

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Annuler';
    cancel.addEventListener('click', onCancel);

    container.append(submit, cancel);
    return container;
}


export async function fetchSelectOptions() { // Récupère les options des champs select
    try {
        const res = await fetch('getSelectOptions.php'); // Requête pour les options
        const options = await res.json(); // Conversion JSON
        return {
            EtatComposant: options.EtatComposant || [], // États possibles
            GrandeurCapt: options.GrandeurCapt || [], // Grandeurs
            Cartes: options.Cartes || [], // Cartes
            Unite: options.Unite || [] // Unités
        };
    } catch (e) {
        console.error('Erreur chargement options select :', e); // Log erreur
        return { EtatComposant: [], GrandeurCapt: [], Cartes: [], Unite: [] }; // Valeurs par défaut
    }
}

export async function openAddModal(currentTable, updateTable) { // Ouvre modale d’ajout
    try {
        const res = await fetch('getTableData.php?table=' + currentTable); // Structure de la table
        const data = await res.json(); // JSON
        const columns = data.columns.filter(c => // Filtre colonnes inutiles
            c !== 'Actions' && c !== 'IdCapteur' && c !== 'DateMiseEnService'
        );
        const options = await fetchSelectOptions(); // Charge options select

        const modal = document.createElement('div'); // Création modale
        modal.className = 'modal'; // Classe CSS
        if (document.body.classList.contains('dark-mode')) { // Mode sombre ?
            modal.classList.add('dark-mode'); // Applique style
        }

        const form = document.createElement('form'); // Formulaire HTML
        form.className = 'modal-form'; // Classe CSS

        const titleContainer = document.createElement('div'); // Conteneur titre
        titleContainer.className = 'modal-title-container'; // Classe CSS

        titleContainer.appendChild(createTitle(`Ajouter un ${currentTable}`)); // Titre

        // --- NOUVEAU : Ajout de l'image de fermeture ---
        const closeImg = document.createElement('img');
        closeImg.src = '../img/croix.svg'; // Assurez-vous que le chemin est correct
        closeImg.alt = 'Fermer';
        closeImg.className = 'modal-close-icon'; // Classe CSS pour le style (voir ci-dessous)
        closeImg.onclick = () => modal.remove(); // Action de fermeture
        titleContainer.appendChild(closeImg); // Ajoute l'image au conteneur du titre
        // --- FIN NOUVEAU ---

        form.appendChild(titleContainer); // Ajoute au form
        form.appendChild(closeImg);

        columns.forEach(col => { // Pour chaque champ
            const label = document.createElement('label'); // Crée label
            label.textContent = getLabel(col); // Texte lisible
            label.setAttribute('for', col); // Associe au champ

            let input;
            if (col === 'EtatComposant') {
                input = createSelect(col, ['OK', 'Veille']); // Limite aux valeurs valides
            } else if (col === 'GrandeurCapt') {
                input = createSelect(col, options.GrandeurCapt); // Remplit grandeur

                input.addEventListener('change', async e => { // Change grandeur
                    const selectedGrandeur = e.target.value;
                    const uniteSelect = form.querySelector('#Unite'); // Select unité

                    uniteSelect.innerHTML = ''; // Réinitialise unité

                    try {
                        const res = await fetch(`getUnitesParGrandeur.php?grandeur=${encodeURIComponent(selectedGrandeur)}`); // Récupère unités
                        const unites = await res.json(); // JSON

                        unites.forEach(unite => { // Ajoute options
                            const opt = document.createElement('option');
                            opt.value = unite;
                            opt.textContent = unite;
                            uniteSelect.appendChild(opt);
                        });
                    } catch (error) {
                        console.error('Erreur lors de la récupération des unités :', error); // Log erreur
                    }
                });
            } else if (col === 'Unite') {
                input = document.createElement('select'); // Champ vide
                input.id = 'Unite';
                input.name = 'Unite';
            } else {
                input = document.createElement('input'); // Champ texte générique
                input.type = 'text';
                input.name = col;
                input.id = col;
            }

            form.appendChild(label); // Ajoute label
            form.appendChild(input); // Ajoute champ
        });

        if (currentTable === 'capteur') {
            form.appendChild(createCarteSelect(options.Cartes)); // Ajoute sélection carte
        }

        form.appendChild(createButtonContainer('Ajouter', () => modal.remove())); // Boutons
        modal.appendChild(form); // Ajoute form à modale
        document.body.appendChild(modal); // Ajoute modale au DOM
        modal.style.display = 'flex'; // Affiche modale

        const grandeurSelect = form.querySelector('#GrandeurCapt'); // Auto-déclenche changement
        if (grandeurSelect && grandeurSelect.value) {
            grandeurSelect.dispatchEvent(new Event('change'));
        }

        form.addEventListener('submit', async e => { // Validation formulaire
            e.preventDefault(); // Empêche rechargement
            const formData = new FormData(form); // Récupère données
            formData.append('table', currentTable); // Ajoute table

            const res = await fetch('insertRow.php', {
                method: 'POST',
                body: formData
            });

            const result = await res.json(); // Résultat serveur
            if (result.success) {
                alert('Ajout réussi'); // Succès
                modal.remove(); // Ferme modale
                updateTable(currentTable); // MAJ table
            } else {
                alert('Erreur : ' + result.error); // Affiche erreur
            }
        });
    } catch (error) {
        console.error('Erreur modale ajout :', error); // Log erreur
    }
}

export async function openEditModal(rowData, currentTable, updateTable) { // Ouvre modale édition
    try {
        const options = await fetchSelectOptions(); // Récupère options
        const modal = document.createElement('div'); // Crée modale
        modal.className = 'modal'; // Classe CSS
        if (document.body.classList.contains('dark-mode')) { // Mode sombre ?
            modal.classList.add('dark-mode'); // Applique style
        }

        const form = document.createElement('form'); // Crée formulaire
        form.className = 'modal-form'; // Classe CSS

        const titleContainer = document.createElement('div'); // Conteneur titre
        titleContainer.className = 'modal-title-container'; // Classe CSS

        titleContainer.appendChild(createTitle(`Modifier ${currentTable}`)); // Titre

        // --- NOUVEAU : Ajout de l'image de fermeture ---
        const closeImg = document.createElement('img');
        closeImg.src = '../img/croix.svg'; // Assurez-vous que le chemin est correct
        closeImg.alt = 'Fermer';
        closeImg.className = 'modal-close-icon'; // Classe CSS pour le style
        closeImg.onclick = () => modal.remove(); // Action de fermeture
        titleContainer.appendChild(closeImg); // Ajoute l'image au conteneur du titre
        // --- FIN NOUVEAU ---

        form.appendChild(titleContainer); // Ajoute au formulaire

        const ignore = ['IdCapteur', 'DevEui', 'DateMiseEnService', 'Actions']; // Champs ignorés

        Object.entries(rowData).forEach(([key, val]) => { // Pour chaque champ
            if (ignore.includes(key)) return; // Ignore si nécessaire

            const label = document.createElement('label'); // Label champ
            label.textContent = getLabel(key); // Texte lisible
            label.setAttribute('for', key); // Liaison

            let input;
            if (key === 'EtatComposant') {
                const allEtats = ['OK', 'Veille', 'HS']; // Tous les états
                // L'état actuel doit être une option sélectionnable, donc on ne le filtre plus ici
                // On le passera à createSelect pour qu'il soit sélectionné par défaut.
                input = createSelect(key, allEtats, val); 
            } else if (key === 'GrandeurCapt') {
                input = createSelect(key, options.GrandeurCapt, val); // Sélecteur grandeur avec valeur actuelle sélectionnée

                input.addEventListener('change', async (e) => { // MAJ unités
                    const selectedGrandeur = e.target.value;
                    const uniteSelect = form.querySelector('#Unite');
                    uniteSelect.innerHTML = ''; // Vide les anciennes options
                    try {
                        const res = await fetch(`getUnitesParGrandeur.php?grandeur=${encodeURIComponent(selectedGrandeur)}`);
                        const unites = await res.json();
                        unites.forEach(unite => {
                            const opt = document.createElement('option');
                            opt.value = unite;
                            opt.textContent = unite;
                            uniteSelect.appendChild(opt);
                        });
                        // Si la valeur initiale de rowData.Unite est dans les nouvelles unités, la sélectionner
                        if (unites.includes(rowData.Unite)) {
                           uniteSelect.value = rowData.Unite;
                        } else if (unites.length > 0) {
                            // Optionnel: sélectionner la première unité si l'ancienne n'est plus valide
                            // uniteSelect.value = unites[0];
                        }
                    } catch (error) {
                        console.error("Erreur récupération unités :", error); // Log
                    }
                });
            } else if (key === 'Unite') {
                input = document.createElement('select'); // Select vide, sera peuplé par l'event listener de GrandeurCapt
                input.name = 'Unite';
                input.id = 'Unite';
                // La valeur sera définie par le dispatchEvent ci-dessous
            } else {
                input = document.createElement('input'); // Champ texte
                input.type = 'text';
                input.name = key;
                input.id = key;
                input.value = (val === null || val === undefined) ? '' : (typeof val === 'number' ? parseFloat(val).toFixed(1) : val); // Affichage 1 décimale, gère null/undefined
            }

            form.appendChild(label); // Ajoute label
            form.appendChild(input); // Ajoute input
        });

        if (currentTable === 'capteur') {
            form.appendChild(createCarteSelect(options.Cartes, rowData.DevEui)); // Sélecteur carte
        }

        form.appendChild(createButtonContainer('Enregistrer', () => modal.remove())); // Boutons
        modal.appendChild(form); // Formulaire dans modale
        document.body.appendChild(modal); // Ajoute modale au DOM
        modal.style.display = 'flex'; // Affiche

        const grandeurSelect = form.querySelector('#GrandeurCapt'); // Déclenche MAJ unité
        if (grandeurSelect) { // Vérifier si grandeurSelect existe
             if (grandeurSelect.value) { // S'il y a déjà une valeur (pour l'édition)
                grandeurSelect.dispatchEvent(new Event('change')); // Simule sélection pour peupler les unités
             }
             // S'assurer que l'unité correcte est sélectionnée APRES que les options d'unité aient été chargées
             // Cela peut nécessiter un léger délai ou une gestion dans le 'change' event listener
             setTimeout(() => {
                const uniteSelect = form.querySelector('#Unite');
                if (uniteSelect && rowData.Unite && Array.from(uniteSelect.options).some(opt => opt.value === rowData.Unite)) {
                    uniteSelect.value = rowData.Unite;
                }
            }, 0); // Petit délai pour s'assurer que les options d'unité sont chargées
        }


        form.addEventListener('submit', async e => { // Soumission
            e.preventDefault();
            const formData = new FormData(form); // Données form
            formData.append('table', currentTable); // Nom table

            const idKey = currentTable === 'capteur' ? 'IdCapteur' : 'DevEui'; // ID à envoyer
            formData.append('id', rowData[idKey]); // Ajoute ID

            for (let [key, value] of formData.entries()) {
                // Si la valeur est une chaîne vide et que le champ n'est pas censé être vide (ex: pas un commentaire optionnel)
                // vous pourriez vouloir la convertir en `null` explicitement ici si votre backend le gère mieux.
                // Le PHP dans `updateRow.php` semble déjà gérer les chaînes vides et les convertir en NULL si nécessaire.
                // Donc, cette partie est peut-être redondante ou à ajuster selon le comportement exact souhaité.
                // if (typeof value === 'string' && value.trim() === '') {
                // formData.set(key, null); // Ou laisser vide pour que le PHP gère
                // }
            }

            const res = await fetch('updateRow.php', {
                method: 'POST',
                body: formData
            });

            const result = await res.json(); // Résultat
            if (result.success) {
                alert('Modification réussie'); // OK
                modal.remove(); // Ferme modale
                updateTable(currentTable); // MAJ tableau
            } else {
                alert('Erreur : ' + result.error); // Erreur
            }
        });
    } catch (error) {
        console.error('Erreur modale édition :', error); // Log
    }
}