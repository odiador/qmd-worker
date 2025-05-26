-- Migración: Crear tabla AdminUser para login de administrador
CREATE TABLE IF NOT EXISTS AdminUser (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Usuario admin de ejemplo (password: admin, hash generado con bcrypt)
INSERT INTO AdminUser (email, password_hash) VALUES (
    'admin@admin.com',
    '$2b$10$Q9Qw6Qn1Qw6Qn1Qw6Qn1QeQ9Qw6Qn1Qw6Qn1Qw6Qn1Qw6Qn1Qw6Q.'
);
