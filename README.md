# SOLID API
A API foi desenvolvida utilizando Clean Architecture e aplicação dos princípios SOLID, introduzidos por Robert C. Martin. O objetivo principal é a separação de preocupações, garantindo que a lógica de negócio seja independente de ferramentas externas, frameworks ou bancos de dados.

## Tecnologias Utilizadas
Node.js & Javascript

Express.js

Prisma ORM (com PostgreSQL)

Docker + Docker Compose

Vitest + Coverage

Supertest

JWT

Bcrypt

Zod

## Pré-requisitos
Node.js instalado (versão 20 ou superior recomendada).

Docker e Docker Compose instalados e em execução.

## Como Executar o Projeto
**1.** Crie os arquivos .env e .env.test e coloque as informações necessárias descritas no arquivo .env.example.

**2.** Instale as dependências:

```npm i```

**3.** Gere o Prisma Client:

```npx prisma generate```

**4.** Suba os bancos de dados e a aplicação via Docker:

```docker compose up -d```

## Endpoints
Abaixo estão listadas as rotas da API, divididas por domínios de responsabilidade e regras de acesso.

### Usuários (Público)
Acesso livre para novos usuários.

| Método | Rota | Descrição | Validação (Zod) |
| --- | --- | --- | --- |
| POST | /register | Cria uma nova conta no sistema | createUserSchema |
| POST | /login | Autentica o usuário e retorna o Token JWT para acesso às áreas privadas | loginUserSchema |

### Usuários (Privado)
Requer Token JWT e validações específicas de propriedade ou cargo.

| Método | Rota | Descrição | Permissão |
| --- | --- | --- | --- |
| GET | /users | Lista todos os usuários cadastrados no sistema | auth + USER_READ |
| PATCH | /users-update/:id | Atualiza dados do perfil (Nome, e-mail, etc) | auth + isOwnerOrAdmin |
| PATCH | /password-update/:id | Realiza a alteração segura da senha | auth + isOwnerOrAdmin |
| PATCH | /role-update/:id | Altera o cargo/permissão de um usuário | auth + ADMIN_ACCESS |
| PATCH | /setup-admin/:id | Configuração inicial de privilégios administrativos | Acesso Restrito / Interno |
| DELETE | /users/:id | Remove permanentemente a conta do usuário | auth + isOwnerOrAdmin |
| POST | /logout | Encerra a sessão do usuário invalidando o cookie com o token | auth |

### Gestão de Produtos (Privado)
Acesso restrito a administradores ou usuários com permissões específicas de estoque e catálogo.

| Método | Rota | Descrição | Permissão | Validação (Zod) |
| --- | --- | --- | --- | --- |
| GET | /products | Lista os produtos e serviços disponíveis | PRODUCT_READ | - |
| POST | /products | Cadastra um novo produto no catálogo | PRODUCT_CREATE | createProductSchema |
| PATCH | /products/:id/stock | Atualiza apenas a quantidade em estoque | PRODUCT_UPDATE | updateProductSchema |
| PATCH | /products/:id/price | Atualiza apenas o valor do produto | PRODUCT_UPDATE | updateProductSchema |
| PATCH | /products/:id | Atualiza todos os dados de um produto | PRODUCT_UPDATE | updateProductSchema |
| DELETE | /products/:id | Remove permanentemente um produto | PRODUCT_DELETE | - |

## Fluxo de Execução das Rotas
Para garantir a segurança, cada requisição nas rotas privadas passa por um pipeline de processamento antes de chegar ao Controller:

**1. Parser:** O Express converte o corpo da requisição para JSON.

**2. Validator (Zod):** Verifica se os campos enviados estão no formato correto.

**3. Auth (JWT):** Válida se o token enviado no cabeçalho é legítimo.

**4. Permission/Owner Check (RBAC):** Verifica se o usuário tem o "cargo" necessário ou se é o dono do recurso que está tentando alterar.

**5. Execution:** O Controller é finalmente acionado para processar a demanda.

## Camadas do Sistema
**Rotas (Routes):** Definem os endpoints da aplicação e direcionam as requisições HTTP recebidas.

**Controllers:** Atuam como intermediários; recebem a requisição, chamam a lógica necessária e retornam a resposta ao cliente.

**Use Cases:** Contêm as regras de negócio puras. Cada Use Case representa uma ação única no sistema (ex: Registro de Usuário).

**Models (Entidades):** É o núcleo do sistema. Aqui definimos as entidades (ex: Usuário, Produtos) e suas regras de validação intrínsecas. Diferente do Prisma Schema, o Model de Domínio é uma classe ou interface pura que garante a integridade dos dados em toda a aplicação. 

**Repositories:** Camada de abstração de dados. Define interfaces para comunicação com o banco de dados.

**Factories:** Responsáveis pela inversão de dependência, instanciando as classes e injetando as dependências corretas.

## Estratégia de Proteção de Sessão (Cookies)
Para garantir a integridade das credenciais dos usuários, a API implementa uma estratégia de Cookies Seguros para o armazenamento do Token JWT. Diferente do armazenamento em localStorage (vulnerável a ataques de script), o uso de cookies com as diretivas HttpOnly e Secure eleva drasticamente a barreira de segurança do sistema. Além disso, esta estratégia assegura a gestão correta do ciclo de vida da sessão, uma vez que o servidor detém o controle total sobre o seu encerramento (logout).

- **Flag HttpOnly**
   - É uma diretiva que impede que o cookie seja acessado por scripts do lado do cliente (JavaScript).
Benefício: Protege o token contra ataques de XSS (Cross-Site Scripting). Mesmo que um atacante consiga injetar um script malicioso no navegador do usuário, ele não conseguirá "ler" ou roubar o token de autenticação, pois o navegador só permite que o cookie seja lido pelo servidor.

- **Flag Secure**
   - Garante que o cookie seja transmitido apenas através de conexões criptografadas (HTTPS).
Benefício: Impede ataques de Man-in-the-Middle (MitM). Em redes públicas (como Wi-Fi de praças ou terminais), os dados transmitidos sem essa flag poderiam ser interceptados em texto puro. Com o Secure: true, o navegador bloqueia o envio do token se a conexão não for segura.

- **Diretiva SameSite**
   - Controla se o cookie deve ser enviado em requisições vindas de outros sites.
Benefício: Mitiga ataques de CSRF (Cross-Site Request Forgery), garantindo que o token só seja enviado para a API quando a requisição partir do domínio oficial.

## Princípios e Padrões Avançados
- **Controle de Acesso (RBAC)**
   - Implementação de Role-Based Access Control para gerenciar permissões. O sistema valida se o "papel" (ex: ADMIN, Default) do usuário autenticado possui autorização para executar determinadas funções.

- **Tratamento de Erros Funcional (Either.js)**
   - Utilização do padrão Either para lidar com erros de forma previsível, evitando o uso excessivo de exceções. O retorno é dividido em Left (Erro) e Right (Sucesso), processado por um ErrorHandler centralizado.

- **SOLID**

   - **S (Single Responsibility):** Cada classe possui uma responsabilidade única.

   - **O (Open/Closed):** O sistema é aberto para extensão e fechado para modificação.

   - **L (Liskov Substitution):** Implementações podem ser substituídas por suas interfaces sem quebrar o código.

   - **I (Interface Segregation):** Interfaces específicas para evitar dependências desnecessárias.

   - **D (Dependency Inversion):** Inversão de dependência via Factories, dependendo de abstrações e não de implementações.

## Estratégia de Testes e Qualidade de Software
Neste projeto, a confiabilidade do sistema é garantida por meio de testes automatizados que simulam o comportamento real da aplicação, utilizando o princípio da Inversão de Dependência para isolar o ambiente.

### Inversão de Dependência (DIP) aplicada a Testes
Graças ao DIP (Dependency Inversion Principle), a lógica de negócio (Use Cases) não depende de uma implementação específica de banco de dados, mas sim de uma interface (Repository).

- Banco de Dados de Teste: Em vez de usar Mocks (objetos falsos), utilizamos o DIP para injetar uma conexão com um banco de dados PostgreSQL real, criado especificamente para testes (ex: teste_db).

- Isolamento via Docker: Utilizamos o Docker para subir um container de banco de dados exclusivo para os testes. Isso garante que os dados de teste nunca se misturem com os dados de produção ou desenvolvimento, e que o ambiente seja "limpo" a cada execução.

### Ferramentas e Frameworks

**Vitest:** Framework de testes moderno e extremamente rápido, totalmente integrado ao Javascript. É o motor que executa os suítes de testes unitários e de integração.

**Supertest:** Biblioteca utilizada para realizar testes de ponta a ponta (E2E) nas rotas. Ela simula chamadas HTTP reais para o servidor Express.js, permitindo validar se os Controllers, Middlewares e Validadores (Zod) estão funcionando corretamente em conjunto.
### Cobertura de Código (Code Coverage) 
Utilizamos a ferramenta de Coverage nativa do Vitest para gerar relatórios detalhados sobre a abrangência dos testes:
- Métrica de Qualidade: O coverage monitora quais linhas, funções e ramos (branches) do código foram percorridos.
- Foco em Áreas Críticas: Nosso objetivo é manter uma cobertura próxima de 100% nos Use Cases e Models, garantindo que as regras de negócio cruciais para a segurança das usuárias estejam totalmente validadas.

### Testes Automatizados
O projeto possui scripts configurados para rodar testes de integração isolados utilizando um banco de dados de testes (.env.test):

```npm run test:migrate``` Executa o prisma migrate deploy carregando as variáveis do .env.test. Esse comando aplica apenas as migrações pendentes no banco de dados de testes, sem interagir interativamente ou resetar dados. É ideal para ambientes de CI/CD ou para preparar o banco rapidamente.

```npm run test:reset``` Executa o prisma migrate reset usando o .env.test. Ele apaga completamente o banco de dados de testes, recria do zero e roda todas as migrações novamente. Útil para garantir que os testes rodem em um estado totalmente limpo.

```npm run test:studio``` Abre o Prisma Studio (npx prisma studio) conectado ao banco de dados especificado no .env.test. Permite visualizar e editar visualmente os dados gerados durante os testes.

```npm run test``` Roda o conjunto completo de testes com Vitest usando o .env.test. Ele inclui flags avançadas: --coverage (gera relatório de cobertura de código), --pool=forks (isola os testes em processos separados para evitar concorrência no banco) e --fileParallelism=false (executa os arquivos de teste sequencialmente, excelente para testes de integração que manipulam banco de dados para evitar conflitos de registros).

```npm run test:watch``` Roda o Vitest no modo watch (observação) com o .env.test. Ele fica escutando alterações nos arquivos e reexecuta os testes automaticamente sempre que você salva o código.

```npm run test:int``` Roda apenas uma execução rápida (vitest run) dos testes apontando para o .env.test, sem as flags pesadas de cobertura ou controle de paralelismo do comando test.
