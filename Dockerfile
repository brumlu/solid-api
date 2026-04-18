# Estágio 1: Build e Instalação
FROM node:22-slim AS builder

# Instalar dependências necessárias para o Prisma e OpenSSL
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /solid_api

# Copiar o restante do código
COPY . .

# Instalar todas as dependências
RUN npm i

# Porta que a sua API usa (ajuste se necessário)
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "cmd/main.js"]

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]