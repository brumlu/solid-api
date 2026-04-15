-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1. Inserir as Permissões
INSERT INTO "permissions" ("name", "description") VALUES 
('ADMIN_ACCESS', 'Acesso total ao sistema'),
('USER_READ', 'Permissão para ler dados de usuário'),
('USER_UPDATE', 'Permissão para atualizar dados de usuário'),
('USER_DELETE', 'Permissão para deletar usuários')
ON CONFLICT ("name") DO NOTHING;

-- 2. Inserir os Cargos (Roles)
INSERT INTO "roles" ("name", "description") VALUES 
('ADMIN', 'Administrador do sistema'),
('Default', 'Usuário padrão')
ON CONFLICT ("name") DO NOTHING;

-- 3. Vincular Permissões ao ADMIN (Assumindo que IDs começam em 1)
-- Vincula ADMIN_ACCESS (ID 1) ao ADMIN (ID 1)
INSERT INTO "role_permissions" ("roleId", "permissionId") 
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'ADMIN' AND p.name = 'ADMIN_ACCESS'
ON CONFLICT DO NOTHING;

-- 4. Vincular Permissões ao Default (Usuário comum)
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r.id, p.id FROM "roles" r, "permissions" p 
WHERE r.name = 'Default' AND p.name IN ('USER_READ', 'USER_UPDATE', 'USER_DELETE')
ON CONFLICT DO NOTHING;
