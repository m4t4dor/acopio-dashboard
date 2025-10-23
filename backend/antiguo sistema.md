pawnshop=# select * from "Caja";
 id | id_sucursal | id_empleado_apertura | id_empleado_cierre |     fecha_apertura      |      fecha_cierre       | monto_inicial | monto_final | estado  |       created_at        |       updated_at        
----+-------------+----------------------+--------------------+-------------------------+-------------------------+---------------+-------------+---------+-------------------------+-------------------------
  1 |           1 |                    1 |                  1 | 2025-05-28 19:20:25.953 | 2025-05-28 19:25:48.251 |        100.00 |       50.00 | CERRADA | 2025-05-28 19:20:25.955 | 2025-05-28 19:25:48.252
  2 |           1 |                    1 |                    | 2025-05-29 00:04:52.377 |                         |       1000.00 |     1000.00 | ABIERTA | 2025-05-29 00:04:52.379 | 2025-05-29 00:04:52.379


  pawnshop=# select * from "OperacionCaja";
 id | id_caja |  tipo   | monto  |       descripcion        | referencia |          fecha          |       created_at        |       updated_at        
----+---------+---------+--------+--------------------------+------------+-------------------------+-------------------------+-------------------------
  1 |       3 | INGRESO | 100.00 | abono de capital de caja |            | 2025-06-01 21:20:23.755 | 2025-06-01 21:20:23.757 | 2025-06-01 21:20:23.757
  2 |       3 | EGRESO  |  50.00 | Compra de caramelos      |            | 2025-06-01 21:21:34.551 | 2025-06-01 21:21:34.552 | 2025-06-01 21:21:34.552


pawnshop=# select * from "Pago";
 id | id_prestamo | id_empleado | monto | fecha_pago | tipo_pago | metodo_pago | numero_operacion | comprobante | created_at | updated_at | descripcion | id_cronograma_pago 
----+-------------+-------------+-------+------------+-----------+-------------+------------------+-------------+------------+------------+-------------+--------------------