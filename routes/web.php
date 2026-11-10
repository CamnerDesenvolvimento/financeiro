<?php

use Illuminate\Support\Facades\Route;

// SPA React: qualquer rota que não seja /api cai no app.blade.php
Route::view('/{any?}', 'app')->where('any', '^(?!api|up).*$');
