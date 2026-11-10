-- Cria os bancos e um usuário dedicado ao projeto.
-- Troque TROQUE_ESTA_SENHA e use a mesma senha em DB_PASSWORD no .env.
-- Rode uma vez: mysql -u root -p < database/setup-mysql.sql
CREATE DATABASE IF NOT EXISTS financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS financeiro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'financeiro'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
CREATE USER IF NOT EXISTS 'financeiro'@'127.0.0.1' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
GRANT ALL ON financeiro.* TO 'financeiro'@'localhost', 'financeiro'@'127.0.0.1';
GRANT ALL ON financeiro_test.* TO 'financeiro'@'localhost', 'financeiro'@'127.0.0.1';
FLUSH PRIVILEGES;
