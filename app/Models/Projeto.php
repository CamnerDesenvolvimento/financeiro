<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Projeto extends Model
{
    protected $table = 'projetos';

    protected $fillable = ['cliente_id', 'nome', 'descricao', 'status', 'data_inicio', 'data_fim'];

    protected $casts = [
        'data_inicio' => 'date:Y-m-d',
        'data_fim' => 'date:Y-m-d',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    public function parcelas(): HasManyThrough
    {
        return $this->hasManyThrough(Parcela::class, Contrato::class);
    }

    public function rateios(): HasMany
    {
        return $this->hasMany(Rateio::class);
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(Movimentacao::class);
    }

    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'documentable')->latest();
    }
}
