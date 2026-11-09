import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { currentUser, saveUserFavorites } from './authStore';

export interface FavoriteItem {
    id: string;
    name: string;
    price: number;
    image: string;
    stock?: number;
    slug: string;
    category?: string;
}

export const favoriteItems = persistentAtom<FavoriteItem[]>('favorite_items', [], {
    encode: JSON.stringify,
    decode: (val) => {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    },
});

// Helper to notify authStore about favorites updates
function notifyAuthStore(items: FavoriteItem[]) {
    const user = currentUser.get();
    if (user) {
        saveUserFavorites(items.map((i) => i.slug || i.id));
    }
}

export function addToFavorites(product: Partial<FavoriteItem> & { name: string; price: number }) {
    const items = favoriteItems.get();
    const safeItems = Array.isArray(items) ? items : [];

    const slug = product.slug || product.id || product.name.toLowerCase().replace(/\s+/g, '-');
    const id = product.id || slug;
    const image = product.image || '';

    const normalizedItem: FavoriteItem = {
        id,
        slug,
        name: product.name,
        price: Number(product.price) || 0,
        image,
        stock: product.stock !== undefined ? Number(product.stock) : 99,
        category: product.category || '',
    };

    const existingItem = safeItems.find(
        (item) => item.id === id || item.slug === slug || item.id === slug || item.slug === id
    );

    if (!existingItem) {
        const updated = [...safeItems, normalizedItem];
        favoriteItems.set(updated);
        notifyAuthStore(updated);
        return { success: true, message: `${product.name} foi adicionado aos seus favoritos!` };
    }
    return { success: false, message: `${product.name} já está na sua lista de favoritos.` };
}

export function removeFromFavorites(identifier: string) {
    const items = favoriteItems.get();
    const safeItems = Array.isArray(items) ? items : [];

    const itemToRemove = safeItems.find(
        (item) => item.id === identifier || item.slug === identifier
    );
    const updated = safeItems.filter(
        (item) => item.id !== identifier && item.slug !== identifier
    );

    favoriteItems.set(updated);
    notifyAuthStore(updated);
    return { success: true, message: `${itemToRemove?.name || 'Produto'} foi removido dos favoritos.` };
}

export function toggleFavorite(product: Partial<FavoriteItem> & { name: string; price: number }) {
    const identifier = product.slug || product.id || '';
    if (identifier && isFavorite(identifier)) {
        return removeFromFavorites(identifier);
    } else {
        return addToFavorites(product);
    }
}

export function isFavorite(identifier: string) {
    if (!identifier) return false;
    const items = favoriteItems.get();
    if (!Array.isArray(items)) return false;
    return items.some((item) => item.id === identifier || item.slug === identifier);
}

export const totalFavorites = computed(favoriteItems, (items) => (Array.isArray(items) ? items.length : 0));
