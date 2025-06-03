<?php
require "connectDB.php";
header('Content-Type: application/json');
$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['table']) && isset($_POST['id'])) {
    $table = $_POST['table'];
    $id = $_POST['id'];

    // Remplace les champs vides par NULL
    foreach ($_POST as $key => $value) {
        if ($value === '') {
            $_POST[$key] = null;
        }
    }

    try {
        $stmt = $bdd->prepare("DESCRIBE " . $table);
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $ignore = ['DateMiseEnService'];
        if ($table === 'capteur') {
            $primaryKey = 'IdCapteur';
            $ignore[] = 'IdCapteur';
        } elseif ($table === 'carte') {
            $primaryKey = 'DevEui';
            $ignore[] = 'DevEui';
        } else {
            echo json_encode(['success' => false, 'error' => 'Table non supportée']);
            exit;
        }

        $setClause = [];
        foreach ($columns as $col) {
            if (!in_array($col, $ignore) && array_key_exists($col, $_POST)) {
                $setClause[] = "$col = :$col";
            }
        }

        $sql = "UPDATE $table SET " . implode(", ", $setClause) . " WHERE $primaryKey = :id";
        $stmt = $bdd->prepare($sql);

        foreach ($columns as $col) {
            if (!in_array($col, $ignore) && array_key_exists($col, $_POST)) {
                $stmt->bindValue(':' . $col, $_POST[$col], $_POST[$col] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            }
        }

        $stmt->bindValue(':id', $id);
        $stmt->execute();

        $response['success'] = true;

    } catch (PDOException $e) {
        $response['error'] = $e->getMessage();
    }

} else {
    $response['error'] = "Requête invalide";
}

echo json_encode($response);