<?php
require "connectDB.php"; // Connexion à la base de données

try {
    // 1. Récupère tous les identifiants de capteurs
    $stmt = $bdd->query("SELECT IdCapteur FROM capteur");
    $capteurs = $stmt->fetchAll(PDO::FETCH_COLUMN); // Liste d'IDs (colonne unique)

    $now = new DateTime(); // Date et heure actuelles
    $nbModifies = 0; // Compteur de capteurs modifiés

    foreach ($capteurs as $id) {
        // 2. Récupère l'état actuel du capteur
        $stmtCheck = $bdd->prepare("SELECT EtatComposant FROM capteur WHERE IdCapteur = ?");
        $stmtCheck->execute([$id]);
        $etatActuel = $stmtCheck->fetchColumn();

        // 3. Si le capteur est en veille, on ignore
        if ($etatActuel === 'Veille') continue;

        // 4. Récupère l'horodatage de la dernière mesure du capteur
        $stmtLast = $bdd->prepare("SELECT Horodatage FROM mesure WHERE IdCapteur = ? ORDER BY Horodatage DESC LIMIT 1");
        $stmtLast->execute([$id]);
        $last = $stmtLast->fetch(PDO::FETCH_ASSOC);

        $etat = "OK"; // État par défaut

        if ($last && !empty($last['Horodatage'])) {
            $lastDate = new DateTime($last['Horodatage']); // Conversion horodatage
            $diff = $now->getTimestamp() - $lastDate->getTimestamp(); // Différence en secondes

            if ($diff > 1800) $etat = "HS"; // Si plus de 30 min sans mesure => HS
        } else {
            $etat = "HS"; // Aucun relevé = HS
        }

        // 5. Met à jour l'état du capteur si changement
        if ($etat !== $etatActuel) {
            $stmtUpdate = $bdd->prepare("UPDATE capteur SET EtatComposant = ? WHERE IdCapteur = ?");
            $stmtUpdate->execute([$etat, $id]);
            $nbModifies++; // Incrémente le compteur
        }
    }

    echo "Mise à jour terminée. Capteurs modifiés : $nbModifies";

} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage(); // Affiche l'erreur SQL si besoin
}
?>