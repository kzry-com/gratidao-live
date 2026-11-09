import { loadAllProducts, type Product } from "./products";

export const categories = [
    {
        name: "Femininos",
        image: "/assets/images/flatter/anuncios_femininos_26/Novo_Extase_3x4.jpg",
        path: "/category/femininos",
    },
    {
        name: "Masculinos",
        image: "/assets/images/flatter/anuncios_masculinos_26/anuncio_perfume_m_adg_3x4.jpg",
        path: "/category/masculinos",
    },
    {
        name: "Cosméticos & Splashes",
        image: "/assets/images/flatter/20250711-flatter-01.jpg",
        path: "/category/cosmeticos",
    },
    {
        name: "Lançamentos Exclusivos",
        image: "/assets/images/flatter/catalogo-fichas-flatter-26/2.jpg",
        path: "/category/femininos",
    },
];

export const featuredLinks = [
    {
        name: "Sobre Ana Ferreira",
        image: "/assets/images/flatter/logo.jpg",
        path: "/about",
        className: "lg:col-span-2",
        imageClass: "aspect-square lg:aspect-[2/1]",
    },
    {
        name: "Blog da Perfumaria",
        image: "/assets/images/Fragrance-Wheel-Master-04.png",
        path: "/blog",
        className: "lg:col-span-2",
        imageClass: "aspect-square lg:aspect-[2/1]",
    },
    {
        name: "Atendimento & Encomendas",
        image: "/assets/images/flatter/frascos_perfume_masc_fem.jpg",
        path: "/contact",
        className: "lg:col-span-4",
        imageClass: "aspect-[2/1] lg:aspect-[4/1]",
    },
];

// Regra Canônica da Tela Inicial: Lançamentos / Novidades + até 8 itens com maior estoque (máx 16)
export function getFeaturedProducts(): Product[] {
    const all = loadAllProducts();
    const lancamentos = all.filter(p => {
        const b = (p.badge || "").toLowerCase();
        return b.includes("lançamento") || b.includes("lancamento") || b.includes("novidade");
    });
    const lancamentosIds = new Set(lancamentos.map(p => p.id));
    const demaisPorEstoque = all
        .filter(p => !lancamentosIds.has(p.id) && !p.isDiscontinued)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 8);

    return [...lancamentos, ...demaisPorEstoque].slice(0, 16);
}

export const featuredProducts: Product[] = new Proxy([] as Product[], {
    get(target, prop, receiver) {
        const fresh = getFeaturedProducts();
        const value = Reflect.get(fresh, prop, receiver);
        if (typeof value === "function") {
            return value.bind(fresh);
        }
        return value;
    },
    has(target, prop) {
        return Reflect.has(getFeaturedProducts(), prop);
    },
    ownKeys(target) {
        return Reflect.ownKeys(getFeaturedProducts());
    },
    getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(getFeaturedProducts(), prop);
    }
});
