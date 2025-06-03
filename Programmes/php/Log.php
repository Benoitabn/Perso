<?php
session_start(); // Démarre la session pour stocker les informations de l'utilisateur
session_regenerate_id(true); // Regénère l'ID pour éviter les attaques de fixation de session
require "connectLog.php"; // Connexion à la base de données

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $Nom = trim($_POST["Nom"]); // Supprime les espaces autour du login
    $Mdp = $_POST["Mdp"];        // Ne pas trim le mot de passe (il peut contenir des espaces)

    // Requête préparée pour éviter les injections SQL
    $req = $bdd->prepare("SELECT Mdp, Fonction FROM utilisateur WHERE Login = :nom");
    $req->bindParam(':nom', $Nom, PDO::PARAM_STR);
    $req->execute();
    $reponse = $req->fetch(); // Récupère la ligne correspondante (ou false si non trouvée)

    if ($reponse) {
        // Vérifie si le mot de passe saisi correspond au mot de passe haché en base
        if (password_verify($Mdp, $reponse['Mdp'])) {
            $_SESSION['login'] = $Nom;                    // Enregistre le login en session
            $_SESSION['fonction'] = $reponse['Fonction']; // Enregistre la fonction (ex: admin)
            header('Location: Consultation.php');         // Redirige vers la page de consultation
            exit();
        } else {
            $message = "Mot de passe invalide !"; // Message d'erreur en cas de mauvais mot de passe
        }
    } else {
        $message = "Nom d'utilisateur non trouvé !"; // Message d'erreur si l'utilisateur n'existe pas
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion</title>
    <link href="../css/Log.css" rel="stylesheet" type="text/css"> <!-- Feuille de style -->
</head>
<body>
    <!-- Nuages en fond (décoratif) -->
    <div class="cloud" style="top: 20%; left: 10%;"></div>
    <div class="cloud" style="top: 40%; right: 15%; animation-delay: 0s;"></div>
    <div class="cloud" style="top: 60%; left: 20%; animation-delay: 0s;"></div>

    <!-- Boîte de connexion -->
    <div class="container">
        <h2>Se connecter</h2>
        <form action="" method="POST">
            <input type="text" name="Nom" placeholder="Nom d'utilisateur" required>
            <input type="password" name="Mdp" placeholder="Mot de passe" required>
            </br></br>
            <input type="submit" value="Connexion">
        </form>

        <!-- Affiche le message d'erreur si défini -->
        <?php if (!empty($message)): ?>
            <div class="message"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
    </div>
</body>
</html>