<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movimentacao extends Model
{
    protected $table = 'movimentacoes';

    protected $fillable = [
        'data', 'conta', 'user_id', 'tipo', 'valor', 'origem', 'categoria', 'descricao',
        'percentual', 'parcela_id', 'projeto_id', 'cliente_id', 'grupo', 'created_by',
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
        'valor' => 'decimal:2',
        'percentual' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parcela(): BelongsTo
    {
        return $this->belongsTo(Parcela::class);
    }

    public function projeto(): BelongsTo
    {
        return $this->belongsTo(Projeto::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
