<?php
// Connexion à la base de données
require "connectDB.php";

// Vérifie que l'identifiant du capteur est fourni en paramètre GET
if (isset($_GET['capteur_id'])) {
    $capteurId = $_GET['capteur_id'];

    // Récupère les bornes temporelles si elles existent
    $startDate = $_GET['startDate'] ?? null;
    $startTime = $_GET['startTime'] ?? null;
    $endDate   = $_GET['endDate'] ?? null;
    $endTime   = $_GET['endTime'] ?? null;

    try {
        // 1. Construction de la requête SQL de récupération des mesures
        $sql = "SELECT Horodatage, Valeur FROM mesure WHERE IdCapteur = ?";
        $params = [$capteurId];

        // Ajout d'une condition de plage temporelle si tous les champs sont fournis
        if ($startDate && $startTime && $endDate && $endTime) {
            $startDateTime = $startDate . ' ' . $startTime;
            $endDateTime   = $endDate . ' ' . $endTime;
            $sql .= " AND Horodatage BETWEEN ? AND ?";
            $params[] = $startDateTime;
            $params[] = $endDateTime;
        }

        $sql .= " ORDER BY Horodatage ASC"; // Trie les mesures par date croissante

        $stmt = $bdd->prepare($sql);
        $stmt->execute($params);
        $mesures = $stmt->fetchAll(PDO::FETCH_ASSOC); // Résultat des mesures

        // 2. Récupère la dernière mesure pour évaluer l’état du capteur
        $stmtLast = $bdd->prepare("SELECT Horodatage FROM mesure WHERE IdCapteur = ? ORDER BY Horodatage DESC LIMIT 1");
        $stmtLast->execute([$capteurId]);
        $last = $stmtLast->fetch(PDO::FETCH_ASSOC);

        $etat = "OK"; // État par défaut

        if ($last && !empty($last['Horodatage'])) {
            $lastDate = new DateTime($last['Horodatage']);
            $now = new DateTime();
            $diff = $now->getTimestamp() - $lastDate->getTimestamp();

            // Si la dernière mesure date de plus de 30 minutes, l'état est HS
            if ($diff > 1800) {
                $etat = "HS";
            }
        } else {
            $etat = "HS"; // Aucun relevé du tout
        }

        // 3. Vérifie si l'état doit être mis à jour dans la base
        $stmtCheck = $bdd->prepare("SELECT EtatComposant FROM capteur WHERE IdCapteur = ?");
        $stmtCheck->execute([$capteurId]);
        $etatActuel = $stmtCheck->fetchColumn();

        if ($etatActuel !== $etat) {
            $stmtUpdate = $bdd->prepare("UPDATE capteur SET EtatComposant = ? WHERE IdCapteur = ?");
            $stmtUpdate->execute([$etat, $capteurId]);
        }

        // 4. Retourne les mesures et l’état du capteur au format JSON
        echo json_encode([
            'etat' => $etat,
            'mesures' => $mesures
        ]);

    } catch (PDOException $e) {
        // En cas d'erreur SQL, renvoie un message d'erreur au format JSON
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>