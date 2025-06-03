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
<html lang="fr"> <!-- Langue de la page -->
<head>
    <meta charset="UTF-8"> <!-- Encodage -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Responsive -->
    <title>Paramétrage du système</title> <!-- Titre onglet -->
    <link href="../css/Parametrage.css" rel="stylesheet" type="text/css"> <!-- Lien vers le CSS -->
</head>
<body>
    <header class="navBar"> <!-- Barre de navigation -->
        <div id="navAutre"> <!-- Bouton vers consultation -->
            <a href="Consultation.php">
                <img src="../img/graphe.svg" alt="plus non trouvé" id="graphe" title="Consultation des mesures">
            </a>
        </div>
        <div id="navTitre">Paramétrage du système</div> <!-- Titre centré -->
        <div id="navDeconnexion"> <!-- Nom + Déconnexion -->
            <?php echo htmlspecialchars($prenom . ' ' . $nom) . ' | '; ?>
            <form method="POST" style="display:inline;">
                <input type="hidden" name="_csrf_token" value="<?php echo htmlspecialchars($_SESSION['_csrf_token']); ?>">
                <button type="submit" name="Deconnexion" class="btnDeconnexion">Déconnexion</button>
            </form>
            <img id="modeIcon" src="../img/lune.svg" alt="Mode clair" title="Mode sombre">
        </div>
    </header>

    <div class="container"> <!-- Conteneur principal -->
        <div class="selectionTable"> <!-- Boutons de sélection de table -->
            <button id="selectSerre">Serres</button>
            <button id="selectChapelle">Chapelles</button>
            <button id="selectCarte">Cartes</button>
            <button id="selectCapteur">Capteurs</button>
            <button id="selectUtilisateur">Utilisateurs</button>
        </div>

        <div class="tabParametrage"> <!-- Section tableau -->
            <div class="divTableau"> <!-- Conteneur du tableau -->
                <div id="enteteTab"> <!-- En-tête avec recherche -->
                    <h2>Test</h2> <!-- Titre dynamique remplacé JS -->
                    <div id="recherche">
                        <img src="../img/recherche.svg" alt="recherche non trouvé" id="imgRecherche" title="Recherche">
                        <input type="text" id="searchInput" placeholder="Rechercher..."> <!-- Champ recherche -->
                    </div>
                </div>
                <div id="tab"> <!-- Tableau HTML -->
                    <table>
                        <thead><tr></tr></thead> <!-- En-tête dynamique -->
                        <tbody></tbody> <!-- Données générées en JS -->
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modale dynamique pour Ajout / Modification -->
    <div id="modalOverlay" class="modal" style="display: none;"> <!-- Fond modale masqué -->
        <form id="modalDynamicForm" class="modal-form"> <!-- Formulaire -->
            <h2 id="modalTitle"></h2> <!-- Titre dynamique -->
            <img src="../img/croix.svg" alt="Fermer" class="modal-close-icon" id="dynamicModalCloseButton"> 

            <!-- Champs dynamiques générés par JavaScript -->
            <div id="modalFieldsContainer"></div>

            <div class="modal-buttons"> <!-- Boutons formulaire -->
                <button type="submit" id="modalSubmitBtn">Valider</button>
                <button type="button" id="modalCancelBtn">Annuler</button>
            </div>
        </form>
    </div>

    <script type="module" src="../js/modal.js"></script> <!-- Script modale -->
    <script type="module" src="../js/Parametrage.js"></script> <!-- Script principal -->
</body>
</html>