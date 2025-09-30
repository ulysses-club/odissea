<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $resultData = [
        'name' => $_GET['name'] ?? 'Аноним',
        'score' => intval($_GET['score'] ?? 0),
        'correctAnswers' => intval($_GET['correctAnswers'] ?? 0),
        'totalQuestions' => intval($_GET['totalQuestions'] ?? 0),
        'date' => $_GET['date'] ?? date('c'),
        'hintsUsed' => intval($_GET['hintsUsed'] ?? 0),
        'percentage' => intval($_GET['percentage'] ?? 0)
    ];

    // Читаем существующие данные
    $winnersFile = '../data/quiz-winners.json';
    $winners = [];
    
    if (file_exists($winnersFile)) {
        $winners = json_decode(file_get_contents($winnersFile), true) ?? [];
    }

    // Добавляем новый результат
    $winners[] = $resultData;

    // Сортируем по очкам (по убыванию) и ограничиваем топ-50
    usort($winners, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    $winners = array_slice($winners, 0, 50);

    // Сохраняем обратно
    file_put_contents($winnersFile, json_encode($winners, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['success' => true, 'message' => 'Result saved']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
