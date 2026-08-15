-- =====================================================
-- Base de datos COMPLETA del proyecto (proyecto_tis)
-- Correr este único script para tener todo listo:
-- tablas + los 10 cursos reales del catálogo.
-- =====================================================

CREATE DATABASE IF NOT EXISTS proyecto_tis;
USE proyecto_tis;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('alumno', 'docente', 'administrador') NOT NULL DEFAULT 'alumno',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

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

CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- Los 10 cursos reales del catálogo
-- =====================================================
INSERT INTO cursos (titulo, descripcion, precio, duracion_horas, cupos_disponibles, imagen_url)
VALUES
('Introducción a la Programación con Python',
 'Aprendé los fundamentos de la programación desde cero: variables, condicionales, bucles y funciones, usando Python como lenguaje base.',
 1500.00, 40, 25, 'recursos/imagenes/Programacion_Python.jpg'),

('Lógica de Programación y Algoritmos',
 'Desarrollá el pensamiento lógico necesario para programar: resolución de problemas, diagramas de flujo y diseño de algoritmos.',
 1200.00, 30, 25, 'recursos/imagenes/Introduccion_programacion.jpg'),

('Introducción a la Inteligencia Artificial',
 'Un primer acercamiento a la IA: qué es, cómo funciona y sus aplicaciones actuales, sin necesidad de conocimientos previos avanzados.',
 2200.00, 35, 20, 'recursos/imagenes/Introduccion_IA.jpg'),

('Machine Learning Aplicado',
 'Introducción práctica a machine learning: tipos de aprendizaje, modelos básicos y su implementación con herramientas actuales.',
 2800.00, 45, 15, NULL),

('Desarrollo Web Full Stack',
 'HTML, CSS, JavaScript y conexión con bases de datos: todo lo necesario para construir una página web funcional de principio a fin.',
 3200.00, 80, 20, 'recursos/imagenes/Desarrollo_webFS.jpg'),

('Bases de Datos con MySQL',
 'Diseño de bases de datos relacionales, consultas SQL y administración de datos aplicados a proyectos reales.',
 2000.00, 30, 25, NULL),

('Excel para el trabajo y el estudio',
 'Aprendé a usar Excel desde cero: fórmulas, tablas, gráficos y funciones básicas para organizar y analizar información.',
 1000.00, 20, 30, NULL),

('Word: documentos profesionales',
 'Manejo completo de Word: formato de textos, tablas, índices automáticos y plantillas para informes y trabajos.',
 900.00, 15, 30, NULL),

('Introducción a Micro:bit',
 'Primeros pasos con la placa Micro:bit: programación por bloques, sensores y proyectos simples de electrónica.',
 1400.00, 25, 20, NULL),

('Programación con Scratch',
 'Iniciación a la programación para principiantes usando Scratch: lógica, secuencias, bucles y creación de videojuegos simples.',
 1100.00, 20, 25, NULL);
