#!/bin/sh

echo "Rodando migrações do banco de dados..."
npx prisma migrate deploy

echo "Gerando Prisma Client..."
npx prisma generate

echo "Iniciando a aplicação..."
exec node cmd/main.js
