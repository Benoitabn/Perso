<?php
require "connectDB.php"; // Connexion à la base de données

// Vérifie que l'identifiant de la carte est bien passé en paramètre GET
if (isset($_GET['carte_id'])) {
    $carteId = $_GET['carte_id'];

    try {
        // Prépare une requête pour récupérer les capteurs associés à la carte via la table 'possede'
        $stmt = $bdd->prepare("
            SELECT ca.IdCapteur, ca.Nom
            FROM capteur ca
            JOIN possede po ON ca.IdCapteur = po.IdCapteur
            WHERE po.DevEui = ?
        ");

        // Exécute la requête avec l'ID de la carte fourni
        $stmt->execute([$carteId]);

        // Récupère tous les capteurs associés sous forme de tableau associatif
        $capteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Renvoie les résultats encodés en JSON
        echo json_encode($capteurs);

    } catch (PDOException $e) {
        // En cas d'erreur SQL, renvoie l'erreur encodée en JSON
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>