<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\ContratoController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\MovimentacaoController;
use App\Http\Controllers\Api\ParcelaController;
use App\Http\Controllers\Api\ProjetoController;
use App\Http\Controllers\Api\RateioController;
use App\Http\Controllers\Api\RelatorioController;
use App\Http\Controllers\Api\SocioController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/me/senha', [AuthController::class, 'senha']);

    Route::get('/dashboard', DashboardController::class);

    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('projetos', ProjetoController::class);
    Route::apiResource('contratos', ContratoController::class);

    Route::get('/parcelas', [ParcelaController::class, 'index']);
    Route::post('/contratos/{contrato}/parcelas', [ParcelaController::class, 'store']);
    Route::put('/parcelas/{parcela}', [ParcelaController::class, 'update']);
    Route::delete('/parcelas/{parcela}', [ParcelaController::class, 'destroy']);
    Route::get('/parcelas/{parcela}/simular', [ParcelaController::class, 'simular']);
    Route::post('/parcelas/{parcela}/receber', [ParcelaController::class, 'receber']);
    Route::post('/parcelas/{parcela}/estornar', [ParcelaController::class, 'estornar']);

    Route::get('/rateios', [RateioController::class, 'show']);
    Route::put('/rateios', [RateioController::class, 'update']);
    Route::delete('/rateios/projeto/{projetoId}', [RateioController::class, 'destroy']);

    Route::get('/saldos', [MovimentacaoController::class, 'saldos']);
    Route::get('/movimentacoes', [MovimentacaoController::class, 'index']);
    Route::post('/movimentacoes', [MovimentacaoController::class, 'store']);
    Route::delete('/movimentacoes/{movimentacao}', [MovimentacaoController::class, 'destroy']);
    Route::post('/repasses', [MovimentacaoController::class, 'repasse']);
    Route::post('/transferencias', [MovimentacaoController::class, 'transferencia']);

    Route::get('/relatorios/mensal', [RelatorioController::class, 'mensal']);

    Route::get('/socios', [SocioController::class, 'index']);
    Route::post('/socios', [SocioController::class, 'store']);
    Route::put('/socios/{socio}', [SocioController::class, 'update']);

    Route::post('/documentos', [DocumentoController::class, 'store']);
    Route::get('/documentos/{documento}/download', [DocumentoController::class, 'download']);
    Route::delete('/documentos/{documento}', [DocumentoController::class, 'destroy']);
});
