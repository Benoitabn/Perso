<?php
require "connectDB.php";

$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['table'])) {
    $table = $_POST['table'];

    // Remplace les chaînes vides par null
    foreach ($_POST as $key => $value) {
        if ($value === '') {
            $_POST[$key] = null;
        }
    }

    try {
        $stmt = $bdd->prepare("DESCRIBE " . $table);
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $columns = array_filter($columns, function ($col) {
            return !in_array($col, ['IdCapteur', 'DateMiseEnService']);
        });

        $insertCols = [];
        $insertVals = [];

        foreach ($columns as $col) {
            if (array_key_exists($col, $_POST)) {
                $insertCols[] = $col;
                $insertVals[] = ':' . $col;
            }
        }

        $insertCols[] = 'DateMiseEnService';
        $insertVals[] = 'NOW()';

        $sql = "INSERT INTO $table (" . implode(',', $insertCols) . ") VALUES (" . implode(',', $insertVals) . ")";
        $stmt = $bdd->prepare($sql);

        // Liaison des paramètres
        foreach ($columns as $col) {
            if (array_key_exists($col, $_POST)) {
                $stmt->bindValue(':' . $col, $_POST[$col], $_POST[$col] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            }
        }

        $stmt->execute();
        $response['success'] = true;

    } catch (PDOException $e) {
        $response['error'] = $e->getMessage();
    }

} else {
    $response['error'] = 'Requête invalide';
}

echo json_encode($response);