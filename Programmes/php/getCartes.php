<?php
require "connectDB.php"; // Inclusion de la connexion à la base de données

// Vérifie que l'identifiant de la chapelle est bien passé en paramètre GET
if (isset($_GET['chapelle_id'])) {
    $chapelleId = $_GET['chapelle_id'];

    try {
        // Prépare une requête pour récupérer les cartes associées à cette chapelle
        $stmt = $bdd->prepare("SELECT DevEui, Nom FROM carte WHERE IdChapelle = ?");
        $stmt->execute([$chapelleId]); // Exécution avec l'ID de chapelle fourni

        // Récupère les cartes sous forme de tableau associatif
        $cartes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Envoie les résultats au format JSON
        echo json_encode($cartes);

    } catch (PDOException $e) {
        // En cas d'erreur, retourne un message d'erreur au format JSON
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>