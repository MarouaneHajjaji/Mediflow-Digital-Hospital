<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\HttpException;
use App\Core\Request;
use App\Repositories\PatientRepository;
use App\Services\AccessControl;
use App\Services\AuthService;

final class ArchiveController
{
    private const MAX_FILE_SIZE = 20 * 1024 * 1024;
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
    ];

    public function __construct(
        private readonly PatientRepository $patients = new PatientRepository()
    ) {
    }

    public function serverInfo(Request $request): array
    {
        $auth = new AuthService();
        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost:8000');
        $scheme = $this->requestScheme();
        $localIp = $this->detectLocalIp();
        $port = $this->resolvePort($host);
        $scanHost = $this->resolveScanHost($host, $localIp, $port);
        $basePath = $this->resolveBasePath();

        return [
            'scan_url' => sprintf(
                '%s://%s%s/scan?token=%s',
                $scheme,
                $scanHost,
                $basePath,
                rawurlencode($auth->issueScanToken($request->user()))
            ),
            'api_base_url' => sprintf('%s://%s%s/api', $scheme, $host, $basePath),
            'local_ip' => $localIp,
            'host' => $host,
        ];
    }

    public function index(Request $request): array
    {
        $documents = $this->readDocuments();
        if (!AccessControl::isAdmin($request->user())) {
            $visiblePatients = $this->patients->all(AccessControl::patientFilters($request->user(), [
                'archived' => null,
            ]));
            $visibleIds = array_map(static fn (array $patient): string => (string) $patient['id'], $visiblePatients);
            $visibleNames = array_map(static fn (array $patient): string => (string) $patient['name'], $visiblePatients);

            $documents = array_values(array_filter($documents, static function (array $document) use ($visibleIds, $visibleNames): bool {
                $patientId = (string) ($document['patient_id'] ?? '');
                $patientName = (string) ($document['patient_name'] ?? '');

                return $patientId === '' || in_array($patientId, $visibleIds, true) || in_array($patientName, $visibleNames, true);
            }));
        }

        return [
            'items' => array_map([$this, 'transformDocument'], $documents),
        ];
    }

    public function patients(Request $request): array
    {
        $patients = $this->patients->allForArchive(AccessControl::patientFilters($request->user(), [
            'archived' => 0,
        ]));

        return [
            'items' => array_map(
                fn (array $patient): array => [
                    'id' => (string) $patient['id'],
                    'name' => (string) $patient['name'],
                    'patient_code' => (string) ($patient['patient_code'] ?? ''),
                    'age' => isset($patient['age']) ? (int) $patient['age'] : null,
                    'entry_date' => $patient['entry_date'] ?? null,
                    'exit_date' => $patient['exit_date'] ?? null,
                    'treating_doctor' => $patient['treating_doctor'] ?? null,
                ],
                $patients
            ),
        ];
    }

    public function analyze(Request $request): array
    {
        $payload = $request->all();
        $dataUrl = trim((string) ($payload['dataUrl'] ?? ''));
        $fileName = trim((string) ($payload['fileName'] ?? 'document'));
        $mimeType = trim((string) ($payload['mimeType'] ?? ''));

        if ($dataUrl === '') {
            throw new HttpException('Aucun document a analyser.', 422);
        }

        [$resolvedMimeType, $binary] = $this->decodeDataUrl($dataUrl, $mimeType);
        $text = $this->isPdfMimeType($resolvedMimeType)
            ? $this->analyzePdfDocument($fileName, $resolvedMimeType, $binary)
            : $this->analyzeImageDocument($resolvedMimeType, $binary);

        return $this->normalizeAnalysisResult($text);
    }

    private function analyzeImageDocument(string $mimeType, string $binary): string
    {
        if ($this->hasAnthropicApiKeyFor('image')) {
            return $this->analyzeImageWithAnthropic($mimeType, $binary);
        }

        return $this->analyzeImageWithGemini($mimeType, $binary);
    }

    private function analyzePdfDocument(string $fileName, string $mimeType, string $binary): string
    {
        if ($this->hasAnthropicApiKeyFor('pdf')) {
            return $this->analyzePdfWithAnthropic($mimeType, $binary);
        }

        return $this->analyzePdfWithGemini($fileName, $mimeType, $binary);
    }

    public function upload(Request $request): array
    {
        $this->ensureStorage();

        $file = $_FILES['image'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new HttpException('Aucune image reçue.', 400);
        }

        $mimeType = mime_content_type((string) $file['tmp_name']) ?: (string) ($file['type'] ?? '');
        $originalName = (string) ($file['name'] ?? '');
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg');
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

        $mimeAllowed = in_array($mimeType, self::ALLOWED_MIME_TYPES, true);
        $extensionAllowed = in_array($extension, $allowedExtensions, true);

        if (!$mimeAllowed && !$extensionAllowed) {
            throw new HttpException('Format de fichier non supporté.', 422);
        }

        if ((int) ($file['size'] ?? 0) > self::MAX_FILE_SIZE) {
            throw new HttpException('Le fichier dépasse la taille maximale autorisée.', 422);
        }

        $filename = sprintf('scan_%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(4)), $extension);
        $targetPath = $this->uploadsPath() . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
            throw new HttpException('Impossible de sauvegarder le scan.', 500);
        }

        $payload = $request->all();
        $patientId = trim((string) ($payload['patientId'] ?? ''));
        $patient = $patientId !== '' ? $this->patients->find((int) $patientId) : null;
        if ($patient !== null && !AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        $patientFirstName = trim((string) ($payload['patientFirstName'] ?? ''));
        $patientLastName = trim((string) ($payload['patientLastName'] ?? ''));
        $patientDisplayName = trim($patientFirstName . ' ' . $patientLastName);
        $patientAge = trim((string) ($payload['patientAge'] ?? ''));
        $entryNumber = trim((string) ($payload['entryNumber'] ?? ''));

        $document = [
            'id' => 'DOC-' . time() . '-' . bin2hex(random_bytes(2)),
            'name' => trim((string) ($payload['name'] ?? '')) ?: $this->defaultDocumentName((string) ($payload['type'] ?? 'scan')),
            'date' => date('Y-m-d'),
            'text' => trim((string) ($payload['text'] ?? '')),
            'patient_id' => $patientId !== '' ? $patientId : null,
            'patient_name' => $patient['name'] ?? ($patientDisplayName !== '' ? $patientDisplayName : null),
            'patient_first_name' => $patientFirstName !== '' ? $patientFirstName : null,
            'patient_last_name' => $patientLastName !== '' ? $patientLastName : null,
            'patient_age' => ctype_digit($patientAge) ? (int) $patientAge : null,
            'entry_number' => $entryNumber !== '' ? $entryNumber : null,
            'entry_date' => trim((string) ($payload['entryDate'] ?? '')) ?: null,
            'exit_date' => trim((string) ($payload['exitDate'] ?? '')) ?: null,
            'treating_doctor' => trim((string) ($payload['treatingDoctor'] ?? '')) ?: null,
            'image_url' => '/uploads/archive/' . $filename,
            'type' => trim((string) ($payload['type'] ?? 'scan')) ?: 'scan',
            'description' => trim((string) ($payload['description'] ?? '')),
            'source' => trim((string) ($payload['source'] ?? 'mobile')) ?: 'mobile',
            'uploaded_at' => date(DATE_ATOM),
            'filename' => $filename,
            'original_name' => $originalName !== '' ? $originalName : $filename,
            'mime_type' => $mimeType,
            'size' => (int) ($file['size'] ?? 0),
        ];

        $documents = $this->readDocuments();
        array_unshift($documents, $document);
        $this->writeDocuments($documents);

        return [
            'item' => $this->transformDocument($document),
        ];
    }

    public function destroyDocument(Request $request, string $id): array
    {
        $documents = $this->readDocuments();
        $targetIndex = null;
        $targetDocument = null;

        foreach ($documents as $index => $document) {
            if ((string) ($document['id'] ?? '') === $id) {
                $targetIndex = $index;
                $targetDocument = $document;
                break;
            }
        }

        if ($targetIndex === null || $targetDocument === null) {
            throw new HttpException('Document archive introuvable.', 404);
        }

        unset($documents[$targetIndex]);
        $this->writeDocuments($documents);

        $filename = (string) ($targetDocument['filename'] ?? '');
        if ($filename === '' && isset($targetDocument['image_url'])) {
            $filename = basename((string) $targetDocument['image_url']);
        }

        if ($filename !== '') {
            $filePath = $this->uploadsPath() . DIRECTORY_SEPARATOR . $filename;
            if (is_file($filePath)) {
                @unlink($filePath);
            }
        }

        return ['deleted' => true];
    }

    public function exportDocumentImage(Request $request, string $id): never
    {
        $documents = $this->readDocuments();
        $targetDocument = null;

        foreach ($documents as $document) {
            if ((string) ($document['id'] ?? '') === $id) {
                $targetDocument = $document;
                break;
            }
        }

        if ($targetDocument === null) {
            throw new HttpException('Document archive introuvable.', 404);
        }

        $filename = (string) ($targetDocument['filename'] ?? '');
        if ($filename === '' && isset($targetDocument['image_url'])) {
            $filename = basename((string) $targetDocument['image_url']);
        }

        if ($filename === '') {
            throw new HttpException('Aucune image associée à ce document.', 404);
        }

        $filePath = $this->uploadsPath() . DIRECTORY_SEPARATOR . $filename;
        if (!is_file($filePath)) {
            throw new HttpException('Fichier image introuvable.', 404);
        }

        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', (string) ($targetDocument['name'] ?? 'document'));
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $downloadName = $safeName . ($extension !== '' ? '.' . $extension : '');

        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . (string) filesize($filePath));
        header('Content-Disposition: attachment; filename="' . $downloadName . '"');
        readfile($filePath);
        exit;
    }

    private function analyzeImageWithAnthropic(string $mimeType, string $binary): string
    {
        $response = $this->anthropicJsonRequest('image', [
            'model' => $this->anthropicModelFor('image'),
            'max_tokens' => 4000,
            'messages' => [[
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'image',
                        'source' => [
                            'type' => 'base64',
                            'media_type' => $mimeType,
                            'data' => base64_encode($binary),
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => $this->anthropicImagePrompt(),
                    ],
                ],
            ]],
        ]);

        return $this->extractAnthropicText($response);
    }

    private function analyzePdfWithAnthropic(string $mimeType, string $binary): string
    {
        $response = $this->anthropicJsonRequest('pdf', [
            'model' => $this->anthropicModelFor('pdf'),
            'max_tokens' => 4000,
            'messages' => [[
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'document',
                        'source' => [
                            'type' => 'base64',
                            'media_type' => $mimeType,
                            'data' => base64_encode($binary),
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => $this->anthropicPdfPrompt(),
                    ],
                ],
            ]],
        ]);

        return $this->extractAnthropicText($response);
    }

    private function analyzeImageWithGemini(string $mimeType, string $binary): string
    {
        $response = $this->geminiJsonRequest(
            sprintf('https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s', $this->geminiModel(), rawurlencode($this->geminiApiKeyFor('image'))),
            [
                'contents' => [[
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => base64_encode($binary),
                            ],
                        ],
                        [
                            'text' => $this->imagePrompt(),
                        ],
                    ],
                ]],
            ]
        );

        return $this->extractGeminiText($response);
    }

    private function analyzePdfWithGemini(string $fileName, string $mimeType, string $binary): string
    {
        $apiKey = $this->geminiApiKeyFor('pdf');
        $uploadedFile = $this->uploadPdfToGemini($fileName, $mimeType, $binary, $apiKey);
        $fileUri = (string) ($uploadedFile['uri'] ?? '');
        $uploadedMimeType = (string) ($uploadedFile['mimeType'] ?? $mimeType);

        if ($fileUri === '') {
            throw new HttpException('Gemini n a pas retourne d URI pour le PDF.', 502);
        }

        $response = $this->geminiJsonRequest(
            sprintf('https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s', $this->geminiModel(), rawurlencode($apiKey)),
            [
                'contents' => [[
                    'parts' => [
                        [
                            'file_data' => [
                                'mime_type' => $uploadedMimeType,
                                'file_uri' => $fileUri,
                            ],
                        ],
                        [
                            'text' => $this->pdfPrompt(),
                        ],
                    ],
                ]],
            ]
        );

        return $this->extractGeminiText($response);
    }

    private function uploadPdfToGemini(string $fileName, string $mimeType, string $binary, string $apiKey): array
    {
        if (!function_exists('curl_init')) {
            throw new HttpException('Extension cURL requise pour envoyer le PDF a Gemini.', 500);
        }

        $start = curl_init(sprintf('https://generativelanguage.googleapis.com/upload/v1beta/files?key=%s', rawurlencode($apiKey)));
        if ($start === false) {
            throw new HttpException('Impossible d initialiser l upload Gemini.', 500);
        }

        curl_setopt_array($start, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Goog-Upload-Protocol: resumable',
                'X-Goog-Upload-Command: start',
                'X-Goog-Upload-Header-Content-Length: ' . strlen($binary),
                'X-Goog-Upload-Header-Content-Type: ' . $mimeType,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'file' => [
                    'display_name' => $fileName,
                ],
            ], JSON_UNESCAPED_SLASHES),
        ]);

        $startResponse = curl_exec($start);
        if ($startResponse === false) {
            $message = curl_error($start) ?: 'Upload Gemini impossible.';
            curl_close($start);
            throw new HttpException($message, 502);
        }

        $statusCode = (int) curl_getinfo($start, CURLINFO_HTTP_CODE);
        $headerSize = (int) curl_getinfo($start, CURLINFO_HEADER_SIZE);
        $headers = substr($startResponse, 0, $headerSize);
        curl_close($start);

        if ($statusCode < 200 || $statusCode >= 300) {
            throw new HttpException('Gemini a refuse l initialisation du PDF.', 502);
        }

        if (!preg_match('/X-Goog-Upload-URL:\s*(.+)\r?/i', $headers, $matches)) {
            throw new HttpException('URL d upload Gemini introuvable pour le PDF.', 502);
        }

        $uploadUrl = trim($matches[1]);
        $upload = curl_init($uploadUrl);
        if ($upload === false) {
            throw new HttpException('Impossible de continuer l upload du PDF.', 500);
        }

        curl_setopt_array($upload, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Length: ' . strlen($binary),
                'X-Goog-Upload-Offset: 0',
                'X-Goog-Upload-Command: upload, finalize',
            ],
            CURLOPT_POSTFIELDS => $binary,
        ]);

        $uploadResponse = curl_exec($upload);
        if ($uploadResponse === false) {
            $message = curl_error($upload) ?: 'Finalisation du PDF impossible.';
            curl_close($upload);
            throw new HttpException($message, 502);
        }

        $uploadStatus = (int) curl_getinfo($upload, CURLINFO_HTTP_CODE);
        curl_close($upload);

        if ($uploadStatus < 200 || $uploadStatus >= 300) {
            throw new HttpException('Gemini a refuse le contenu du PDF.', 502);
        }

        $decoded = json_decode($uploadResponse, true);
        if (!is_array($decoded)) {
            throw new HttpException('Reponse invalide de Gemini pendant l upload du PDF.', 502);
        }

        return is_array($decoded['file'] ?? null) ? $decoded['file'] : $decoded;
    }

    private function geminiJsonRequest(string $url, array $payload): array
    {
        if (!function_exists('curl_init')) {
            throw new HttpException('Extension cURL requise pour contacter Gemini.', 500);
        }

        $ch = curl_init($url);
        if ($ch === false) {
            throw new HttpException('Impossible d initialiser la requete Gemini.', 500);
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            $message = curl_error($ch) ?: 'Erreur reseau Gemini.';
            curl_close($ch);
            throw new HttpException($message, 502);
        }

        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($response, true);
        if ($statusCode < 200 || $statusCode >= 300) {
            $message = is_array($decoded) ? $this->extractGeminiError($decoded) : 'Erreur Gemini.';
            throw new HttpException($message, 502);
        }

        if (!is_array($decoded)) {
            throw new HttpException('Reponse JSON invalide de Gemini.', 502);
        }

        return $decoded;
    }

    private function anthropicJsonRequest(string $documentType, array $payload): array
    {
        if (!function_exists('curl_init')) {
            throw new HttpException('Extension cURL requise pour contacter Anthropic.', 500);
        }

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        if ($ch === false) {
            throw new HttpException('Impossible d initialiser la requete Anthropic.', 500);
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'anthropic-version: 2023-06-01',
                'x-api-key: ' . $this->anthropicApiKeyFor($documentType),
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            $message = curl_error($ch) ?: 'Erreur reseau Anthropic.';
            curl_close($ch);
            throw new HttpException($message, 502);
        }

        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($response, true);
        if ($statusCode < 200 || $statusCode >= 300) {
            $message = is_array($decoded) ? $this->extractAnthropicError($decoded) : 'Erreur Anthropic.';
            throw new HttpException($message, 502);
        }

        if (!is_array($decoded)) {
            throw new HttpException('Reponse JSON invalide de Anthropic.', 502);
        }

        return $decoded;
    }

    private function extractGeminiText(array $response): string
    {
        $parts = $response['candidates'][0]['content']['parts'] ?? null;
        if (!is_array($parts)) {
            throw new HttpException('Aucun texte exploitable n a ete retourne par Gemini.', 502);
        }

        $chunks = [];
        foreach ($parts as $part) {
            $text = is_array($part) ? ($part['text'] ?? null) : null;
            if (is_string($text) && trim($text) !== '') {
                $chunks[] = $text;
            }
        }

        $result = trim(implode("\n", $chunks));
        if ($result === '') {
            throw new HttpException('Gemini a retourne une reponse vide.', 502);
        }

        return $result;
    }

    private function extractAnthropicText(array $response): string
    {
        $parts = $response['content'] ?? null;
        if (!is_array($parts)) {
            throw new HttpException('Aucun texte exploitable n a ete retourne par Anthropic.', 502);
        }

        $chunks = [];
        foreach ($parts as $part) {
            $type = is_array($part) ? ($part['type'] ?? null) : null;
            $text = is_array($part) ? ($part['text'] ?? null) : null;
            if ($type === 'text' && is_string($text) && trim($text) !== '') {
                $chunks[] = $text;
            }
        }

        $result = trim(implode("\n", $chunks));
        if ($result === '') {
            throw new HttpException('Anthropic a retourne une reponse vide.', 502);
        }

        return $result;
    }

    private function normalizeAnalysisResult(string $text): array
    {
        $cleanText = trim(str_replace(['```json', '```'], '', $text));
        $decoded = json_decode($cleanText, true);

        if (!is_array($decoded)) {
            return [
                'fullText' => $text,
                'structuredData' => [],
                'patientInfo' => null,
                'documentTitle' => null,
                'rawText' => $text,
            ];
        }

        $documentType = isset($decoded['documentType']) && is_string($decoded['documentType']) ? $decoded['documentType'] : null;
        $summary = isset($decoded['summary']) && is_string($decoded['summary']) ? $decoded['summary'] : null;
        $extractedText = isset($decoded['extractedText']) && is_string($decoded['extractedText']) ? $decoded['extractedText'] : null;
        $rawFullText = isset($decoded['fullText']) && is_string($decoded['fullText']) ? $decoded['fullText'] : null;
        $combinedText = trim(implode("\n\n", array_filter([$documentType, $summary, $extractedText, $rawFullText], fn ($value) => is_string($value) && $value !== '')));
        $structuredData = $decoded['structuredData'] ?? $decoded['extractedData'] ?? $decoded['keyInformation'] ?? [];
        $title = isset($decoded['documentTitle']) && is_string($decoded['documentTitle'])
            ? $decoded['documentTitle']
            : $documentType;

        return [
            'fullText' => $combinedText !== '' ? $combinedText : $text,
            'structuredData' => is_array($structuredData) ? $structuredData : [],
            'patientInfo' => isset($decoded['patientInfo']) && is_array($decoded['patientInfo']) ? $decoded['patientInfo'] : null,
            'documentTitle' => $title,
            'rawText' => $text,
        ];
    }

    private function decodeDataUrl(string $dataUrl, string $fallbackMimeType = ''): array
    {
        if (!preg_match('/^data:([^;]+);base64,(.*)$/s', $dataUrl, $matches)) {
            throw new HttpException('Format de document invalide.', 422);
        }

        $mimeType = trim($matches[1]) !== '' ? trim($matches[1]) : $fallbackMimeType;
        $binary = base64_decode($matches[2], true);

        if ($binary === false) {
            throw new HttpException('Document illisible.', 422);
        }

        return [$mimeType !== '' ? $mimeType : 'application/octet-stream', $binary];
    }

    private function isPdfMimeType(string $mimeType): bool
    {
        return strtolower($mimeType) === 'application/pdf';
    }

    private function hasAnthropicApiKeyFor(string $documentType): bool
    {
        return $this->resolveAnthropicApiKeyFor($documentType) !== null;
    }

    private function anthropicApiKeyFor(string $documentType): string
    {
        $apiKey = $this->resolveAnthropicApiKeyFor($documentType);
        if ($apiKey === null) {
            throw new HttpException(sprintf('Cle API Anthropic manquante ou invalide sur le serveur pour %s.', $documentType), 500);
        }

        return $apiKey;
    }

    private function resolveAnthropicApiKeyFor(string $documentType): ?string
    {
        $specificKey = match ($documentType) {
            'pdf' => $this->envValue('ANTHROPIC_API_KEY_PDF'),
            'image' => $this->envValue('ANTHROPIC_API_KEY_IMAGE'),
            default => '',
        };
        $apiKey = trim($specificKey !== '' ? $specificKey : $this->envValue('ANTHROPIC_API_KEY'));
        $invalidKeys = ['', 'YOUR_ANTHROPIC_API_KEY', 'MY_ANTHROPIC_API_KEY', 'ta_cle_anthropic'];

        return in_array($apiKey, $invalidKeys, true) ? null : $apiKey;
    }

    private function geminiApiKeyFor(string $documentType): string
    {
        $specificKey = match ($documentType) {
            'pdf' => $this->envValue('GEMINI_API_KEY_PDF'),
            'image' => $this->envValue('GEMINI_API_KEY_IMAGE'),
            default => '',
        };
        $apiKey = trim($specificKey !== '' ? $specificKey : $this->envValue('GEMINI_API_KEY'));
        $invalidKeys = ['', 'YOUR_GEMINI_API_KEY', 'MY_GEMINI_API_KEY', 'ta_cle_gemini'];

        if (in_array($apiKey, $invalidKeys, true)) {
            throw new HttpException(sprintf('Cle API Gemini manquante ou invalide sur le serveur pour %s.', $documentType), 500);
        }

        return $apiKey;
    }

    private function envValue(string $key): string
    {
        return trim((string) ($_ENV[$key] ?? getenv($key) ?: ''));
    }

    private function geminiModel(): string
    {
        return 'gemini-2.5-flash';
    }

    private function anthropicModelFor(string $documentType): string
    {
        $specificModel = match ($documentType) {
            'pdf' => $this->envValue('ANTHROPIC_MODEL_PDF'),
            'image' => $this->envValue('ANTHROPIC_MODEL_IMAGE'),
            default => '',
        };

        return $specificModel !== '' ? $specificModel : ($this->envValue('ANTHROPIC_MODEL') ?: 'claude-sonnet-4-20250514');
    }

    private function imagePrompt(): string
    {
        return 'Extrais tout le texte de cette image de document medical papier. Retourne uniquement un JSON avec fullText, structuredData, patientInfo et documentTitle.';
    }

    private function pdfPrompt(): string
    {
        return 'Lis ce document PDF medical page par page et retourne uniquement un JSON avec fullText, structuredData, patientInfo et documentTitle.';
    }

    private function anthropicImagePrompt(): string
    {
        return 'Analysez cette image de document papier numerise. Extrayez tout le texte visible et identifiez le type de document. Repondez uniquement en JSON avec les cles: documentType, extractedText, keyInformation, documentTitle.';
    }

    private function anthropicPdfPrompt(): string
    {
        return 'Extrayez et analysez le contenu de ce document PDF medical. Repondez uniquement en JSON avec les cles: documentType, summary, extractedData, documentTitle.';
    }

    private function extractGeminiError(array $response): string
    {
        $message = $response['error']['message'] ?? null;
        return is_string($message) && trim($message) !== '' ? $message : 'Erreur Gemini.';
    }

    private function extractAnthropicError(array $response): string
    {
        $message = $response['error']['message'] ?? null;
        return is_string($message) && trim($message) !== '' ? $message : 'Erreur Anthropic.';
    }

    private function storageFile(): string
    {
        return BASE_PATH . '/storage/archive/documents.json';
    }

    private function uploadsPath(): string
    {
        return BASE_PATH . '/public/uploads/archive';
    }

    private function ensureStorage(): void
    {
        $storageDir = dirname($this->storageFile());
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0777, true);
        }

        if (!is_dir($this->uploadsPath())) {
            mkdir($this->uploadsPath(), 0777, true);
        }

        if (!file_exists($this->storageFile())) {
            file_put_contents($this->storageFile(), json_encode(['documents' => []], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
    }

    private function readDocuments(): array
    {
        $this->ensureStorage();
        $json = file_get_contents($this->storageFile()) ?: '{"documents":[]}';
        $decoded = json_decode($json, true);

        return isset($decoded['documents']) && is_array($decoded['documents']) ? $decoded['documents'] : [];
    }

    private function writeDocuments(array $documents): void
    {
        file_put_contents(
            $this->storageFile(),
            json_encode(['documents' => array_values($documents)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
    }

    private function transformDocument(array $document): array
    {
        return [
            'id' => (string) ($document['id'] ?? ''),
            'name' => (string) ($document['name'] ?? ''),
            'date' => (string) ($document['date'] ?? ''),
            'text' => (string) ($document['text'] ?? ''),
            'patientId' => $document['patient_id'] ?? null,
            'patientName' => $document['patient_name'] ?? null,
            'patientFirstName' => $document['patient_first_name'] ?? null,
            'patientLastName' => $document['patient_last_name'] ?? null,
            'patientAge' => $document['patient_age'] ?? null,
            'entryNumber' => $document['entry_number'] ?? null,
            'entryDate' => $document['entry_date'] ?? null,
            'exitDate' => $document['exit_date'] ?? null,
            'treatingDoctor' => $document['treating_doctor'] ?? null,
            'imageUrl' => $document['image_url'] ?? null,
            'type' => $document['type'] ?? null,
            'description' => $document['description'] ?? null,
            'source' => $document['source'] ?? null,
            'uploadedAt' => $document['uploaded_at'] ?? null,
        ];
    }

    private function detectLocalIp(): ?string
    {
        $candidates = gethostbynamel(gethostname()) ?: [];

        foreach ($candidates as $candidate) {
            if (!str_starts_with($candidate, '127.')) {
                return $candidate;
            }
        }

        return null;
    }

    private function requestScheme(): string
    {
        $https = $_SERVER['HTTPS'] ?? '';
        return $https !== '' && $https !== 'off' ? 'https' : 'http';
    }

    private function resolvePort(string $host): string
    {
        if (str_contains($host, ':')) {
            $parts = explode(':', $host);
            $port = end($parts);
            if ($port !== false && ctype_digit($port)) {
                return ':' . $port;
            }
        }

        $serverPort = (string) ($_SERVER['SERVER_PORT'] ?? '');
        if ($serverPort !== '' && ctype_digit($serverPort)) {
            if ($serverPort === '80' || $serverPort === '443') {
                return '';
            }
            return ':' . $serverPort;
        }

        return '';
    }

    private function resolveBasePath(): string
    {
        $scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
        $basePath = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

        if ($basePath === '' || $basePath === '.') {
            return '';
        }

        return $basePath;
    }

    private function defaultDocumentName(string $type): string
    {
        return match ($type) {
            'radio' => 'Radiologie mobile',
            'analyse' => 'Analyse mobile',
            'ordonnance' => 'Ordonnance mobile',
            default => 'Scan mobile',
        };
    }

    private function resolveScanHost(string $host, ?string $localIp, string $port): string
    {
        $publicHost = trim((string) Config::get('app.public_host', ''));
        $publicPort = trim((string) Config::get('app.public_port', ''));

        if ($publicHost !== '') {
            if ($publicPort !== '' && !str_contains($publicHost, ':')) {
                return $publicHost . ':' . $publicPort;
            }

            return $publicHost;
        }

        return $localIp !== null ? $localIp . $port : $host;
    }
}
