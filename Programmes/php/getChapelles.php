<?php
require "connectDB.php"; // Inclusion du fichier de connexion à la base de données

// Vérifie si l'ID de la serre a bien été envoyé via GET
if (isset($_GET['serre_id'])) {
    $serreId = $_GET['serre_id']; // Récupération de l'ID

    try {
        // Prépare la requête pour récupérer les chapelles liées à la serre
        $stmt = $bdd->prepare("SELECT IdChapelle, Nom FROM chapelle WHERE IdSerre = ?");
        $stmt->execute([$serreId]); // Exécution avec l'ID de serre

        // Récupère les résultats sous forme de tableau associatif
        $chapelles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Envoie les résultats au format JSON
        echo json_encode($chapelles);

    } catch (PDOException $e) {
        // En cas d'erreur SQL, renvoie un message JSON avec l'erreur
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>