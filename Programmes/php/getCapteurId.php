<?php
require "connectDB.php"; // Connexion à la base de données

// Vérifie que le paramètre 'grandeur' est bien passé en GET
if (isset($_GET['grandeur'])) {
    $grandeur = $_GET['grandeur'];

    try {
        // Prépare et exécute une requête pour récupérer un capteur associé à la grandeur
        $stmt = $bdd->prepare("SELECT IdCapteur FROM capteur WHERE GrandeurCapt = ? LIMIT 1");
        $stmt->execute([$grandeur]);

        // Récupère le premier résultat sous forme de tableau associatif
        $capteurInfo = $stmt->fetch(PDO::FETCH_ASSOC);

        // Renvoie les données au format JSON (ou null si aucun résultat)
        echo json_encode($capteurInfo);

    } catch (PDOException $e) {
        // En cas d’erreur SQL, renvoyer un message d’erreur au format JSON
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>