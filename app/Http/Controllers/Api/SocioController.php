<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SocioController extends Controller
{
    public function index()
    {
        return User::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'telefone' => 'nullable|string|max:30',
            'socio' => 'boolean',
            'ativo' => 'boolean',
        ]);

        return response()->json(User::create($data), 201);
    }

    public function update(Request $request, User $socio)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($socio->id)],
            'password' => 'nullable|min:6',
            'telefone' => 'nullable|string|max:30',
            'socio' => 'boolean',
            'ativo' => 'boolean',
        ]);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $socio->update($data);

        return $socio;
    }
}
