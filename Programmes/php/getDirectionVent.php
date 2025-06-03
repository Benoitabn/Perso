<?php
// Inclusion de la fonction de calcul de direction du vent depuis un autre fichier
require_once "directionVent.php";

// Vérifie si le paramètre 'angle' est présent dans la requête GET
if (isset($_GET['angle'])) {
    // Convertit le paramètre 'angle' en nombre décimal (float)
    $angle = floatval($_GET['angle']);

    // Renvoie la direction du vent au format JSON en appelant la fonction directionVent()
    echo json_encode(['direction' => directionVent($angle)]);
} else {
    // Si aucun angle n'est fourni, retourne un message d'erreur
    echo json_encode(['error' => 'Paramètre angle manquant']);
}
?>