import { useStore } from '@nanostores/react';
import { favoriteItems, removeFromFavorites } from '../../store/favoriteStore';
import { addToCart } from '../../store/cartStore';
import { toast } from 'sonner';

export default function FavoritesList() {
    const rawFavorites = useStore(favoriteItems);
    const favorites = Array.isArray(rawFavorites) ? rawFavorites : [];

    const handleAddToCart = (product: any) => {
        const cartProduct = {
            id: product.slug || product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.image || '',
            stock: product.stock !== undefined ? product.stock : 99
        };

        const result = addToCart(cartProduct, 1);
        if (result.success) {
            toast.success("Item adicionado ao carrinho!");
        } else {
            toast.error(result.message);
        }
    };

    const handleRemove = (id: string, name: string) => {
        const result = removeFromFavorites(id);
        if (result.success) {
            toast.info(`${name} removido dos favoritos`);
        }
    };

    const formatPrice = (price: number) => {
        const num = Number(price);
        if (isNaN(num)) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(num);
    };

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[45vh] text-center p-6 bg-white rounded-3xl border border-[#D4A33D]/25 shadow-xs">
                <div className="w-20 h-20 bg-[#6E0D25]/10 text-[#6E0D25] rounded-full flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                </div>
                <h2 className="text-2xl font-bold font-['Cinzel'] text-[#6E0D25] mb-2">Nenhum favorito salvo</h2>
                <p className="text-slate-600 mb-6 max-w-sm text-sm font-light">
                    Clique no ícone de coração em qualquer perfume ou cosmético da loja para salvá-lo aqui.
                </p>
                <a href="/category/todos" className="btn bg-[#6E0D25] hover:bg-[#4B0919] text-white rounded-full px-8 font-bold text-xs uppercase tracking-wider border-none shadow-md">
                    Explorar Catálogo
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => {
                const targetSlug = product.slug || product.id || "";
                return (
                    <div key={product.id || targetSlug} className="card bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-[#D4A33D]/25 overflow-hidden relative group rounded-2xl flex flex-col justify-between">
                        <button
                            onClick={() => handleRemove(product.id || targetSlug, product.name)}
                            className="absolute top-3 right-3 z-20 btn btn-circle btn-sm bg-white/95 hover:bg-red-50 hover:text-red-700 text-slate-400 border border-[#D4A33D]/30 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            aria-label="Remover dos favoritos"
                            title="Remover dos favoritos"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>

                        <a href={`/product/${targetSlug}`} className="block relative aspect-4/5 bg-[#F6EFE8] overflow-hidden">
                            <img
                                src={product.image || "/docs/brand/Logo AnaFerreira_w.png"}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        </a>

                        <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                                {product.category && (
                                    <span className="text-[10px] uppercase font-bold text-[#D4A33D] tracking-widest font-['Cinzel'] block mb-1">
                                        {product.category}
                                    </span>
                                )}
                                <h3 className="font-bold text-base mb-1 truncate font-['Cinzel'] text-[#2F2F2F] group-hover:text-[#6E0D25] transition-colors">
                                    <a href={`/product/${targetSlug}`}>
                                        {product.name}
                                    </a>
                                </h3>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                <span className="text-lg font-bold text-[#6E0D25] font-['Cinzel']">
                                    {formatPrice(product.price)}
                                </span>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="btn btn-circle btn-sm bg-[#6E0D25] hover:bg-[#4B0919] text-white border-none shadow-sm cursor-pointer"
                                    aria-label="Adicionar ao carrinho"
                                    title="Adicionar ao carrinho"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
