-- Esquema de base de datos relacional para Pedidos360 (Compatible con PostgreSQL y H2)

CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(255) NOT NULL,
    pais VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL,
    sku VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ordenes (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    estado VARCHAR(50) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    CONSTRAINT fk_orden_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS detalles_pedido (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_detalle_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_orden ON detalles_pedido(orden_id);

