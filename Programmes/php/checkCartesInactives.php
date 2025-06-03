<?php
require "connectDB.php"; // Connexion à la base de données

try {
    $stmt = $bdd->query("SELECT DevEui FROM carte"); // Récupère tous les identifiants de cartes
    $cartes = $stmt->fetchAll(PDO::FETCH_COLUMN); // Tableau de DevEui
    $now = new DateTime(); // Heure actuelle
    $nbModifies = 0; // Compteur de mises à jour

    foreach ($cartes as $devEui) {
        // Récupère l’état actuel de la carte
        $stmtCheck = $bdd->prepare("SELECT EtatComposant FROM carte WHERE DevEui = ?");
        $stmtCheck->execute([$devEui]);
        $etatActuel = $stmtCheck->fetchColumn();

        if ($etatActuel === 'Veille') continue; // Ignore les cartes en veille

        // Récupère les capteurs associés à cette carte via la table `possede`
        $stmtCapteurs = $bdd->prepare("SELECT IdCapteur FROM possede WHERE DevEui = ?");
        $stmtCapteurs->execute([$devEui]);
        $capteurs = $stmtCapteurs->fetchAll(PDO::FETCH_COLUMN);

        $latest = null; // Pour stocker la mesure la plus récente

        foreach ($capteurs as $idCapteur) {
            // Récupère la dernière mesure du capteur
            $stmtLast = $bdd->prepare("SELECT Horodatage FROM mesure WHERE IdCapteur = ? ORDER BY Horodatage DESC LIMIT 1");
            $stmtLast->execute([$idCapteur]);
            $last = $stmtLast->fetch(PDO::FETCH_ASSOC);

            // Compare pour garder la plus récente
            if ($last && !empty($last['Horodatage'])) {
                $lastDate = new DateTime($last['Horodatage']);
                if (!$latest || $lastDate > $latest) {
                    $latest = $lastDate;
                }
            }
        }

        $etat = "OK"; // État par défaut

        if ($latest) {
            $diff = $now->getTimestamp() - $latest->getTimestamp(); // Différence en secondes
            if ($diff > 1800) $etat = "HS"; // Si aucune donnée depuis plus de 30 min
        } else {
            $etat = "HS"; // Aucun capteur n'a de données
        }

        // Met à jour l’état si nécessaire
        if ($etat !== $etatActuel) {
            $stmtUpdate = $bdd->prepare("UPDATE carte SET EtatComposant = ? WHERE DevEui = ?");
            $stmtUpdate->execute([$etat, $devEui]);
            $nbModifies++; // Incrémente le compteur
        }
    }

    echo "Cartes mises à jour : $nbModifies"; // Résultat final

} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage(); // Affiche l’erreur SQL
}