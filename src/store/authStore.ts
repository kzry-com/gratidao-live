import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface UserAddress {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: UserAddress;
    favorites?: string[]; // IDs or slugs
    createdAt: string;
}

export interface StoredUser extends UserProfile {
    password?: string;
}

// Persist active logged in user session
export const currentUser = persistentAtom<UserProfile | null>('gratidao_current_user', null, {
    encode: JSON.stringify,
    decode: (val) => {
        try {
            return JSON.parse(val);
        } catch {
            return null;
        }
    },
});

// Mock / Local DB of registered users
export const usersDb = persistentAtom<Record<string, StoredUser>>('gratidao_users_db', {}, {
    encode: JSON.stringify,
    decode: (val) => {
        try {
            return JSON.parse(val);
        } catch {
            return {};
        }
    },
});

export const isAuthenticated = computed(currentUser, (user) => user !== null);

export function registerUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: UserAddress;
}): { success: boolean; message: string; user?: UserProfile } {
    const emailNormalized = (data.email || '').trim().toLowerCase();
    const nameTrimmed = (data.name || '').trim();

    if (!nameTrimmed) {
        return { success: false, message: 'Por favor, informe seu nome completo.' };
    }

    if (!emailNormalized || !emailNormalized.includes('@') || !emailNormalized.includes('.')) {
        return { success: false, message: 'Por favor, informe um endereço de e-mail válido.' };
    }

    if (!data.password || data.password.length < 6) {
        return { success: false, message: 'A senha de segurança deve conter no mínimo 6 caracteres.' };
    }

    const db = usersDb.get();
    if (db[emailNormalized]) {
        return { success: false, message: 'Este e-mail já está cadastrado em nosso sistema. Faça login para continuar.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: StoredUser = {
        id: userId,
        name: nameTrimmed,
        email: emailNormalized,
        phone: (data.phone || '').trim(),
        address: data.address,
        password: data.password,
        favorites: [],
        createdAt: new Date().toISOString(),
    };

    // Save to DB
    const updatedDb = { ...db, [emailNormalized]: newUser };
    usersDb.set(updatedDb);

    // Set logged in session (omit password)
    const { password: _, ...sessionUser } = newUser;
    currentUser.set(sessionUser);

    return { success: true, message: `Bem-vindo(a), ${sessionUser.name}! Seu cadastro foi concluído com sucesso.`, user: sessionUser };
}

export function loginUser(email: string, password: string): { success: boolean; message: string; user?: UserProfile } {
    const emailNormalized = (email || '').trim().toLowerCase();

    if (!emailNormalized || !password) {
        return { success: false, message: 'Por favor, preencha o e-mail e a senha.' };
    }

    const db = usersDb.get();
    const storedUser = db[emailNormalized];

    if (!storedUser || storedUser.password !== password) {
        return { success: false, message: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.' };
    }

    const { password: _, ...sessionUser } = storedUser;
    currentUser.set(sessionUser);

    return { success: true, message: `Olá, ${sessionUser.name}! Você entrou na sua conta.`, user: sessionUser };
}

export function loginWithGoogle(): { success: boolean; message: string; user?: UserProfile } {
    // Simulated Google Single Sign-On
    const googleEmail = 'cliente.google@exemplo.com';
    const db = usersDb.get();

    let user = db[googleEmail];
    if (!user) {
        const userId = `usr_google_${Date.now()}`;
        user = {
            id: userId,
            name: 'Cliente Google',
            email: googleEmail,
            phone: '(84) 9.9999-8888',
            favorites: [],
            createdAt: new Date().toISOString(),
        };
        usersDb.set({ ...db, [googleEmail]: user });
    }

    const { password: _, ...sessionUser } = user;
    currentUser.set(sessionUser);

    return { success: true, message: 'Autenticado com sucesso via Google!', user: sessionUser };
}

export function logoutUser(): { success: boolean; message: string } {
    currentUser.set(null);
    return { success: true, message: 'Você encerrou sua sessão com segurança.' };
}

export function updateUserProfile(updates: Partial<UserProfile>): { success: boolean; message: string } {
    const user = currentUser.get();
    if (!user) {
        return { success: false, message: 'Nenhum usuário conectado.' };
    }

    const updatedUser: UserProfile = { ...user, ...updates };
    currentUser.set(updatedUser);

    const db = usersDb.get();
    const stored = db[user.email];
    if (stored) {
        db[user.email] = { ...stored, ...updates };
        usersDb.set({ ...db });
    }

    return { success: true, message: 'Perfil atualizado com sucesso!' };
}

export function saveUserFavorites(favorites: string[]) {
    const user = currentUser.get();
    if (!user) return;

    user.favorites = favorites;
    currentUser.set({ ...user });

    const db = usersDb.get();
    const stored = db[user.email];
    if (stored) {
        stored.favorites = favorites;
        usersDb.set({ ...db });
    }
}
