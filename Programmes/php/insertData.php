<?php
// Inclusion du fichier de connexion à la base de données
require "connectDB.php";

// Vérifie que la méthode HTTP utilisée est POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $table = $_POST['table']; // Récupère le nom de la table cible (capteur ou carte)

    try {
        // --- Cas d'ajout d’un capteur ---
        if ($table === 'capteur') {
            // Liste des champs obligatoires pour un capteur
            $requiredFields = ['NomCapteur', 'GrandeurCapt', 'Unite', 'ValeurMin', 'ValeurMax', 'EtatComposant', 'DevEui'];

            // Vérifie que chaque champ est bien présent dans $_POST
            foreach ($requiredFields as $field) {
                if (!isset($_POST[$field])) {
                    echo json_encode(['success' => false, 'error' => "Le champ '$field' est manquant !"]);
                    exit;
                }
            }

            // Vérifie si la carte sélectionnée possède déjà un capteur (1 capteur max par carte)
            $verifCapteurCarte = $bdd->prepare("
                SELECT COUNT(*) FROM capteur WHERE DevEui = :DevEui
            ");
            $verifCapteurCarte->execute([':DevEui' => $_POST['DevEui']]);
            $nbCapteurs = $verifCapteurCarte->fetchColumn();

            if ($nbCapteurs > 0) {
                echo json_encode(['success' => false, 'error' => "Impossible d'ajouter un capteur : la carte sélectionnée possède déjà un capteur."]);
                exit;
            }

            // Insertion du nouveau capteur
            $stmt = $bdd->prepare("
                INSERT INTO capteur 
                    (Nom, GrandeurCapt, Unite, ValeurMin, ValeurMax, EtatComposant, DateMiseEnService, DevEui)
                VALUES 
                    (:NomCapteur, :GrandeurCapt, :Unite, :ValeurMin, :ValeurMax, :EtatComposant, NOW(), :DevEui)
            ");

            $stmt->execute([
                ':NomCapteur'    => $_POST['NomCapteur'],
                ':GrandeurCapt'  => $_POST['GrandeurCapt'],
                ':Unite'         => $_POST['Unite'],
                ':ValeurMin'     => $_POST['ValeurMin'],
                ':ValeurMax'     => $_POST['ValeurMax'],
                ':EtatComposant' => $_POST['EtatComposant'],
                ':DevEui'        => $_POST['DevEui']
            ]);

        // --- Cas d'ajout d’une carte ---
        } elseif ($table === 'carte') {
            // Champs obligatoires pour une carte
            $requiredFields = ['NomCarte', 'EtatComposant'];

            foreach ($requiredFields as $field) {
                if (!isset($_POST[$field])) {
                    echo json_encode(['success' => false, 'error' => "Le champ '$field' est manquant !"]);
                    exit;
                }
            }

            // Insertion de la nouvelle carte
            $stmt = $bdd->prepare("
                INSERT INTO carte 
                    (Nom, EtatComposant, DateMiseEnService)
                VALUES 
                    (:NomCarte, :EtatComposant, NOW())
            ");

            $stmt->execute([
                ':NomCarte'      => $_POST['NomCarte'],
                ':EtatComposant' => $_POST['EtatComposant']
            ]);

        // --- Table non reconnue ---
        } else {
            echo json_encode(['success' => false, 'error' => "Table non supportée"]);
            exit;
        }

        // Réponse JSON en cas de succès
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        // Gestion des erreurs SQL
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }

} else {
    // Requête non autorisée si autre que POST
    echo json_encode(['success' => false, 'error' => "Requête invalide"]);
}
?>