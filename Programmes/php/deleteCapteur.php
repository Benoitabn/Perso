<?php
// Inclusion du fichier de connexion à la base de données
require_once 'connectDB.php'; 

// Vérifie si l'ID du capteur est bien reçu en POST
if (isset($_POST['id'])) {
    $id = $_POST['id'];

    // Vérifie que l'ID est bien un nombre
    if (is_numeric($id)) {

        // Requête de suppression (attention au nom de la table : 'capteurs' ou 'capteur' ?)
        $query = "DELETE FROM capteur WHERE IdCapteur = :id";

        try {
            // Prépare la requête avec la connexion à la base
            $stmt = $bdd->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT); // Lie l'ID en paramètre
            $stmt->execute(); // Exécute la requête

            // Vérifie si une ligne a bien été supprimée
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]); // Succès
            } else {
                echo json_encode(['success' => false, 'error' => 'Aucun capteur trouvé avec cet ID']);
            }
        } catch (PDOException $e) {
            // Gère les erreurs SQL
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }

    } else {
        // Si l'ID n'est pas un nombre
        echo json_encode(['success' => false, 'error' => 'ID invalide']);
    }

} else {
    // Si l'ID n'est pas fourni
    echo json_encode(['success' => false, 'error' => 'Données manquantes']);
}