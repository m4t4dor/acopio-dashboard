<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Empresa>
 */
class EmpresaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ruc' => fake()->unique()->numerify('###########'),
            'nombre_legal' => fake()->company,
            'nombre_comercial' => fake()->companySuffix,
            'direccion' => fake()->address,
            'apisunat_persona_id' => Str::random(10),
            'apisunat_persona_token' => Str::random(32),
            'activo' => fake()->boolean,
        ];
    }
}
