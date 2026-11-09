import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import fallbackFemininos from "../../public/data/bd_flatter_perfumes_femininos_v2.json";
import fallbackMasculinos from "../../public/data/bd_flatter_perfumes_masculinos_v2.json";
import fallbackCosmeticos from "../../public/data/bd_flatter_cosmeticos_v2.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../public/data");

function readDiskJson(filename: string, fallback: any[]): any[] {
    try {
        const fullPath = path.join(dataDir, filename);
        if (fs.existsSync(fullPath)) {
            const raw = fs.readFileSync(fullPath, "utf-8");
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn(`[products.ts] Aviso ao ler ${filename} do disco:`, e);
    }
    return fallback;
}

export function loadAllProducts(): Product[] {
    const fem = readDiskJson("bd_flatter_perfumes_femininos_v2.json", fallbackFemininos);
    const masc = readDiskJson("bd_flatter_perfumes_masculinos_v2.json", fallbackMasculinos);
    const cosm = readDiskJson("bd_flatter_cosmeticos_v2.json", fallbackCosmeticos);

    const consolidado = [...fem, ...masc, ...cosm];
    return sortCatalogProducts(consolidado.map(mapRawProduct));
}

export interface Product {
    id: string;
    name: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    description: string;
    detailedDescription?: string;
    inspiredBy?: string;
    linkShopee?: string;
    category: string;
    subcategory?: string;
    stock: number;
    isDiscontinued?: boolean;
    images: string[];
    slug: string;
    badge?: string;
    discount?: number;
    specs?: { label: string; value: string }[];
    piramide_olfativa?: { topo: string[]; corpo: string[]; fundo: string[] };
    perfil_sensorial?: string[];
}

function mapRawProduct(raw: any): Product {
    const nome = String(raw.nome || raw.name || "Produto").trim();
    const categoriaRaw = String(raw.categoria || raw.category || "").toLowerCase();
    const generoRaw = String(raw.genero || "").toLowerCase();

    let category = "femininos";
    if (categoriaRaw.includes("cosm") || categoriaRaw.includes("body") || categoriaRaw.includes("hidra") || categoriaRaw.includes("sabonete") || categoriaRaw.includes("splash")) {
        category = "cosmeticos";
    } else if (generoRaw.includes("masc") || categoriaRaw.includes("masc")) {
        category = "masculinos";
    }

    let subcategory = "Perfume Feminino";
    if (category === "masculinos") subcategory = "Perfume Masculino";
    if (category === "cosmeticos") subcategory = raw.categoria || "Cosmético";

    const estoque = typeof raw.estoque_inicial === "number" 
        ? raw.estoque_inicial 
        : (typeof raw.stock === "number" ? raw.stock : 0);

    const statusRaw = String(raw.status || (raw.isDiscontinued ? "Fora de Linha" : "Linha Ativa")).trim();
    const isDiscontinued = statusRaw.toLowerCase() === "fora de linha" 
        || statusRaw.toLowerCase() === "descontinuado" 
        || Boolean(raw.isDiscontinued);

    let badge = statusRaw;
    if (statusRaw.toLowerCase() === "lançamento" || statusRaw.toLowerCase() === "lancamento") {
        badge = "Lançamento";
    } else if (statusRaw.toLowerCase().includes("novidade")) {
        badge = "Últimas Novidades";
    } else if (statusRaw.toLowerCase() === "em estoque" || statusRaw.toLowerCase() === "linha ativa") {
        badge = "Linha Ativa";
    } else if (statusRaw.toLowerCase() === "sob encomenda") {
        badge = "Sob Encomenda";
    } else if (isDiscontinued) {
        badge = estoque > 0 ? "Últimas Unidades" : "Fora de Linha";
    }

    const capaImg = raw.assets?.capa_img 
        || (Array.isArray(raw.images) && raw.images[0]) 
        || "/assets/images/flatter/anuncios_femininos_26/anuncio_f_adore_1x1.jpg";
    const fichaImg = raw.assets?.ficha_tecnica_img 
        || (Array.isArray(raw.images) && raw.images[1]) 
        || null;
    const images = [capaImg, fichaImg].filter(Boolean) as string[];

    let slug = "";
    if (raw.assets?.url_slug) {
        slug = String(raw.assets.url_slug).replace(/^\/|\/$/g, "");
    } else if (raw.slug) {
        slug = String(raw.slug).replace(/^\/|\/$/g, "");
    } else {
        const idSafe = String(raw.id || "000").padStart(3, "0");
        const nomeSafe = nome.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        slug = `${idSafe}-${nomeSafe}`;
    }

    const inspiracao = raw.inspiracao_olfativa || raw.inspiredBy || "";
    const descricaoLonga = raw.descricao_longa || raw.detailed_description || raw.detailedDescription || "";
    const descricaoCurta = raw.description || `${nome}. Inspiração: ${inspiracao || nome}. Família: ${raw.familia_olfativa || ""}. Ocasião: ${raw.ocasiao_uso || ""}.`;

    const specs: { label: string; value: string }[] = [];
    if (inspiracao) specs.push({ label: "Inspiração", value: inspiracao });
    if (raw.familia_olfativa) specs.push({ label: "Família Olfativa", value: raw.familia_olfativa });
    if (raw.genero) specs.push({ label: "Gênero", value: raw.genero });
    const volume = raw.logistica?.volume_liquido_ml || 100;
    specs.push({ label: "Volume", value: `${volume} ml` });

    const price = typeof raw.preco_venda === "number" ? raw.preco_venda : (raw.price || 190);
    const compareAtPrice = typeof raw.preco_shopee === "number" ? raw.preco_shopee : (raw.compareAtPrice || 220);

    return {
        id: String(raw.id || "000"),
        name: nome,
        title: `${nome} - ${subcategory}`,
        price,
        compareAtPrice,
        description: descricaoCurta,
        detailedDescription: descricaoLonga || descricaoCurta,
        inspiredBy: inspiracao,
        linkShopee: raw.link_shopee || raw.linkShopee || "https://shopee.com.br/annaferreira81",
        category,
        subcategory,
        stock: estoque,
        isDiscontinued,
        images,
        slug,
        badge,
        discount: compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : undefined,
        specs,
        piramide_olfativa: raw.piramide_olfativa,
        perfil_sensorial: raw.perfil_sensorial
    };
}

function getProductPriority(p: Product): number {
    const badge = (p.badge || "").toLowerCase();
    // 1. Lançamento
    if (badge.includes("lançamento") || badge.includes("lancamento")) return 1;
    // 2. Últimas Novidades
    if (badge.includes("novidade") || badge.includes("novidades")) return 2;
    // 3. Em estoque
    if (!p.isDiscontinued && p.stock > 0) return 3;
    // 4. Sob encomenda
    if (!p.isDiscontinued && p.stock === 0) return 4;
    // 5. Fora de linha
    if (p.isDiscontinued) return 5;
    return 6;
}

export function sortCatalogProducts(prods: Product[]): Product[] {
    return [...prods].sort((a, b) => {
        const prioA = getProductPriority(a);
        const prioB = getProductPriority(b);
        if (prioA !== prioB) return prioA - prioB;

        // Se pertencer a status com estoque ativo (Lançamento, Novidades, Em estoque), ordenar por estoque decrescente
        if (prioA <= 3) {
            const stockDiff = b.stock - a.stock;
            if (stockDiff !== 0) return stockDiff;
        }

        // Para fora de linha, priorizar unidades residuais antes de histórico esgotado
        if (prioA === 5) {
            const stockDiff = b.stock - a.stock;
            if (stockDiff !== 0) return stockDiff;
        }

        return a.name.localeCompare(b.name);
    });
}

// Catálogo consolidado e dinâmico sempre lido do disco com Proxy transparente
export const products: Product[] = new Proxy([] as Product[], {
    get(target, prop, receiver) {
        const fresh = loadAllProducts();
        const value = Reflect.get(fresh, prop, receiver);
        if (typeof value === "function") {
            return value.bind(fresh);
        }
        return value;
    },
    has(target, prop) {
        return Reflect.has(loadAllProducts(), prop);
    },
    ownKeys(target) {
        return Reflect.ownKeys(loadAllProducts());
    },
    getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(loadAllProducts(), prop);
    }
});

export function getProductBySlug(slug: string): Product | undefined {
    const cleanSlug = slug.replace(/^\/|\/$/g, "");
    const prods = loadAllProducts();
    return prods.find(p => p.slug === cleanSlug || p.slug.endsWith(cleanSlug) || cleanSlug.endsWith(p.slug));
}

export function getProductsByCategory(category: string): Product[] {
    const cat = category.toLowerCase().trim();
    const prods = loadAllProducts();
    if (cat === "todos") return prods;
    return prods.filter(p => p.category.toLowerCase() === cat);
}

export function getRelatedProducts(category: string, currentSlug: string): Product[] {
    const cleanSlug = currentSlug.replace(/^\/|\/$/g, "");
    return loadAllProducts()
        .filter(p => p.category === category && p.slug !== cleanSlug)
        .slice(0, 4);
}
