# 🌺 gratidao.live — Vitrine Web & PWA de Alta Perfumaria

Plataforma oficial da **Ana Ferreira / Gratidão Shop** construída com arquitetura *local-first*, servida via Cloudflare Pages com dados desacoplados em JSONs versionados e sincronização em tempo real com o ecossistema móvel e administrativo.

---

## 🎨 Identidade Olfativa & Tokens de Design

* **Bordô Luxo (`#6E0D25`):** Cor primária, cabeçalhos, CTAs principais e identidade nobre da marca.
* **Dourado Premium (`#D4A33D`):** Acentos de luxo, ícones de pirâmide olfativa, badges de lançamento e destaques.
* **Rosé Elegante (`#DB9ABA`):** Badges sensoriais, notas florais/frutadas e detalhes sutis.
* **Champagne (`#F6EFE8`):** Fundo acolhedor e clássico do App Shell (sem tema dark/gamer).
* **Grafite Premium (`#2F2F2F`):** Corpo tipográfico, descrições e contrastes de leitura balanceados.
* **Tipografia:** `Cinzel` (títulos, nomes de fragrâncias e cabeçalhos) e `Montserrat` (textos, especificações e botões).

---

## 🏗️ Arquitetura Técnica

* **Framework:** [Astro 5](https://astro.build/) com Tailwind CSS e React Islands.
* **PWA & App Shell:** Bottom Navigation fixa móvel, manifest e Service Worker para cache offline.
* **Dados Desacoplados:** Catálogo servido a partir de arquivos versionados em `/public/data/`:
  * `bd_flatter_perfumes_femininos_v2.json` (36 itens)
  * `bd_flatter_perfumes_masculinos_v2.json` (31 itens)
  * `bd_flatter_cosmeticos_v2.json` (21 itens)
  * `version.json` (manifesto de integridade e contagem)
* **Leitura Dinâmica:** Módulo `src/data/products.ts` com leitor dinâmico `loadAllProducts()` e Proxy transparente em tempo real.
* **Vite Watcher & Auto-Reload:** Monitoramento ativo da pasta `public/data/` com invalidação de cache e recarregamento automático no navegador via WebSocket assim que o Admin salva alterações em disco.

---

## 📋 Regra Canônica de Ordenação dos Produtos

As vitrines do cliente (`gratidao-live` e `gratidao_mobile`) ordenam os produtos rigorosamente pela sequência de status:

1. **`Lançamento`** (prioridade máxima, destaque na vitrine e banners);
2. **`Últimas Novidades`** (novidades da estação e recém-chegados);
3. **`Em estoque`** (produtos regulares ativos, desempate por quantidade de estoque decrescente);
4. **`Sob encomenda`** (linha ativa com estoque zerado, disponível sob encomenda rápida);
5. **`Fora de linha`** (produtos descontinuados: unidades residuais ativas antes do histórico esgotado).

*Critério de desempate:* Quantidade de estoque decrescente e ordem alfabética.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v20+ (recomendado Node v22+)
* NPM

### Comandos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta padrão 4321)
npm run dev

# Gerar build de produção para Cloudflare Pages
npm run build

# Pré-visualizar o build localmente
npm run preview
```

---

## 🔗 Endpoints Locais Integrados
* **Loja Web:** `http://localhost:4321`
* **API de Release do Admin:** `http://localhost:4321/api/admin/release` (POST para gravação física de pacotes em `public/data/`)
* **Catálogo Versionado Estático:** `http://localhost:4321/data/version.json`
