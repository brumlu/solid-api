-- 1. ESTRUTURA (TABELAS)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" UUID NOT NULL,
    "default_address_id" UUID,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- 2. ÍNDICES E RELAÇÕES
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_default_address_id_key" ON "users"("default_address_id");
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- FK: Usuário -> Role
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" 
FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: Endereço -> Usuário (Dono)
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: Usuário -> Endereço (Padrão) 
-- ON DELETE SET NULL é vital aqui para não deletar o usuário se o endereço sumir
ALTER TABLE "users" ADD CONSTRAINT "users_default_address_id_fkey" 
FOREIGN KEY ("default_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FKs: RolePermissions
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" 
FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" 
FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Índice Único: 1 usuário = 1 carrinho
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- FK: Carrinho -> Usuário
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: Item do Carrinho -> Carrinho
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" 
FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: Item do Carrinho -> Produto
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" 
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. SEED DATA
-- Permissões
INSERT INTO "permissions" ("name", "description") VALUES 
('ADMIN_ACCESS', 'Acesso total ao sistema'),
('USER_READ', 'Permissão para ler dados de usuário'),
('USER_UPDATE', 'Permissão para atualizar dados de usuário'),
('USER_DELETE', 'Permissão para deletar usuários'),
('PRODUCT_CREATE', 'Permissão para criar produtos'),
('PRODUCT_READ', 'Permissão para visualizar produtos'),
('PRODUCT_UPDATE', 'Permissão para editar produtos e estoque'),
('PRODUCT_DELETE', 'Permissão para excluir produtos')
ON CONFLICT ("name") DO NOTHING;

-- Cargos (Roles)
INSERT INTO "roles" ("name", "description") VALUES 
('ADMIN', 'Administrador do sistema'),
('Default', 'Usuário padrão')
ON CONFLICT ("name") DO NOTHING;

-- Permissões do ADMIN
INSERT INTO "role_permissions" ("roleId", "permissionId") 
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'ADMIN' AND p.name IN ('ADMIN_ACCESS', 'PRODUCT_CREATE', 'PRODUCT_READ', 'PRODUCT_UPDATE', 'PRODUCT_DELETE')
ON CONFLICT DO NOTHING;

-- Permissões do Default
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'Default' AND p.name IN ('USER_READ', 'USER_UPDATE', 'USER_DELETE', 'PRODUCT_READ')
ON CONFLICT DO NOTHING;

-- Adicionando permissões de Carrinho
INSERT INTO "permissions" ("name", "description") VALUES 
('CART_ADD', 'Permissão para adicionar itens ao carrinho'),
('CART_READ', 'Permissão para visualizar o próprio carrinho'),
('CART_DELETE', 'Permissão para remover itens do carrinho')
ON CONFLICT ("name") DO NOTHING;

-- Atribuindo ao usuário 'Default'
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'Default' AND p.name IN ('CART_ADD', 'CART_READ', 'CART_DELETE')
ON CONFLICT DO NOTHING;

-- Atribuindo ao 'ADMIN' (Admin também pode comprar)
INSERT INTO "role_permissions" ("roleId", "permissionId") 
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'ADMIN' AND p.name IN ('CART_ADD', 'CART_READ', 'CART_DELETE')
ON CONFLICT DO NOTHING;