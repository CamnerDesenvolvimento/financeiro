<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $user->ativo || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'E-mail ou senha inválidos.']);
        }

        return ['token' => $user->createToken('web')->plainTextToken, 'user' => $user];
    }

    public function me(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function senha(Request $request)
    {
        $data = $request->validate([
            'senha_atual' => 'required|current_password:sanctum',
            'nova_senha' => 'required|min:6|confirmed',
        ]);
        $request->user()->update(['password' => $data['nova_senha']]);

        return response()->noContent();
    }
}
