import React, { useState } from 'react';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from './lib/apiBase';

const API_BASE_URL = getApiBaseUrl();

type ScannerResult = {
  fileType: 'PDF' | 'Image';
  apiUsed: string;
  data: Record<string, any>;
  fileName: string;
};

export default function DocumentScannerRunner() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const processDocument = async () => {
      if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const fileType = file.type;
      const isPDF = fileType === 'application/pdf';
      const isImage = fileType.startsWith('image/');

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
        reader.readAsDataURL(file);
      });

      let apiPrompt: string;
      let contentBlock: Record<string, unknown>;

      if (isPDF) {
        apiPrompt = 'PDF via backend MediFlow';
        contentBlock = {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        };
      } else if (isImage) {
        apiPrompt = 'Image via backend MediFlow';
        contentBlock = {
          type: 'image',
          source: {
            type: 'base64',
            media_type: fileType,
            data: base64Data,
          },
        };
      } else {
        throw new Error('Type de fichier non supporte. Veuillez utiliser PDF ou image (JPG, PNG, etc.)');
      }

      const response = await fetch(`${API_BASE_URL}/archive/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || (isPDF ? 'application/pdf' : 'image/jpeg'),
          dataUrl: `data:${file.type || (isPDF ? 'application/pdf' : 'image/jpeg')};base64,${base64Data}`,
          meta: {
            sourceExample: 'document-scanner.jsx',
            flow: apiPrompt,
            originalContentBlock: contentBlock,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const envelope = await response.json();
      const payload = envelope?.data ?? envelope;
      const textContent = payload?.rawText || payload?.fullText || '';

      let parsedResult: Record<string, any>;
      try {
        parsedResult = {
          documentType: payload?.documentTitle || (isPDF ? 'PDF' : 'Image'),
          summary: isPDF ? payload?.fullText : undefined,
          extractedText: isImage ? payload?.fullText : undefined,
          extractedData: payload?.structuredData ?? [],
          keyInformation: payload?.structuredData ?? [],
          rawResponse: textContent,
        };
      } catch {
        parsedResult = {
          documentType: isPDF ? 'PDF' : 'Image',
          rawResponse: textContent,
        };
      }

      setResult({
        fileType: isPDF ? 'PDF' : 'Image',
        apiUsed: isPDF ? 'Backend MediFlow (PDF)' : 'Backend MediFlow (Image)',
        data: parsedResult,
        fileName: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-800">Numerisation de Documents</h1>
            <p className="text-gray-600">Demo directe du fichier `document-scanner.jsx` avec Claude API.</p>
          </div>

          <div className="mb-8">
            <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-indigo-500 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <Upload className="mb-4 h-16 w-16 text-gray-400" />
                <p className="mb-2 text-lg font-medium text-gray-700">
                  {file ? file.name : 'Cliquez pour telecharger un document'}
                </p>
                <p className="text-sm text-gray-500">PDF ou Image (JPG, PNG, WEBP)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
            </label>
          </div>

          {file && (
            <button
              onClick={processDocument}
              disabled={processing}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {processing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <FileText className="h-6 w-6" />
                  Analyser le Document
                </>
              )}
            </button>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Erreur</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-3 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-500" />
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-green-800">Traitement Reussi</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>Fichier:</strong> {result.fileName}</p>
                    <p><strong>Type:</strong> {result.fileType}</p>
                    <p><strong>API Utilisee:</strong> {result.apiUsed}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800">
                  {result.fileType === 'PDF' ? (
                    <FileText className="h-6 w-6 text-indigo-600" />
                  ) : (
                    <Image className="h-6 w-6 text-indigo-600" />
                  )}
                  Donnees Extraites
                </h2>

                <div className="mb-4 rounded-lg bg-indigo-50 p-4">
                  <h3 className="mb-2 font-semibold text-indigo-900">Type de Document</h3>
                  <p className="text-indigo-700">{String(result.data.documentType || 'Non identifie')}</p>
                </div>

                {result.data.summary && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-4">
                    <h3 className="mb-2 font-semibold text-blue-900">Resume</h3>
                    <p className="whitespace-pre-wrap text-blue-700">{String(result.data.summary)}</p>
                  </div>
                )}

                {result.data.extractedText && (
                  <div className="mb-4 rounded-lg bg-purple-50 p-4">
                    <h3 className="mb-2 font-semibold text-purple-900">Texte Extrait (OCR)</h3>
                    <p className="whitespace-pre-wrap text-purple-700">{String(result.data.extractedText)}</p>
                  </div>
                )}

                {Array.isArray(result.data.extractedData) && result.data.extractedData.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Donnees Structurees</h3>
                    <div className="space-y-2">
                      {result.data.extractedData.map((item: Record<string, unknown>, index: number) => (
                        <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium text-gray-700">{key}:</span>
                              <span className="text-gray-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(result.data.keyInformation) && result.data.keyInformation.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Informations Cles</h3>
                    <div className="space-y-2">
                      {result.data.keyInformation.map((item: Record<string, unknown>, index: number) => (
                        <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium text-gray-700">{key}:</span>
                              <span className="text-gray-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.data.rawResponse && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-2 font-semibold text-gray-900">Reponse Complete</h3>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-700">
                      {String(result.data.rawResponse)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">APIs Utilisees dans l exemple</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li><strong>PDF:</strong> backend MediFlow, puis Claude ou Gemini cote serveur</li>
              <li><strong>Images:</strong> backend MediFlow, puis Claude ou Gemini cote serveur</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
