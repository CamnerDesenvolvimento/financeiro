<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rateio extends Model
{
    protected $table = 'rateios';

    protected $fillable = ['projeto_id', 'destino', 'user_id', 'percentual'];

    protected $casts = ['percentual' => 'decimal:2'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function projeto(): BelongsTo
    {
        return $this->belongsTo(Projeto::class);
    }
}
