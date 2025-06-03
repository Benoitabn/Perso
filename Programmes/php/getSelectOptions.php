<?php
// Connexion à la base de données
require "connectDB.php";

try {
    $options = []; // Tableau pour stocker toutes les options

    // Récupère tous les états possibles depuis les tables carte et capteur (en supprimant les doublons avec UNION)
    $stmt = $bdd->query("
        SELECT DISTINCT EtatComposant FROM carte
        UNION
        SELECT DISTINCT EtatComposant FROM capteur
    ");
    $options['EtatComposant'] = $stmt->fetchAll(PDO::FETCH_COLUMN); // Stocke les états dans le tableau

    // Récupère toutes les grandeurs de capteurs disponibles
    $stmt = $bdd->query("SELECT DISTINCT GrandeurCapt FROM capteur");
    $options['GrandeurCapt'] = $stmt->fetchAll(PDO::FETCH_COLUMN); // Stocke les grandeurs dans le tableau

    // Récupère toutes les unités de capteurs non nulles
    $stmt = $bdd->query("SELECT DISTINCT Unite FROM capteur WHERE Unite IS NOT NULL");
    $options['Unite'] = $stmt->fetchAll(PDO::FETCH_COLUMN); // Stocke les unités dans le tableau

    // Récupère toutes les cartes (DevEui et Nom)
    $stmt = $bdd->query("SELECT DevEui, Nom FROM carte");
    $options['Cartes'] = $stmt->fetchAll(PDO::FETCH_ASSOC); // Stocke les cartes dans le tableau

    // Retourne toutes les options au format JSON
    echo json_encode($options);

} catch (PDOException $e) {
    // En cas d'erreur SQL, retourne le message d'erreur en JSON
    echo json_encode(['error' => $e->getMessage()]);
}
?>