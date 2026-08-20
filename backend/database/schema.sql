-- =====================================================
-- Base de datos: proyecto_tis
-- Página de venta de cursos informáticos
-- =====================================================

CREATE DATABASE IF NOT EXISTS proyecto_tis;
USE proyecto_tis;

-- ---------------------------------------------------
-- Tabla: usuarios
-- Guarda alumnos, docentes y administradores
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,   -- se guarda encriptada (bcrypt)
    rol ENUM('alumno', 'docente', 'administrador') NOT NULL DEFAULT 'alumno',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- Tabla: cursos
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    duracion_horas INT,
    cupos_disponibles INT DEFAULT 0,
    imagen_url VARCHAR(255),
    docente_id INT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------
-- Tabla: inscripciones
-- Relaciona usuarios (alumnos) con cursos
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- ---------------------------------------------------
-- Tabla: solicitudes_beca
-- Para el formulario de beca.html
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_beca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    curso_id INT,
    motivo TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- ---------------------------------------------------
-- Tabla: mensajes_contacto
-- Para el formulario de contacto.html
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------
-- Datos de ejemplo para probar el catálogo
-- ---------------------------------------------------
INSERT INTO cursos (titulo, descripcion, precio, duracion_horas, cupos_disponibles, imagen_url)
VALUES
('Introducción a la Programación', 'Curso básico de lógica y programación con Python.', 1500.00, 40, 20, '/recursos/img/curso1.jpg'),
('Desarrollo Web Full Stack', 'HTML, CSS, JavaScript y bases de datos desde cero.', 3200.00, 80, 15, '/recursos/img/curso2.jpg'),
('Bases de Datos con MySQL', 'Diseño, consultas y administración de bases de datos relacionales.', 2000.00, 30, 25, '/recursos/img/curso3.jpg');
