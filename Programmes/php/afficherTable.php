<?php
require_once 'connectDB.php'; // Connexion à la BDD via $bdd

$tableName = $_GET['table'] ?? 'capteur'; // Table par défaut : capteur
$pdo = $bdd; // Alias pour clarté

$tablesAutorisees = ['capteur', 'carte', 'serre', 'chapelle', 'utilisateur']; // Liste blanche
if (!in_array($tableName, $tablesAutorisees)) {
    http_response_code(400); // Code erreur HTTP
    echo "Table non autorisée.";
    exit;
}

$query = $pdo->query("SELECT * FROM $tableName"); // Exécution de la requête
$rows = $query->fetchAll(PDO::FETCH_ASSOC); // Résultats sous forme associative
$columns = array_keys($rows[0] ?? []); // Noms des colonnes (si des données)
$columns[] = 'Actions'; // Colonne supplémentaire pour boutons

ob_start(); // Démarre la temporisation de sortie
?>

<table class="tabParametrage">
    <thead>
        <tr>
            <?php foreach ($columns as $col): ?>
                <th class="<?= strtolower($col) ?>">
                    <?= htmlspecialchars($col) ?> <!-- Affiche le nom de la colonne -->
                    <?php if ($col === 'Actions' && in_array($tableName, ['carte', 'capteur'])): ?>
                        <img src="../img/plus.svg" alt="Ajouter" class="addImage"
                             title="Ajouter" style="cursor:pointer; margin-left:4px"
                             onclick="openAddModal()"> <!-- Bouton ajouter -->
                    <?php endif; ?>
                </th>
            <?php endforeach; ?>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($rows as $row): ?>
            <tr>
                <?php foreach ($columns as $col): ?>
                    <td class="<?= strtolower($col) ?>">
                        <?php if ($col === 'Actions'): ?>
                            <?php
                                $idKey = array_keys($row)[0]; // Clé primaire (ex : IdCapteur)
                                $id = $row[$idKey]; // Valeur ID
                                $rowJSON = htmlspecialchars(json_encode($row), ENT_QUOTES, 'UTF-8'); // Encodage JSON sécurisé
                            ?>
                            <img src="../img/modifier.svg" alt="Modifier" class="modifyImage"
                                 data-id="<?= $id ?>" data-row="<?= $rowJSON ?>"
                                 onclick="openEditModal(JSON.parse(this.getAttribute('data-row')))"
                                 style="cursor:pointer"> <!-- Bouton modifier -->

                            <img src="../img/moins.svg" alt="Supprimer" class="deleteImage"
                                 data-id="<?= $id ?>" style="cursor:pointer"
                                 onclick="if(confirm('Confirmer suppression ?')) deleteRow('<?= $tableName ?>', <?= $id ?>)">
                                 <!-- Bouton supprimer -->
                        <?php else: ?>
                            <?= htmlspecialchars($row[$col] ?? '') ?> <!-- Affiche valeur cellule -->
                        <?php endif; ?>
                    </td>
                <?php endforeach; ?>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php
echo ob_get_clean(); // Affiche le contenu mis en tampon