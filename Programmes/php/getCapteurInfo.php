<?php
require "connectDB.php"; // Inclusion du fichier de connexion à la base de données

// Vérifie que l'ID du capteur est fourni via GET
if (isset($_GET['capteur_id'])) {
    $capteurId = $_GET['capteur_id'];

    try {
        // Prépare une requête pour récupérer la grandeur et l'unité associées à ce capteur
        $stmt = $bdd->prepare("
            SELECT g.GrandeurCapt, g.Unite
            FROM grandeur g
            WHERE g.GrandeurCapt = (
                SELECT c.GrandeurCapt
                FROM capteur c
                WHERE c.IdCapteur = ?
            )
        ");
        
        // Exécute la requête avec l'ID du capteur passé en paramètre
        $stmt->execute([$capteurId]);

        // Récupère le résultat sous forme de tableau associatif
        $capteurInfo = $stmt->fetch(PDO::FETCH_ASSOC);

        // Renvoie les données au format JSON
        echo json_encode($capteurInfo);

    } catch (PDOException $e) {
        // En cas d’erreur SQL, renvoie un message d’erreur JSON
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>