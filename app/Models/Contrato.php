<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Contrato extends Model
{
    protected $table = 'contratos';

    protected $fillable = [
        'tipo', 'cliente_id', 'projeto_id', 'titulo', 'numero', 'valor_total',
        'data_assinatura', 'data_inicio', 'data_fim', 'status', 'observacoes',
    ];

    protected $casts = [
        'valor_total' => 'decimal:2',
        'data_assinatura' => 'date:Y-m-d',
        'data_inicio' => 'date:Y-m-d',
        'data_fim' => 'date:Y-m-d',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function projeto(): BelongsTo
    {
        return $this->belongsTo(Projeto::class);
    }

    public function parcelas(): HasMany
    {
        return $this->hasMany(Parcela::class)->orderBy('vencimento')->orderBy('numero');
    }

    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'documentable')->latest();
    }
}
