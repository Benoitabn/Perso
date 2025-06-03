<?php 
session_start(); // Démarre la session PHP
require "connectDB.php"; // Connexion à la base de données

// Vérifie si l'utilisateur est connecté et s'il est administrateur
if (!isset($_SESSION['login']) || $_SESSION['fonction'] !== 'Administrateur') {
    header('Location: Log.php'); // Redirige vers la page de connexion si non autorisé
    exit();
}

// Génération du token CSRF s'il n'existe pas encore
if (!isset($_SESSION['_csrf_token'])) {
    $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
}

// Gestion de la déconnexion avec vérification du token CSRF
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['Deconnexion'])) {
    if (isset($_POST['_csrf_token']) && hash_equals($_SESSION['_csrf_token'], $_POST['_csrf_token'])) {
        session_destroy(); // Détruit la session
        header('Location: Log.php'); // Redirige vers la connexion
        exit;
    } else {
        die("Tentative de CSRF détectée.");
    }
}

// Fonction pour obtenir les noms de colonnes d'une table
function getColumnNames($bdd, $tableName) {
    $stmt = $bdd->prepare("DESCRIBE " . $tableName); // Prépare la requête DESCRIBE
    $stmt->execute(); // Exécute la requête
    return $stmt->fetchAll(PDO::FETCH_COLUMN); // Retourne les noms de colonnes
}

try {
    $req = $bdd->prepare("SELECT Prenom, Nom FROM utilisateur WHERE Login = :username"); // Requête pour récupérer prénom et nom
    $req->execute([':username' => $_SESSION['login']]); // Paramètre sécurisé
    $user = $req->fetch(PDO::FETCH_ASSOC); // Récupère les données utilisateur

    if ($user) {
        $prenom = $user['Prenom']; // Stocke le prénom
        $nom = $user['Nom']; // Stocke le nom
    } else {
        error_log("Utilisateur non trouvé : " . $_SESSION['login']); // Log si utilisateur introuvable
    }
} catch (PDOException $e) {
    die("Erreur lors de la récupération des informations utilisateur : " . $e->getMessage()); // Gestion erreur BDD
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Consultation des Mesures</title> 
    <link href="../css/Consultation.css" rel="stylesheet" type="text/css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        const utilisateurNomComplet = "<?php echo htmlspecialchars(addslashes($prenom . ' ' . $nom)); ?>";
    </script>
</head>
<body>
    <header class="navBar">
        <div id="navAutre">
            <a href="Parametrage.php">
                <img src="../img/reglage.svg" alt="plus non trouvé" id="reglage" title="Paramétrage du système">
            </a>
        </div>
        <div id="navTitre">
            Consultation des mesures
        </div>
        <div id="navDeconnexion">
            <?php echo htmlspecialchars($prenom . ' ' . $nom) . ' | '; ?>
            <form method="POST" style="display:inline;">
                <input type="hidden" name="_csrf_token" value="<?php echo htmlspecialchars($_SESSION['_csrf_token']); ?>">
                <button type="submit" name="Deconnexion" class="btnDeconnexion">Déconnexion</button>
            </form>
            <img id="modeIcon" src="../img/lune.svg" alt="Mode clair" title="Mode sombre">
        </div>
    </header>

    <div id="divSelect"> <!-- Bloc principal de sélection -->
        <div id="actionGraphique">
            <div id="graphique">
                <h2>Graphique n°1</h2> <!-- Titre du graphique principal -->
            </div>
            <div id="actions">
                <img src="../img/plus.svg" alt="plus non trouvé" id="ajoutCourbe" title="Ajouter un graphique"> <!-- Ajout de courbe -->
                <img src="../img/moins.svg" alt="moins non trouvé" id="supprimerCourbe" title="Supprimer un graphique"> <!-- Suppression de courbe -->
            </div>
        </div>
        <div id="selectGraphique">
            <div id="selectSerre">
                <h3>Selection serre :</h3>
                <select name="lstSerre" id="lstSerre" data-url="getChapelles.php"> <!-- Liste des serres -->
                    <option value="" selected>-- Sélectionner une serre --</option>
                    <?php include 'getSerres.php'; ?> <!-- Remplissage dynamique -->
                </select>
            </div>

            <div id="selectChapelle">
                <h3>Selection chapelle :</h3>
                <select name="lstChapelle" id="lstChapelle" data-url="getCartes.php" disabled> <!-- Liste chapelles dépendante -->
                    <option value="">-- Sélectionner une chapelle --</option>
                </select>
            </div>

            <div id="selectCarte">
                <h3>Selection carte :</h3>
                <select name="lstCarte" id="lstCarte" data-url="getCapteurs.php" disabled> <!-- Liste cartes dépendante -->
                    <option value="">-- Sélectionner une carte --</option>
                </select>
            </div>

            <div id="selectCapteur">
                <h3>Selection capteur :</h3>
                <select name="lstCapteur" id="lstCapteur" disabled> <!-- Liste capteurs dépendante -->
                    <option value="">-- Sélectionner un capteur --</option>
                </select>
            </div>
        </div>

        <div id="selectPlage">
            <button onclick="ouvertureModel()">Plage temporelle</button> <!-- Bouton pour ouvrir la plage de temps -->
        </div>

        <div id="infoGraphique">
        </div>
    </div> 

    <div id="divGraphiques">
        <div id="Graphique" class="graphiqueBloc"> <!-- Bloc graphique principal -->
            <img src="../img/download.svg" alt="Export" id="telechargeCourbe" title="Export CSV"> <!-- Export CSV -->
            <canvas id="monGraphique"></canvas> <!-- Canvas pour Chart.js -->
        </div>
    </div>

    <div id="model"> <!-- Modale pour la plage temporelle principale -->
        <img src="../img/croix.svg" alt="Fermer" class="close-icon" id="closePlageMain">
        <label for="startDate">Date de début :</label>
        <input type="date" id="startDate">
        <label for="startTime">Heure de début :</label>
        <input type="time" id="startTime" required>
        <br><br>
        <label for="endDate">Date de fin :</label>
        <input type="date" id="endDate">
        <label for="endTime">Heure de fin :</label>
        <input type="time" id="endTime" required>
        <br><br>
        <button onclick="updateChartWithTimeRange()">Valider</button> <!-- Bouton de validation -->
    </div>

    <div id="ajoutCourbeDiv" class="model" style="display: none;"> <!-- Modale ajout courbe -->
        <img src="../img/croix.svg" alt="Fermer" class="close-icon" id="closeAjoutCourbe">
        <div id="selectSerre">
            <h3>Selection serre :</h3>
            <select name="lstSerreAjout" id="lstSerreAjout" data-url="getChapelles.php">
                <option value="" selected>-- Sélectionner une serre --</option>
                <?php include 'getSerres.php'; ?>
            </select>
        </div>

        <div id="selectChapelle">
            <h3>Selection chapelle :</h3>
            <select name="lstChapelleAjout" id="lstChapelleAjout" data-url="getCartes.php" disabled>
                <option value="">-- Sélectionner une chapelle --</option>
            </select>
        </div>

        <div id="selectCarte">
            <h3>Selection carte :</h3>
            <select name="lstCarteAjout" id="lstCarteAjout" data-url="getCapteurs.php" disabled>
                <option value="">-- Sélectionner une carte --</option>
            </select>
        </div>

        <div id="selectCapteur">
            <h3>Selection capteur :</h3>
            <select name="lstCapteurAjout" id="lstCapteurAjout" disabled>
                <option value="">-- Sélectionner un capteur --</option>
            </select>
        </div>

        <div id="plageTemporelleAjout">
            <label>
                <input type="checkbox" id="synchroPlageAjout" checked>
                Utiliser la même plage que la courbe principale <!-- Synchronisation des plages -->
            </label>
        </div>
        <div id="selectPlage">
            <div class="lignePlage">
                <label for="startDateAjout">Date début :</label>
                <input type="date" id="startDateAjout" disabled>
            </div>
            <div class="lignePlage">
                <label for="startTimeAjout">Heure début :</label>
                <input type="time" id="startTimeAjout" required disabled>
            </div>
            <div class="lignePlage">
                <label for="endDateAjout">Date fin :</label>
                <input type="date" id="endDateAjout" disabled>
            </div>
            <div class="lignePlage">
                <label for="endTimeAjout">Heure fin :</label>
                <input type="time" id="endTimeAjout" required disabled>
            </div>
        </div>
        <button id="validerAjoutCourbe">Valider</button> <!-- Bouton ajout courbe -->
    </div>

    <div id="suppressionCourbeDiv" class="model" style="display: none;"> <!-- Modale suppression courbe -->
        <img src="../img/croix.svg" alt="Fermer" class="close-icon" id="closeSuppressionCourbe">
        <h3>Supprimer un graphique</h3>
        <select id="listeGraphiquesASupprimer">
            <option value="">-- Sélectionner un graphique --</option> <!-- Liste déroulante des courbes -->
        </select>
        <br><br>
        <div style="display: flex; justify-content: center; gap: 10px;">
            <button id="confirmerSuppressionGraphique">Supprimer</button> <!-- Confirmation suppression -->
            <button id="annulerSuppressionGraphique">Annuler</button> <!-- Annulation suppression -->
        </div>
    </div>

    <script src="../js/Fonctions.js"></script> <!-- Fonctions JS -->
    <script src="../js/Consultation.js"></script> <!-- Script principal -->
</body>
</html>