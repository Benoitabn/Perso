<?php
// Inclusion du fichier de connexion à la base de données
require 'connectDB.php';

// Vérifie que le paramètre 'grandeur' est bien présent dans l'URL
if (isset($_GET['grandeur'])) {
    $grandeur = $_GET['grandeur']; // Récupère la grandeur depuis la requête GET

    // Prépare une requête pour récupérer toutes les unités correspondant à cette grandeur
    $stmt = $bdd->prepare("SELECT Unite FROM grandeur WHERE GrandeurCapt = :grandeur");

    // Exécute la requête avec le paramètre fourni
    $stmt->execute([':grandeur' => $grandeur]);

    // Récupère toutes les unités trouvées (sous forme de tableau de chaînes)
    $unites = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Renvoie le résultat au format JSON
    echo json_encode($unites);
} else {
    // Si le paramètre 'grandeur' est manquant, renvoie un tableau vide
    echo json_encode([]);
}
?>