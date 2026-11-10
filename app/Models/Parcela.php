<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcela extends Model
{
    protected $table = 'parcelas';

    protected $fillable = [
        'contrato_id', 'numero', 'descricao', 'valor', 'vencimento', 'status',
        'data_pagamento', 'valor_pago', 'forma_pagamento', 'observacoes',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'valor_pago' => 'decimal:2',
        'vencimento' => 'date:Y-m-d',
        'data_pagamento' => 'date:Y-m-d',
    ];

    protected $appends = ['situacao'];

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(Movimentacao::class);
    }

    /** pendente | atrasado | pago | cancelado */
    public function getSituacaoAttribute(): string
    {
        if ($this->status === 'pendente' && $this->vencimento && $this->vencimento->lt(today())) {
            return 'atrasado';
        }

        return $this->status;
    }
}
