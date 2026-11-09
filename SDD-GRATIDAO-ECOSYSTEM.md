# SDD — Software Design Document: Ecossistema gratidao.live

## 1. Identificação e Visão Geral
* **Projeto:** Re-estruturação gratidao.live
* **Marca:** Ana Ferreira — Perfumes e Vendas Online / Loja Gratidão Shop
* **Segmento:** E-commerce, Catálogo Digital de Perfumaria & Cosméticos e Blog
* **Filosofia Arquitetural:** *Local-First / Serverless Híbrida* (Zero Custo Fixo de Infraestrutura)
* **Plataformas Alvo:** Web PWA, Android, iOS e Desktop (App Administrativo do Lojista)
* **Base de UI Web:** Tema Astro `techstore-ecommers` refatorado para estética de alta perfumaria

---

## 2. Identidade Visual & Design System

A interface e a experiência visual do ecossistema seguem rigorosamente a ficha de identidade visual da marca **Ana Ferreira**:

### 2.1. Conceito e Tom de Voz
* **Conceito:** União entre beleza, sofisticação, fé e empreendedorismo feminino. Monograma AF como assinatura de exclusividade, prosperidade, gratidão e excelência no atendimento (Fundamento: Provérbios 16:3).
* **Personalidade:** Elegante, acolhedora, inspiradora, feminina e confiável.
* **Slogan Principal:** *"Sua essência, sua assinatura."* (Alternativa: *"Beleza, elegância e gratidão em cada detalhe."*).

### 2.2. Design Tokens (Paleta de Cores Canônica)
| Nome do Token | Hexadecimal | Papel no Design System |
|---|---|---|
| **Bordô Luxo** | `#6E0D25` | Cor primária da marca: botões de ação principal (CTA), cabeçalhos nobres, logotipo e elementos de maior hierarquia. |
| **Dourado Premium** | `#D4A33D` | Cor secundária de prestígio: acentos de luxo, ícones de notas olfativas, badges de status, avaliação e detalhes dourados. |
| **Rosé Elegante** | `#DB9ABA` | Cor de apoio: badges sensoriais, estados de hover, chips de notas florais/frutadas e detalhes suaves. |
| **Champagne** | `#F6EFE8` | Cor de fundo padrão (Background do PWA e App Shell): substitui fundos escuros do tema base por contraste quente e acolhedor. |
| **Grafite Premium** | `#2F2F2F` | Cor do corpo tipográfico: textos corridos, fichas de leitura, descrições e ícones neutros com legibilidade balanceada. |

### 2.3. Tipografia
* **Títulos, Nomes de Perfumes e Destaques Nobres:** `Cinzel` (Alternativa de fallback: `Cormorant Garamond`).
* **Textos Corridos, Botões, Tabelas e UI Mobile:** `Montserrat` (Alternativa de fallback: `Poppins`).

### 2.4. Aplicação Gráfica nas Fichas e Pirâmides Olfativas
* **Notas de Topo:** Fundo `#F6EFE8` (Champagne suave) com bordas arredondadas e ícones sutis.
* **Notas de Corpo:** Fundo `#DB9ABA` (Rosé) com texto em Grafite para notas de coração (florais/frutadas).
* **Notas de Fundo:** Fundo tonal `#6E0D25` (Bordô Luxo) com tipografia branca/dourada para notas de fixação (amadeiradas/resinosas).

---

## 3. Base de UI Web: Refatoração do Tema Astro (`techstore-ecommers`)

Para maximizar a velocidade de entrega sem reescrever componentes do zero, o repositório `gratidao-live` utilizará como alicerce o tema **TechStore Ecommers** (`https://astro.build/themes/details/techstore-ecommers/`), github (`https://github.com/Lautaro-R-collins/E-commer-Astro`), submetido a uma reformulação estética e arquitetural:

### 3.1. Componentes Aproveitados
* Gerenciamento de estado de carrinho reativo com Nanostores / LocalStorage.
* Mecanismo de busca e filtros de produtos em tempo real.
* Sliders e carrosséis com suporte a gestos de toque no celular.
* Estrutura estática de páginas de Blog com paginação e tags.

### 3.2. Refatoração Obrigatória
1. **Descarte da Estética "Tech/Dark/Gamer":** Remoção total de neons, paletas escuras e cantos quadrados em favor da paleta `#6E0D25`, `#D4A33D` e `#F6EFE8`, com cantos arredondados suaves (`rounded-xl` / `rounded-2xl`) e sombras difusas de luxo.
2. **Desacoplamento de Dados de Exemplo:** Substituição dos mocks estáticos de eletrônicos pelo consumo do `version.json` e dos catálogos olfativos versionados (`/data/*.json`).
3. **App Shell PWA:** Inclusão de uma **Bottom Navigation Bar** fixa para celular e registro do Service Worker para navegação offline.

---

## 4. Arquitetura de Provedores e Divisão de Serviços

A infraestrutura é desenhada para explorar o potencial máximo das camadas gratuitas (*Free-Tier / Spark*), dividindo as cargas de trabalho entre Cloudflare e Firebase:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE (Edge & CDN)                        │
│                                                                        │
│ • Cloudflare Pages: Hospedagem do PWA Astro (TechStore refatorado).    │
│ • Cloudflare R2: Imagens pesadas e vídeos 9:16 (Banda/Egress R$ 0,00). │
│ • Cloudflare Pages Functions: Gateway seguro de APIs e Webhooks.       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│                      GOOGLE FIREBASE (Dados & Realtime)                │
│                                                                        │
│ • Firebase Auth: Gestão de clientes (Google Sign-In e E-mail/Senha).   │
│ • Firebase Firestore: Estoque em tempo real, perfis e pedidos.         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│                       SERVIÇOS EXTERNOS PARCEIROS                      │
│                                                                        │
│ • Melhor Envio: Cotação e logística de frete (Correios/Jadlog/Loggi).  │
│ • InfinitePay: Processamento de pagamentos Pix dinâmico e cartão.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Arquitetura de Repositórios Git

O projeto é particionado estritamente em **2 repositórios**:

```
├── REPOSITÓRIO 1: gratidao-live (GitHub — Existente)
│   ├── Stack: Astro 4+, Tailwind CSS, Nanostores/React (TechStore Base)
│   ├── Hospedagem: Cloudflare Pages + Pages Functions
│   ├── public/
│   │   ├── data/                 # JSONs versionados de produtos e version.json
│   │   └── assets/               # Imagens de interface e fichas técnicas
│   ├── functions/api/            # Serverless Functions (Node/TypeScript)
│   │   ├── frete.ts              # Integração Melhor Envio
│   │   ├── pagamento.ts          # Emissão de cobrança InfinitePay
│   │   └── webhooks/
│   │       └── infinitepay.ts    # Callback de liquidação e baixa de estoque
│   └── src/                      # Tema refatorado (Cinzel/Montserrat + Paleta Bordô/Dourado)
│
└── REPOSITÓRIO 2: gratidao-flutter (GitHub Monorepo — Novo)
    ├── packages/
    │   └── gratidao_core/        # Modelos Dart, serialização JSON e tokens de cor
    └── apps/
        ├── gratidao_mobile/      # App Android e iOS (Clientes e Consultores)
        └── gratidao_admin/       # App Desktop macOS/Windows (Editor e Publicador)
```

---

## 6. Contratos de Dados & Schemas JSON

### 6.1. Catálogo com Metadados Logísticos (`bd_flatter_perfumes_femininos_v2.json`)
```json
[
  {
    "id": "001",
    "nome": "Adore",
    "genero": "Feminino",
    "inspiracao_olfativa": "Fame (Paco Rabanne)",
    "familia_olfativa": "Chypre Floral / Frutado",
    "piramide_olfativa": {
      "topo": ["Manga", "Bergamota"],
      "corpo": ["Jasmin", "Incenso"],
      "fundo": ["Baunilha", "Sândalo"]
    },
    "perfil_sensorial": ["Doce", "Cremoso", "Moderno", "Urbano", "Fashion", "Versátil", "Equilibrado", "Divertido"],
    "ocasiao_uso": "Dia a dia urbano, trabalho, momentos sociais e lazer (Primavera/Verão)",
    "status": "Linha Ativa",
    "preco_venda": 89.90,
    "logistica": {
      "peso_bruto_gramas": 320,
      "volume_liquido_ml": 100,
      "dimensoes_embalagem": {
        "altura_cm": 14.5,
        "largura_cm": 6.5,
        "comprimento_cm": 6.5
      },
      "fragil": true
    },
    "assets": {
      "ficha_tecnica_img": "/assets/images/flatter/catalogo-fichas-flatter-26/4.jpg",
      "url_slug": "/001-adore/"
    }
  }
]
```

### 6.2. Manifesto de Versão (`version.json`)
```json
{
  "catalog_version": "2026.11.08-v2",
  "min_app_version": "1.0.0",
  "last_updated": "2026-11-08T14:00:00Z",
  "endpoints": {
    "femininos": "/data/bd_flatter_perfumes_femininos_v2.json",
    "masculinos": "/data/bd_flatter_perfumes_masculinos_v2.json"
  },
  "assets_base_url": "https://gratidao.live"
}
```

---

## 7. Estrutura de Banco de Dados (Firebase Firestore)

### 7.1. Coleção `/users/{uid}`
```json
{
  "nome": "Carla Oliveira",
  "email": "carla.oliveira@email.com",
  "telefone": "84988776655",
  "criado_em": "2026-11-08T14:10:00Z",
  "endereco_entrega": {
    "cep": "59000-000",
    "logradouro": "Avenida Prudente de Morais",
    "numero": "1200",
    "complemento": "Bloco B, Apt 401",
    "bairro": "Tirol",
    "localidade": "Natal",
    "uf": "RN"
  }
}
```

### 7.2. Coleção `/orders/{order_id}`
```json
{
  "order_id": "PED-202611-0012",
  "user_id": "k8X9qL01zYwV5aBcDeFgHiJkLmN2",
  "status": "pendente_pagamento",
  "itens": [
    {
      "produto_id": "001",
      "nome": "Adore 100ml",
      "quantidade": 2,
      "preco_unitario": 89.90,
      "subtotal": 179.80
    }
  ],
  "logistica": {
    "transportadora": "Jadlog",
    "servico": ".Package",
    "prazo_dias": 4,
    "valor_frete": 18.50,
    "endereco_destino": {
      "cep": "59000-000",
      "logradouro": "Avenida Prudente de Morais",
      "numero": "1200",
      "complemento": "Bloco B, Apt 401",
      "bairro": "Tirol",
      "localidade": "Natal",
      "uf": "RN"
    }
  },
  "cobranca": {
    "metodo": "pix",
    "id_transacao_infinitepay": "trx_inf_9988776655",
    "pix_qrcode_url": "https://api.infinitepay.io/v2/qr/...",
    "pix_copia_cola": "00020126580014br.gov.bcb.pix..."
  },
  "totais": {
    "subtotal_produtos": 179.80,
    "valor_frete": 18.50,
    "desconto": 0.00,
    "total_geral": 198.30
  },
  "created_at": "2026-11-08T14:15:00Z",
  "paid_at": null
}
```

### 7.3. Documento `/estoque/geral` (Otimização Free-Tier)
```json
{
  "001": { "qtd": 14, "status": "disponivel" },
  "002": { "qtd": 0, "status": "esgotado" },
  "003": { "qtd": 5, "status": "disponivel" }
}
```

---

## 8. Especificação das Cloudflare Pages Functions

| Rota / Endpoint | Método | Objetivo | Integração |
|---|---|---|---|
| `/api/frete` | `POST` | Recebe itens do carrinho e CEP destino; calcula cubagem/peso e consulta cotações. | Melhor Envio API v2 |
| `/api/pagamento` | `POST` | Cria cobrança Pix/Cartão via link/QR Code dinâmico para o pedido informado. | InfinitePay API |
| `/api/webhooks/infinitepay` | `POST` | Recebe notificação de pagamento liquidado, altera pedido para `"pago"` e decrementa estoque. | InfinitePay & Firebase Admin SDK |

---

## 9. Matriz de Cotas e Limites Gratuitos

| Componente | Provedor / Camada | Cota Gratuita | Consumo Estimado |
|---|---|---|---|
| **PWA, Blog e CDN** | Cloudflare Pages | Banda ilimitada / 500 builds/mês | Zero custo |
| **Fichas e Vídeos** | Cloudflare R2 | 10 GB storage / 10M leituras/mês (Zero egress) | Zero custo |
| **API Frete & Pagamento** | Cloudflare Pages Functions | 100.000 requisições/dia | Zero custo (< 5 req/pedido) |
| **Autenticação** | Firebase Auth (Spark) | 50.000 usuários ativos/mês | Zero custo |
| **Estoque & Pedidos** | Firebase Firestore (Spark) | 50.000 leituras/dia e 20.000 gravações/dia | Zero custo (c/ doc agregado) |
| **Cotação de Frete** | Melhor Envio | Gratuita (cobrança apenas ao emitir etiquetas) | Zero custo de consulta |
| **Gateway Pagamentos** | InfinitePay | Sem taxa de adesão ou mensalidade | Taxa padrão por transação aprovada |

---

## 10. Regras de Status, Estoque e Ciclo de Vida do Produto

O gerenciamento de estoque e o ciclo de vida comercial das fragrâncias seguem um protocolo unificado entre todos os clientes (Web PWA, Flutter Mobile, Flutter Admin e backend):

### 10.1. Máquina de Estados e Transições
1. **Lançamento (`status: "Lançamento"`):**
   * Elegível prioritário (Prioridade 1) para vitrines e carrosséis de novidade.
   * Disponível para venda direta imediata com estoque positivo (`estoque > 0`).
   * Caso o estoque zere sem reposição imediata, comporta-se e passa a exibir a condição de *"Sob Encomenda"*.
2. **Últimas Novidades (`status: "Últimas Novidades"`):**
   * Produtos recém-chegados em catálogo (Prioridade 2).
   * Disponível para venda direta imediata com estoque positivo (`estoque > 0`).
   * Transiciona para *"Em estoque"* com o tempo ou para *"Sob Encomenda"* se o estoque zerar.
3. **Em estoque (`status: "Em estoque"`):**
   * Status padrão de comercialização regular (Prioridade 3).
   * Disponível para venda direta (`estoque > 0`).
   * Quando o estoque baixa a zero (`estoque == 0`), muda automaticamente para *"Sob Encomenda"*.
4. **Sob Encomenda (`status: "Sob Encomenda"`):**
   * Produto ativo de linha normal, porém com estoque local zerado (`estoque == 0`, Prioridade 4).
   * Disponível para venda normal com aviso de prazo rápido de expedição de fábrica.
   * Ao registrar nova entrada de estoque (`estoque > 0`), reverte automaticamente para *"Em estoque"*.
5. **Fora de linha (`status: "Fora de linha"`):**
   * Produto descontinuado pela marca (não haverá nova fabricação, Prioridade 5).
   * **Com estoque residual (`estoque > 0`):** Modo *"Últimas Unidades"*. A venda permanece habilitada para liquidação do saldo remanescente.
   * **Ao zerar o estoque (`estoque == 0`):** Modo *"Histórico / Consulta"*. Os botões de compra e encomenda são integralmente desabilitados. O anúncio permanece indexado exclusivamente para consulta técnica da pirâmide olfativa e histórico da marca.

### 10.2. Matriz de Comportamento na Interface

| Status | Estoque | Badge na Interface | Botão de Compra | Comportamento do Carrinho |
|---|---|---|---|---|
| **Lançamento** | `> 0` | `Lançamento` (Dourado/Bordô) | Habilitado (`Comprar Lançamento`) | Adiciona normalmente à sacola |
| **Últimas Novidades** | `> 0` | `Últimas Novidades` (Bordô/Dourado) | Habilitado (`Adicionar à Sacola`) | Adiciona normalmente à sacola |
| **Em estoque** | `> 0` | `Em Estoque` (Verde) | Habilitado (`Adicionar à Sacola`) | Adiciona normalmente à sacola |
| **Sob Encomenda** | `== 0` | `Sob Encomenda` (Âmbar) | Habilitado (`Pedir Sob Encomenda`) | Registra item com prazo de fábrica |
| **Fora de linha** | `> 0` | `Últimas Unidades` (Laranja) | Habilitado (`Comprar Últimas Unidades`) | Permite comprar até o limite de saldo |
| **Fora de linha** | `== 0` | `Fora de Linha` (Cinza) | **DESABILITADO** | Bloqueia compra; exibe aviso histórico |

---

## 11. Regra de Ordenação dos Produtos no Ecossistema

O protocolo de ordenação define como as coleções de fragrâncias e cosméticos são dispostas visualmente, segregando o objetivo de conversão do cliente da necessidade sequencial de gestão:

### 11.1. Ordenação ao Cliente (Web Store PWA e App Mobile)

Tanto na Vitrine Web (`gratidao-live`) quanto no aplicativo para clientes (`gratidao_mobile`), os produtos são ordenados estritamente pela sequência de status:

1. **`Lançamento`**
2. **`Últimas Novidades`**
3. **`Em estoque`**
4. **`Sob encomenda`**
5. **`Fora de linha`**

*Critérios de Desempate:*
* Dentro de status com estoque ativo (1, 2 e 3): ordenação decrescente por quantidade de estoque (`estoque > 0`);
* Para produtos fora de linha (5): unidades residuais remanescentes (`estoque > 0`) antes de itens esgotados (`estoque == 0`);
* Critério alfabético pelo nome do produto como ordenação final estável.

### 11.2. Exceção Mandatória: Listagem do Admin (Desktop & Web)

Na listagem operacional do aplicativo administrativo (`apps/gratidao_admin`), a ordenação mercadológica por status **NÃO** se aplica.

* **Regra:** Os produtos são ordenados pelo **identificador numérico em ordem crescente**:
  `#001, #002, #003, ... #036, ... #101, #102, ... #201, #202...`
* **Implementação:** Método estático `Produto.comparadorAdmin` em `packages/gratidao_core`.
