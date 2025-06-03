<?php
require "connectDB.php"; // Inclusion de la connexion à la base de données

// Vérifie que l'ID du capteur est bien présent dans la requête GET
if (!isset($_GET['capteur_id'])) {
    echo json_encode(["error" => "ID capteur manquant"]); // Renvoie une erreur si l'ID est absent
    exit; // Interrompt l'exécution du script
}

$capteurId = $_GET['capteur_id']; // Récupère l'ID du capteur depuis l'URL

try {
    // Prépare une requête pour récupérer la dernière mesure du capteur
    $stmt = $bdd->prepare(
        "SELECT Valeur, Horodatage 
         FROM mesure 
         WHERE IdCapteur = :capteurId 
         ORDER BY Horodatage DESC 
         LIMIT 1"
    );

    // Exécute la requête avec l'ID du capteur
    $stmt->execute([':capteurId' => $capteurId]);

    // Récupère le résultat sous forme associative
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode($result); // Renvoie la dernière mesure trouvée
    } else {
        echo json_encode(["error" => "Aucune mesure trouvée"]); // Aucun enregistrement trouvé
    }

} catch (PDOException $e) {
    // En cas d'erreur lors de la requête SQL, renvoie le message d'erreur
    echo json_encode(["error" => $e->getMessage()]);
}
?>