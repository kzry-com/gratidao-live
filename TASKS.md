# TASKS.md — Backlog de Execução e Status do Ecossistema (Antigravity IDE)

Este documento registra o estado consolidado de implementação e o backlog das frentes de engenharia do ecossistema **gratidao.live** e **gratidao-flutter**.

---

## 🧭 Fase 1: Setup do Repositório Web `gratidao-live` & Identidade Olfativa

- [x] Refatorar tema base Astro + Tailwind CSS para a identidade oficial Ana Ferreira / Gratidão Shop.
- [x] Configurar tokens de design oficiais:
  - Bordô Luxo (`#6E0D25`)
  - Dourado Premium (`#D4A33D`)
  - Rosé Elegante (`#DB9ABA`)
  - Champagne (`#F6EFE8`)
  - Grafite Premium (`#2F2F2F`)
- [x] Importar tipografia nobre Google Fonts: `Cinzel` (títulos/marcas) e `Montserrat` (textos/UI).
- [x] Implementar layout PWA no padrão **App Shell** com Bottom Navigation móvel fixa (Início, Catálogo, Favoritos, Sacola).
- [x] Configurar `public/site.webmanifest` e Service Worker para cache offline.
- [ ] Migrar artigos de blog legados do Jekyll (`_posts/*.md`) para `src/content/blog/` com validação de esquema Zod.

---

## 🗄️ Fase 2: Estrutura de Dados Estáticos, Ciclo de Vida & Ordenação Canônica

- [x] Criar diretório `public/data/` com arquivos de release versionados:
  - `bd_flatter_perfumes_femininos_v2.json` (36 produtos)
  - `bd_flatter_perfumes_masculinos_v2.json` (31 produtos)
  - `bd_flatter_cosmeticos_v2.json` (21 produtos)
  - `version.json` (manifesto consolidado de integridade, contagens e timestamps)
- [x] Implementar máquina de estados e regras canônicas de ciclo de vida do produto:
  - `"Lançamento"`: Destaque máximo, venda direta ativa (`estoque > 0`).
  - `"Últimas Novidades"`: Recém-chegados em catálogo, venda direta ativa (`estoque > 0`).
  - `"Em estoque"`: Status comercial regular ativo (`estoque > 0`).
  - `"Sob Encomenda"`: Linha ativa sem estoque imediato (`estoque == 0`).
  - `"Fora de linha"`: Descontinuado. Com estoque residual (`estoque > 0`), venda permitida como *Últimas Unidades*; ao zerar (`estoque == 0`), modo *Histórico/Consulta* com compras desabilitadas.
- [x] **Regra Universal de Ordenação de Produtos ao Cliente:**
  - Sequência estrita nas vitrines (`gratidao-live` e `gratidao_mobile`):
    1. Lançamento
    2. Últimas Novidades
    3. Em estoque (desempate por maior quantidade de estoque decrescente)
    4. Sob encomenda
    5. Fora de linha (unidades residuais antes dos esgotados históricos)
  - Critério alfabético de nome como desempate estável.
- [x] **Exceção Mandatória na Listagem do Admin (`gratidao_admin`):**
  - Ordenação exclusivamente por identificador numérico em ordem crescente (`#001`, `#002`... `#101`... `#201`...).

---

## 🔄 Fase 3: Pipeline de Release, Leitura Dinâmica & Sincronização em Tempo Real

- [x] Criar endpoint bridge local no servidor de desenvolvimento Astro (`/api/admin/release`) para persistência física direta em `public/data/`.
- [x] Implementar gravação de arquivos JSON no Flutter Admin tanto via `dart:io` (Desktop Windows/macOS) quanto via bridge HTTP (Web).
- [x] Criar leitor dinâmico sob demanda `loadAllProducts()` com `fs.readFileSync` e `Proxy` transparente em `gratidao-live/src/data/products.ts` e `gratidao-live/src/data/home.ts`.
- [x] Integrar watcher do Vite em `astro.config.mjs` monitorando `public/data/`:
  - Detecta qualquer gravação em disco feita pelo Admin (Desktop ou Web);
  - Invalida o cache de módulos do Vite;
  - Dispara sinal de `full-reload` via WebSocket atualizando o navegador instantaneamente sem F5 manual.
- [x] Configurar rotas dinâmicas `/category/[category]` e `/product/[slug]` para resolver produtos atualizados em tempo real.

---

## 📱 Fase 4: Monorepo Flutter (`gratidao-flutter`) & Experiência Mobile

- [x] Estrutura monorepo com pacotes isolados: `packages/gratidao_core`, `apps/gratidao_mobile`, `apps/gratidao_admin`.
- [x] **`packages/gratidao_core`**:
  - Modelos ricos: `Produto`, `PiramideOlfativa`, `Logistica`, `DimensoesEmbalagem`, `ProdutoAssets`.
  - Helpers de ciclo de vida e getters canônicos (`isLancamento`, `isUltimasNovidades`, `isEmEstoque`, `isSobEncomenda`, `isForaDeLinha`, `temEstoqueResidual`, `isApenasConsulta`, `podeComprar`).
  - Comparadores canônicos estáticos: `Produto.comparadorCliente` e `Produto.comparadorAdmin`.
  - Serviço de CEP resiliente com failover automático: OpenCEP primário com fallback transparente para ViaCEP.
  - Bateria de testes unitários automatizados com 100% de aprovação.
- [x] **`apps/gratidao_mobile`**:
  - Cards em 2 colunas com design idêntico à vitrine Web (`aspectRatio: 0.86`, `childAspectRatio: 0.64`).
  - Imagem do produto preenchendo a largura superior com `BoxFit.cover` e bordas suaves.
  - Badges de status estilo pílula (`LINHA ATIVA`, `LANÇAMENTO`, `ÚLTIMAS NOVIDADES`, `ÚLTIMAS UNIDADES`, `FORA DE LINHA`).
  - Linha inferior compacta com título em Cinzel, preço destacado e bullet indicador de status.
  - Sincronização de catálogo com vitrine web (`http://localhost:4321/data/*.json`) e fallback para assets locais.
- [x] **`apps/gratidao_admin`**:
  - Interface desktop/web com painel de catálogo, edição completa de produtos e cadastro com geração automática de próximo ID por faixa de categoria.
  - Dropdown com os 5 status canônicos (`Lançamento`, `Últimas Novidades`, `Em estoque`, `Sob Encomenda`, `Fora de linha`).
  - Auditor de consistência de dados (`@data-curator`).
  - Exportador de release com teste automatizado de ponta a ponta (`release_validation_test.dart`).

---

## ☁️ Fase 5: Serverless Backend & Checkout (Cloudflare Pages Functions)

- [ ] Implementar rota `functions/api/frete.ts` com cálculo de frete via API Melhor Envio v2 utilizando dimensões da cubagem e peso dos produtos.
- [ ] Implementar rota `functions/api/pagamento.ts` para geração de Pix dinâmico via InfinitePay.
- [ ] Implementar webhook `functions/api/webhooks/infinitepay.ts` com validação de payload, autenticação e baixa de estoque no Firestore.

---

## 🔒 Fase 6: Firebase Spark & Segurança

- [ ] Provisionar projeto Firebase no plano Spark (Always Free).
- [ ] Ativar autenticação Firebase Auth (Google Sign-In e E-mail/Senha).
- [x] Elaborar arquivo `firestore.rules` com segurança estrita para coleção `/estoque/geral` e pedidos.
- [ ] Realizar deploy de `firestore.rules` via Firebase CLI e inicializar documento agregador de estoque.
