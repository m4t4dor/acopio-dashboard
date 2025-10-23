<?php

namespace Tests\Unit;

use App\Classes\ComprobanteBuilder;
use App\Classes\ComprobanteItemBuilder;
use App\Enums\EComprobanteDocumentoTipoValues;
use App\Enums\EComprobanteImpuestoTipoValues;
use App\Enums\EComprobanteTipoValues;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ComprobanteBoletaTest extends TestCase
{
    use DatabaseTransactions;
    
    public function test_crear_boleta()
    {
        $empresa = Empresa::factory()->create([
            'ruc' => '12345678901',
            'nombre_legal' => 'Empresa de prueba',
            'nombre_comercial' => 'Empresa de prueba',
            'direccion' => 'Av. Prueba 123',
            'activo' => true,
            'apisunat_persona_id' => 'personaId',
            'apisunat_persona_token' => 'personaToken',
        ]);

        $usuario = User::factory()->create([
            'empresa_id' => $empresa->id,
            'rol' => 'ADMINISTRADOR',
            'activo' => true,
        ]);

        $tipo = EComprobanteTipoValues::BOLETA->value;
        $serie = 'B001';
        $numero = '00000020';
        $fechaEmision = "2025-03-08";
        $horaEmision = "23:20:00";
        $observacionesNotas = 'Boleta de prueba';
        $clienteDocumentoTipo = EComprobanteDocumentoTipoValues::DNI->value;
        $clienteDocumentoNumero = '12345678';
        $clienteDenominacion = 'Cliente de prueba';
        $clienteDireccion = 'Av. Prueba 123';
        $modificacionTipo = null;
        $modificacionSerie = null;
        $modificacionNumero = null;
        $modificacionTipoNota = null;
        $modificacionMotivoNota = null;
        $totalIGV = 30.51;
        $totalGravada = 169.49;
        $totalExonerada = 200;
        $totalInafecta = 0;
        $total = 400;
        $detalles = [
            [
                'unidad_medida' => 'NIU',
                'codigo' => 'Con codigo',
                'descripcion' => 'Producto con impuesto',
                'cantidad' => 2,
                'operacion_tipo' => EComprobanteImpuestoTipoValues::GRAVADA->value,
                'precio' => 100,
            ],
            [
                'unidad_medida' => 'NIU',
                'codigo' => '',
                'descripcion' => 'Producto sin impuesto',
                'cantidad' => 2,
                'operacion_tipo' => EComprobanteImpuestoTipoValues::EXONERADA->value,
                'precio' => 100,
            ]
        ];

        $comprobante = new ComprobanteBuilder();
        $comprobante
            ->setUsuario($usuario)
            ->setTipo($tipo)
            ->setSerie($serie)
            ->setNumero($numero)
            ->setFechaEmision($fechaEmision)
            ->setHoraEmision($horaEmision)
            ->setObservaciones($observacionesNotas)
            ->setClienteDocumentoTipo($clienteDocumentoTipo)
            ->setClienteDocumentoNumero($clienteDocumentoNumero)
            ->setClienteDenominacion($clienteDenominacion)
            ->setClienteDireccion($clienteDireccion)
            ->setModificacionTipo($modificacionTipo)
            ->setModificacionSerie($modificacionSerie)
            ->setModificacionNumero($modificacionNumero)
            ->setModificacionTipoNota($modificacionTipoNota)
            ->setModificacionMotivoNota($modificacionMotivoNota)
            ->setTotalIGV($totalIGV)
            ->setTotalGravada($totalGravada)
            ->setTotalExonerada($totalExonerada)
            ->setTotalInafecta($totalInafecta)
            ->setTotalSinImpuestos($total - $totalIGV)
            ->setTotal($total);

        $items = collect($detalles)->map(function ($detalle, $idx) use ($tipo) {
            return (new ComprobanteItemBuilder($tipo))
                ->setId($idx + 1)
                ->setUnidadMedida($detalle['unidad_medida'])
                ->setCodigo($detalle['codigo'])
                ->setDescripcion($detalle['descripcion'])
                ->setCantidad($detalle['cantidad'])
                ->setOperacionTipo($detalle['operacion_tipo'])
                ->setPrecioUnitario($detalle['precio'])
                ->build();
        })->toArray();

        $comprobante->setItems($items);

        $comprobante = $comprobante->build();

        // extraer json de ejemplo de public/apisunat_boleta_ejemplo.json y convertirlo a array para comparar
        $jsonEjemplo = file_get_contents(base_path('public/apisunat_boleta_ejemplo.json'));
        $jsonEjemplo = json_decode($jsonEjemplo, true);

        $this->assertEquals($jsonEjemplo, $comprobante);
    }


    public function test_crear_boleta_sin_documento()
    {
        $empresa = Empresa::factory()->create([
            'ruc' => '12345678901',
            'nombre_legal' => 'Empresa de prueba',
            'nombre_comercial' => 'Empresa de prueba',
            'direccion' => 'Av. Prueba 123',
            'activo' => true,
            'apisunat_persona_id' => 'personaId',
            'apisunat_persona_token' => 'personaToken',
        ]);

        $usuario = User::factory()->create([
            'empresa_id' => $empresa->id,
            'rol' => 'ADMINISTRADOR',
            'activo' => true,
        ]);

        $tipo = EComprobanteTipoValues::BOLETA->value;
        $serie = 'B001';
        $numero = '00000020';
        $fechaEmision = "2025-03-08";
        $horaEmision = "23:20:00";
        $observacionesNotas = 'Boleta de prueba';
        $clienteDocumentoTipo = EComprobanteDocumentoTipoValues::SIN_DOCUMENTO->value;
        $clienteDocumentoNumero = '';
        $clienteDenominacion = '';
        $clienteDireccion = '';
        $modificacionTipo = null;
        $modificacionSerie = null;
        $modificacionNumero = null;
        $modificacionTipoNota = null;
        $modificacionMotivoNota = null;
        $totalIGV = 30.51;
        $totalGravada = 169.49;
        $totalExonerada = 200;
        $totalInafecta = 0;
        $total = 400;
        $detalles = [
            [
                'unidad_medida' => 'NIU',
                'codigo' => 'Con codigo',
                'descripcion' => 'Producto con impuesto',
                'cantidad' => 2,
                'operacion_tipo' => EComprobanteImpuestoTipoValues::GRAVADA->value,
                'precio' => 100,
            ],
            [
                'unidad_medida' => 'NIU',
                'codigo' => '',
                'descripcion' => 'Producto sin impuesto',
                'cantidad' => 2,
                'operacion_tipo' => EComprobanteImpuestoTipoValues::EXONERADA->value,
                'precio' => 100,
            ]
        ];

        $comprobante = new ComprobanteBuilder();
        $comprobante
            ->setUsuario($usuario)
            ->setTipo($tipo)
            ->setSerie($serie)
            ->setNumero($numero)
            ->setFechaEmision($fechaEmision)
            ->setHoraEmision($horaEmision)
            ->setObservaciones($observacionesNotas)
            ->setClienteDocumentoTipo($clienteDocumentoTipo)
            ->setClienteDocumentoNumero($clienteDocumentoNumero)
            ->setClienteDenominacion($clienteDenominacion)
            ->setClienteDireccion($clienteDireccion)
            ->setModificacionTipo($modificacionTipo)
            ->setModificacionSerie($modificacionSerie)
            ->setModificacionNumero($modificacionNumero)
            ->setModificacionTipoNota($modificacionTipoNota)
            ->setModificacionMotivoNota($modificacionMotivoNota)
            ->setTotalIGV($totalIGV)
            ->setTotalGravada($totalGravada)
            ->setTotalExonerada($totalExonerada)
            ->setTotalInafecta($totalInafecta)
            ->setTotalSinImpuestos($total - $totalIGV)
            ->setTotal($total);

        $items = collect($detalles)->map(function ($detalle, $idx) use ($tipo) {
            return (new ComprobanteItemBuilder($tipo))
                ->setId($idx + 1)
                ->setUnidadMedida($detalle['unidad_medida'])
                ->setCodigo($detalle['codigo'])
                ->setDescripcion($detalle['descripcion'])
                ->setCantidad($detalle['cantidad'])
                ->setOperacionTipo($detalle['operacion_tipo'])
                ->setPrecioUnitario($detalle['precio'])
                ->build();
        })->toArray();

        $comprobante->setItems($items);

        $comprobante = $comprobante->build();

        // extraer json de ejemplo de public/apisunat_boleta_sin_documento_ejemplo.json y convertirlo a array para comparar
        $jsonEjemplo = file_get_contents(base_path('public/apisunat_boleta_sin_documento_ejemplo.json'));
        $jsonEjemplo = json_decode($jsonEjemplo, true);

        $this->assertEquals($jsonEjemplo, $comprobante);
    }
}
