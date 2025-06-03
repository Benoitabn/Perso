<?php
// Inclusion du fichier de connexion à la base de données
require "connectDB.php";

try {
    // Requête pour récupérer tous les IdSerre et Nom depuis la table serre
    $stmtSerre = $bdd->query("SELECT IdSerre, Nom FROM serre");

    // Récupération des résultats sous forme de tableau associatif
    $serres = $stmtSerre->fetchAll(PDO::FETCH_ASSOC);

    // Boucle sur chaque serre pour générer une <option> HTML
    foreach ($serres as $serre) {
        echo "<option value='" . $serre["IdSerre"] . "'>" . $serre["Nom"] . "</option>";
    }

} catch (PDOException $e) {
    // En cas d’erreur, log l’erreur dans les logs PHP (utile pour le debug sans affichage à l’utilisateur)
    error_log("Erreur lors de la récupération des serres : " . $e->getMessage());

    // Ne rien afficher sur la page en production pour éviter les fuites d'information sensibles
}
?>