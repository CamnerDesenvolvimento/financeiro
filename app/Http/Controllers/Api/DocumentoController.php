<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Contrato;
use App\Models\Documento;
use App\Models\Projeto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentoController extends Controller
{
    private const TIPOS = [
        'contrato' => Contrato::class,
        'projeto' => Projeto::class,
        'cliente' => Cliente::class,
    ];

    /** POST /documentos  (multipart) tipo=contrato|projeto|cliente, id, arquivo */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|in:'.implode(',', array_keys(self::TIPOS)),
            'id' => 'required|integer',
            'arquivo' => 'required|file|max:20480', // 20 MB
            'nome' => 'nullable|string|max:255',
        ]);

        $model = self::TIPOS[$data['tipo']]::findOrFail($data['id']);
        $file = $request->file('arquivo');
        // disco "local" = storage/app/private (fora do public, só acessível via API autenticada)
        $caminho = $file->store("documentos/{$data['tipo']}/{$model->id}", 'local');

        $doc = $model->documentos()->create([
            'nome' => $data['nome'] ?: $file->getClientOriginalName(),
            'caminho' => $caminho,
            'mime' => $file->getClientMimeType(),
            'tamanho' => $file->getSize(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json($doc, 201);
    }

    public function download(Documento $documento)
    {
        abort_unless(Storage::disk('local')->exists($documento->caminho), 404);
        $ext = pathinfo($documento->caminho, PATHINFO_EXTENSION);
        $nome = str_ends_with(strtolower($documento->nome), '.'.strtolower($ext)) ? $documento->nome : $documento->nome.'.'.$ext;

        return Storage::disk('local')->download($documento->caminho, $nome);
    }

    public function destroy(Documento $documento)
    {
        Storage::disk('local')->delete($documento->caminho);
        $documento->delete();

        return response()->noContent();
    }
}
