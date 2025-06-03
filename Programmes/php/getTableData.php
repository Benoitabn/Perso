<?php
// Connexion à la base de données
require "connectDB.php";

// Vérifie que le nom de la table est passé en paramètre GET
if (isset($_GET['table'])) {
    $tableName = $_GET['table'];

    try {
        // Initialisation des variables
        $columns = [];
        $rows = [];
        $idField = null;

        // Sélection des données selon la table demandée
        switch ($tableName) {
            case 'carte':
                // Jointure avec la chapelle pour afficher son nom
                $stmt = $bdd->prepare("
                    SELECT carte.DevEui, carte.Nom AS NomCarte, carte.DateMiseEnService, carte.AppKey, carte.AppEUI, carte.Marque, 
                           carte.Reference, carte.NumSerie, carte.Commentaire, chapelle.Nom AS NomChapelle, carte.EtatComposant
                    FROM carte
                    LEFT JOIN chapelle ON carte.IdChapelle = chapelle.IdChapelle
                ");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = 'DevEui'; // Champ identifiant
                break;

            case 'capteur':
                $stmt = $bdd->prepare("SELECT * FROM capteur");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = 'IdCapteur';
                break;

            case 'chapelle':
                $stmt = $bdd->prepare("SELECT * FROM chapelle");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = 'IdChapelle';
                break;

            case 'serre':
                $stmt = $bdd->prepare("SELECT * FROM serre");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = 'IdSerre';
                break;

            case 'utilisateur':
                $stmt = $bdd->prepare("SELECT * FROM utilisateur");
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = 'IdUtilisateur';
                break;

            default:
                // Cas par défaut si la table est non reconnue
                $stmt = $bdd->prepare("SELECT * FROM " . $tableName);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $idField = null;
        }

        // Récupère les noms de colonnes si des données existent
        if (!empty($rows)) {
            $columns = array_keys($rows[0]);
        }

        // Ajoute un bouton d'action "Modifier" si la table est capteur ou carte
        if (in_array($tableName, ['capteur', 'carte']) && $idField !== null) {
            foreach ($rows as &$row) {
                $row['Actions'] = '<button class="modifyImage" data-id="' . $row[$idField] . '">Modifier</button>';
            }
        }

        // Construction finale de la liste de colonnes à retourner
        $finalColumns = [];

        // Place "Actions" en premier si elle existe
        if (isset($rows[0]['Actions'])) {
            $finalColumns[] = 'Actions';
        }

        // Ajoute toutes les autres colonnes sauf la clé primaire et IdChapelle
        foreach ($columns as $col) {
            if ($col !== $idField && $col !== 'IdChapelle') {
                $finalColumns[] = $col;
            }
        }

        // Réponse au format JSON : colonnes + lignes
        echo json_encode(['columns' => $finalColumns, 'rows' => $rows]);

    } catch (PDOException $e) {
        // En cas d'erreur SQL, retour d'un message JSON avec le détail
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>