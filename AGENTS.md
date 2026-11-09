# AGENTS.md — Diretivas de Orquestração & Agentes (Antigravity IDE)

## 1\. Visão Geral & Escopo do Projeto

O ecossistema **gratidao.live** é composto por uma vitrine de perfumaria/cosméticos e blog com arquitetura *local-first*. Opera com dados desacoplados em arquivos JSON versionados, distribuídos via Cloudflare (Free-Tier) para um PWA moderno (Astro \+ Tailwind) e aplicativos nativos Android, iOS e Desktop (Flutter Monorepo), integrando Firebase Auth (Google Sign-In) e Firestore para dados voláteis (estoque e pedidos).

---

## 2\. Personas de Agentes Especializados

### 🤖 `@architect` (System Architect & Cloudflare/Firebase Gatekeeper)

* **Responsabilidade:** Garantir a coerência entre repositórios, integridade do protocolo de versionamento estático e cumprimento irrestrito dos limites dos Free-Tiers (Cloudflare Pages/R2 \+ Firebase Spark).  
* **Diretivas:**  
  * Vetar qualquer dependência com custo recorrente obrigatório.  
  * Garantir que assets de mídia pesada residam no Cloudflare R2 ou storage com custo zero de egress, nunca estourando o limite de 25 MB do Cloudflare Pages.  
  * Manter o desacoplamento estrito entre `gratidao-live` (Web/Serverless) e `gratidao-flutter` (App/Admin).  
  * Assegurar que chaves secretas de parceiros (Melhor Envio, InfinitePay e Firebase Service Account) sejam consumidas exclusivamente via variáveis de ambiente nas Cloudflare Pages Functions.

### 🤖 `@web-engineer` (Astro PWA, Theme & Content Specialist)

* **Responsabilidade:** Manutenção e evolução do repositório `gratidao-live`.  
* **Diretivas:**  
  * Utilizar o tema base `techstore-ecommers` (Astro \+ Tailwind CSS \+ React Islands), refatorando-o integralmente para a identidade olfativa oficial Ana Ferreira / Gratidão Shop.  
  * Expurgar toda estética escura/gamer/tech do tema original, implementando os tokens oficiais da marca: Bordô Luxo (`#6E0D25`), Dourado Premium (`#D4A33D`), Rosé Elegante (`#DB9ABA`), Champagne (`#F6EFE8`) e Grafite Premium (`#2F2F2F`), com tipografias `Cinzel` (títulos) e `Montserrat` (textos).  
  * Estruturar a experiência móvel no conceito de **App Shell** com Bottom Navigation fixa e View Transitions nativas.  
  * Conectar o carrinho existente às rotas serverless `/api/frete` (Melhor Envio) e `/api/pagamento` (InfinitePay).  
  * Garantir funcionamento offline do PWA via Service Worker para assets e arquivos `/data/*.json`.

### 🤖 `@flutter-engineer` (Mobile & Desktop Core Developer)

* **Responsabilidade:** Manutenção do monorepo `gratidao-flutter` (`core`, `mobile`, `admin`).  
* **Diretivas:**  
  * Centralizar todos os modelos de dados, serialização JSON e validações dentro de `packages/gratidao_core`.  
  * No `apps/gratidao_mobile`, priorizar experiência *offline-first* utilizando banco local embarcado (Isar/Hive), Firebase Auth (Google Sign-In / E-mail) e Firestore para estoque em tempo real.  
  * No `apps/gratidao_admin`, implementar interface desktop para Windows/macOS com manipulação direta do sistema de arquivos para exportação dos pacotes de release diretamente na pasta `/public/data/` do repositório web.

### 🤖 `@data-curator` (Catalog & Logistics Schema Specialist)

* **Responsabilidade:** Manter a consistência semântica e estrutural das bases olfativas originadas do `bd_flatter`.  
* **Diretivas:**  
  * Assegurar que nenhum produto seja gerado sem os arrays obrigatórios: `piramide_olfativa` (topo, corpo, fundo), `perfil_sensorial` e metadados de logística (`peso_bruto_gramas`, `dimensoes_embalagem`).  
  * Garantir integridade referencial: caminhos em `assets.ficha_tecnica_img` devem apontar para caminhos válidos.

---

## 3\. Protocolo de Release & Publicação

```
[Ação no Admin Desktop (Flutter)]
               │
               ▼
   Validação de Dados & Logística (@data-curator)
               │
               ▼
   Geração do Pacote Versionado (version.json + products_vX.json)
               │
               ▼
   Gravação direta em `gratidao-live/public/data/`
               │
               ▼
   `git commit & push` no repositório `gratidao-live`
               │
               ▼
   Cloudflare Pages Build Automático
               │
   ┌───────────┴───────────┐
   ▼                       ▼
PWA atualiza cache      App Flutter detecta nova versão
via Service Worker      via manifesto version.json
```

---

## 4. Regras Operacionais para o Antigravity IDE

1. **Nunca editar arquivos gerados manualmente:** Arquivos em `/public/data/*.json` devem ser originados pelo pipeline do app admin ou scripts validados.
2. **Compatibilidade Retroativa:** Ao modificar a estrutura do modelo Dart ou TypeScript, os clientes antigos não devem quebrar; use campos opcionais com defaults seguros (`.default([])`, `?? null`).
3. **Consistência de Slugs:** URLs canônicas de produtos seguem o padrão `/{id}-{slug-normalizado}/` (ex: `/001-adore/`).

---

## 5. Regras de Status, Estoque e Ciclo de Vida do Produto

Todo o ecossistema (`gratidao-live`, `gratidao_mobile`, `gratidao_admin` e `gratidao_core`) opera sob a seguinte máquina de estados e fluxo de vida do produto:

### 5.1. Definição dos Status Canônicos

* **`"Lançamento"`**:
  * **Conceito:** Produto recém-cadastrado ou em evidência promocional máxima.
  * **Regra de Venda:** Sub-conjunto especial de *"Em estoque"*, disponível para venda direta normal com estoque maior que zero (`estoque > 0`).
  * **Destaques:** Elegível com prioridade máxima (Prioridade 1) para vitrines e destaques.
  * **Transição:** Se o estoque baixar a zero, transiciona de comportamento para *"Sob Encomenda"*.

* **`"Últimas Novidades"`**:
  * **Conceito:** Produtos recém-chegados de coleções recentes que sucedem os lançamentos principais.
  * **Regra de Venda:** Disponível para venda com estoque ativo (`estoque > 0`), ocupando a Prioridade 2 na vitrine.
  * **Transição:** Normaliza para *"Em estoque"* conforme o tempo ou para *"Sob Encomenda"* se o estoque baixar a zero.

* **`"Em estoque"`**:
  * **Conceito:** Status comercial básico regular de produto ativo no catálogo (Prioridade 3).
  * **Regra de Venda:** Disponível para venda direta normal com estoque maior que zero (`estoque > 0`).
  * **Transição:** Se o estoque baixar a zero, muda automaticamente de comportamento para *"Sob Encomenda"*.

* **`"Sob Encomenda"`**:
  * **Conceito:** Produto ativo de linha regular, porém sem estoque imediato (`estoque == 0`, Prioridade 4).
  * **Regra de Venda:** Disponível para venda normal sob encomenda (prazo rápido de fábrica).
  * **Transição:** Ao receber reposição (`estoque > 0`), volta a ser *"Em estoque"*.

* **`"Fora de linha"`**:
  * **Conceito:** Produto retirado definitivamente de circulação e fabricação (não haverá reposição, Prioridade 5).
  * **Com Estoque Residual (`estoque > 0`):** Exibe badge de *"Últimas Unidades"*. **Venda direta permitida** enquanto durarem os frascos residuais.
  * **Com Estoque Zerado (`estoque == 0`):** Modo *"Histórico / Consulta"*. Botões de ação (Adicionar à Sacola / Encomenda) **desabilitados**. O produto permanece catalogado exclusivamente para consulta da pirâmide olfativa e histórico da marca.

### 5.2. Fluxo de Vida e Transições (State Machine)

```
             [Novo Cadastro]
                    │
                    ▼
            ┌───────────────┐
            │   Lançamento  │ (Prioridade 1, Destaques, Estoque > 0)
            └───────┬───────┘
                    │ Transição de Novidade
                    ▼
            ┌───────────────┐
            │ Últimas Novid.│ (Prioridade 2, Recém-chegados, Estoque > 0)
            └───────┬───────┘
                    │ Período de novidade expirado ou normalização
                    ▼
            ┌───────────────┐
            │   Em estoque  │ (Prioridade 3, Venda Normal, Estoque > 0)
            └───┬───────▲───┘
   Estoque == 0 │       │ Reposição de Fábrica (Estoque > 0)
            ┌───▼───────┴───┐
            │ Sob Encomenda │ (Prioridade 4, Sob encomenda, Estoque == 0)
            └───────────────┘
                    │
                    │ Retirada Definitiva de Circulação
                    ▼
            ┌───────────────┐
            │ Fora de linha │ ── Estoque > 0 ──► [Venda Ativa: Últimas Unidades]
            └───────┬───────┘
                    │ Estoque == 0
                    ▼
      [Histórico & Consulta (Venda Desabilitada)]
```

### 5.3. Matriz de Comportamento na Interface

| Status | Estoque | Badge Visual | Botão de Ação / Compra |
| :--- | :--- | :--- | :--- |
| **Lançamento** | `> 0` | `Lançamento` (Dourado/Bordô) | Habilitado (`Comprar Lançamento`) |
| **Últimas Novidades** | `> 0` | `Últimas Novidades` (Bordô/Dourado) | Habilitado (`Adicionar à Sacola`) |
| **Em estoque** | `> 0` | `Em Estoque` (Verde) | Habilitado (`Adicionar à Sacola`) |
| **Sob Encomenda** | `== 0` | `Sob Encomenda` (Âmbar) | Habilitado (`Pedir Sob Encomenda`) |
| **Fora de linha** | `> 0` | `Últimas Unidades` (Laranja) | Habilitado (`Comprar Últimas Unidades`) |
| **Fora de linha** | `== 0` | `Fora de Linha` (Cinza) | **DESABILITADO** (`Apenas Consulta`) |

---

## 6. Regra Universal de Ordenação dos Produtos

A ordenação de produtos é padronizada para todo o ecossistema com distinção estrita entre a experiência do cliente e a visão operacional do gestor:

### 6.1. Ordenação ao Cliente (Web Store & Mobile App)

Nas vitrines voltadas ao consumidor final (`gratidao-live` e `gratidao_mobile`), os produtos **devem** ser ordenados rigorosamente pelos status e na seguinte sequência:

1. **`Lançamento`** (prioridade máxima, elegível aos banners e início);
2. **`Últimas Novidades`** (novidades da estação e recém-chegados);
3. **`Em estoque`** (produtos ativos disponíveis para entrega imediata, com critério de desempate por quantidade de estoque decrescente);
4. **`Sob encomenda`** (produtos de linha sem estoque local, disponíveis sob encomenda de fábrica);
5. **`Fora de linha`** (produtos descontinuados, priorizando unidades residuais antes dos esgotados em modo histórico).

*Critério secundário de desempate:* Quantidade de estoque decrescente e ordem alfabética de nome.

### 6.2. Exceção Obrigatória: Listagem do Admin (Desktop & Web)

No painel administrativo (`apps/gratidao_admin`), a listagem de catálogo operacional **NÃO** segue a ordenação mercadológica do cliente. 

* **Regra:** Deve ser ordenado exclusivamente pelo **identificador numérico em ordem crescente** (ex: `#001`, `#002`, `#003`, ..., `#036`, `#101`, `#102`...).
* **Motivação:** Garantir localização rápida, previsibilidade sequencial e controle de cadastro por faixa de ID (#001 a #099 Femininos, #101 a #199 Masculinos, #201 a #299 Cosméticos).



