<?php
require_once 'connectDB.php';

if (isset($_POST['id']) && isset($_POST['table'])) {
    $id = $_POST['id'];
    $table = $_POST['table'];

    // Liste des tables autorisées et leur clé primaire
    $primaryKeys = [
        'serre'       => 'IdSerre',
        'chapelle'    => 'IdChapelle',
        'carte'       => 'DevEui',
        'capteur'     => 'IdCapteur',
        'utilisateur' => 'IdUtilisateur'
    ];

    // Vérifie si la table est autorisée
    if (!array_key_exists($table, $primaryKeys)) {
        echo json_encode(['success' => false, 'error' => 'Table non supportée']);
        exit;
    }

    $primaryKey = $primaryKeys[$table];

    try {
        // Préparation de la requête
        $query = "DELETE FROM $table WHERE $primaryKey = :id";
        $stmt = $bdd->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Aucun élément supprimé']);
        }

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Données manquantes']);
}
?>