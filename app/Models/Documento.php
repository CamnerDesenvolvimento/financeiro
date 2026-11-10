<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Documento extends Model
{
    protected $table = 'documentos';

    protected $fillable = ['documentable_type', 'documentable_id', 'nome', 'caminho', 'mime', 'tamanho', 'user_id'];

    protected $hidden = ['caminho'];

    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
