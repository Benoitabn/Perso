import { openEditModal, openAddModal, fetchSelectOptions } from '../js/modal.js'; // Import des fonctions de gestion modale

// Lancer la vérification des capteurs & cartes inactifs dès chargement
window.addEventListener('DOMContentLoaded', () => {
    fetch('checkCapteursInactifs.php') // Vérifie les capteurs inactifs
        .then(r => r.text())
        .then(txt => console.log('[Capteurs vérifiés] ' + txt))
        .catch(err => console.error('[Erreur capteurs]', err));

    fetch('checkCartesInactives.php') // Vérifie les cartes inactives
        .then(r => r.text())
        .then(txt => console.log('[Cartes vérifiées] ' + txt))
        .catch(err => console.error('[Erreur cartes]', err));
});

// Interface dynamique
document.addEventListener('DOMContentLoaded', function () {
    const buttons = { // Associe chaque bouton à une table
        serre: 'selectSerre',
        chapelle: 'selectChapelle',
        carte: 'selectCarte',
        capteur: 'selectCapteur',
        utilisateur: 'selectUtilisateur'
    };

    const searchInput = document.getElementById('searchInput'); // Champ de recherche
    const tableHeader = document.querySelector('.tabParametrage thead tr'); // Ligne d'en-tête
    const tableBody = document.querySelector('.tabParametrage tbody'); // Corps du tableau
    let currentTable = 'capteur'; // Table affichée par défaut

    // Gérer les boutons de sélection de table
    Object.entries(buttons).forEach(([table, id]) => {
        document.getElementById(id).addEventListener('click', () => updateTable(table)); // Charge la table au clic
    });

    // Filtrage par texte
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase(); // Texte en minuscules
        document.querySelectorAll('.divTableau tbody tr').forEach(row => {
            const visible = Array.from(row.cells).some(cell =>
                cell.textContent.toLowerCase().includes(term) // Filtre sur chaque cellule
            );
            row.style.display = visible ? '' : 'none'; // Affiche ou masque
        });
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

    // Met à jour l’affichage d’une table
    async function updateTable(tableName) {
        currentTable = tableName; // Met à jour la table courante

        // Active le bon bouton
        Object.entries(buttons).forEach(([key, id]) => {
            document.getElementById(id).classList.toggle('active', key === tableName); // Active visuellement
        });

        try {
            const res = await fetch('getTableData.php?table=' + tableName); // Récupère les données
            const { columns, rows } = await res.json(); // Récupère colonnes et lignes

            tableHeader.innerHTML = ''; // Vide l'en-tête
            tableBody.innerHTML = ''; // Vide le corps

            columns.forEach(col => {
                if (currentTable === 'utilisateur' && col.toLowerCase() === 'mdp') return; // Ignore le mot de passe

                const th = document.createElement('th');
                th.textContent = col;
                th.classList.add(col.toLowerCase());
                if (col.toLowerCase() === 'commentaire') th.classList.add('commentaire');

                // Bouton Ajouter
                if (col === 'Actions' && ['carte', 'capteur'].includes(tableName)) {
                    const btn = document.createElement('img');
                    btn.src = '../img/plus.svg';
                    btn.alt = 'Ajouter';
                    btn.title = 'Ajouter';
                    btn.className = 'addImage';
                    btn.style.cursor = 'pointer';
                    btn.addEventListener('click', () => openAddModal(currentTable, updateTable)); // Ouvre la modale d'ajout
                    th.appendChild(btn);
                }

                tableHeader.appendChild(th); // Ajoute l'en-tête
            });

            // Lignes
            rows.forEach(row => {
                const tr = document.createElement('tr');

                columns.forEach(col => {
                    if (currentTable === 'utilisateur' && col.toLowerCase() === 'mdp') return; // Ignore la cellule mot de passe

                    const td = document.createElement('td');
                    td.classList.add(col.toLowerCase());

                    if (col === 'Actions') {
                        const idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') || k === 'DevEui'); // Récupère clé ID
                        const id = row[idKey]; // ID de l’élément

                        const rowSansActions = { ...row }; // Copie de la ligne
                        delete rowSansActions.Actions; // Supprime champ Actions

                        // Bouton Modifier
                        const modifyBtn = createActionBtn('../img/modifier.svg', 'Modifier', () =>
                            openEditModal(rowSansActions, currentTable, updateTable)
                        );

                        // Bouton Supprimer
                        const deleteBtn = createActionBtn('../img/moins.svg', 'Supprimer', () => {
                            if (confirm(`Supprimer ce ${currentTable} ?`)) deleteRow(currentTable, id); // Confirmation
                        });
                        deleteBtn.classList.add('deleteImage');
                        deleteBtn.style.marginLeft = '5px';

                        td.appendChild(modifyBtn);
                        td.appendChild(deleteBtn);
                    } else {
                        td.textContent = row[col]; // Affiche la valeur brute
                    }

                    tr.appendChild(td);
                });

                tableBody.appendChild(tr); // Ajoute la ligne au tableau
            });

            searchInput.dispatchEvent(new Event('input')); // Rafraîchit le filtre
        } catch (err) {
            console.error('Erreur updateTable :', err); // Gestion des erreurs
        }
    }

    async function deleteRow(table, id) {
        try {
            const res = await fetch('deleteRow.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `table=${table}&id=${id}` // Paramètres à envoyer
            });
            const result = await res.json(); // Résultat
            if (result.success) {
                alert(`${table} supprimé`); // Confirmation
                updateTable(currentTable); // Rafraîchit la table
            } else {
                alert('Erreur : ' + result.error); // Affiche l'erreur
            }
        } catch (e) {
            console.error('Erreur suppression :', e); // Gestion erreur réseau
            alert('Erreur lors de la suppression');
        }
    }

    function createActionBtn(src, alt, onClick) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.title = alt;
        img.className = alt.toLowerCase() + 'Image'; // Classe CSS dynamique
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.2s ease';
        img.addEventListener('mouseenter', () => img.style.transform = 'scale(1.3)'); // Zoom au survol
        img.addEventListener('mouseleave', () => img.style.transform = 'scale(1)'); // Dézoom
        img.addEventListener('click', onClick); // Clic sur l’image
        return img;
    }

    updateTable(currentTable); // Chargement initial de la table capteur
});