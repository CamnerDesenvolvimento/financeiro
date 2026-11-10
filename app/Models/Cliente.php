<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = ['nome', 'tipo', 'documento', 'email', 'telefone', 'contato', 'endereco', 'observacoes', 'ativo'];

    protected $casts = ['ativo' => 'boolean'];

    public function projetos(): HasMany
    {
        return $this->hasMany(Projeto::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'documentable')->latest();
    }
}
