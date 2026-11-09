export interface CepAddress {
    cep: string;
    logradouro: string;
    bairro: string;
    localidade: string; // Cidade
    uf: string; // Estado
    complemento?: string;
}

export interface CepResult {
    success: boolean;
    address?: CepAddress;
    source?: 'opencep' | 'viacep';
    error?: string;
}

/**
 * Consulta CEP na API OpenCEP com fallback automático para ViaCEP
 */
export async function fetchAddressByCep(rawCep: string): Promise<CepResult> {
    const cleanCep = (rawCep || '').replace(/\D/g, '');

    if (cleanCep.length !== 8) {
        return { success: false, error: 'O CEP deve conter exatamente 8 dígitos.' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // 1ª Tentativa: OpenCEP
    try {
        const response = await fetch(`https://opencep.com/v1/${cleanCep}`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeout);

        if (response.ok) {
            const data = await response.json();
            if (data && !data.erro && data.localidade) {
                return {
                    success: true,
                    source: 'opencep',
                    address: {
                        cep: data.cep || cleanCep,
                        logradouro: data.logradouro || '',
                        bairro: data.bairro || '',
                        localidade: data.localidade || '',
                        uf: data.uf || '',
                        complemento: data.complemento || '',
                    }
                };
            }
        }
    } catch (err) {
        console.warn('OpenCEP falhou ou indisponível, acionando fallback ViaCEP...', err);
    }

    // 2ª Tentativa (Fallback): ViaCEP
    try {
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 4500);

        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            signal: fallbackController.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(fallbackTimeout);

        if (response.ok) {
            const data = await response.json();
            if (data && !data.erro && data.localidade) {
                return {
                    success: true,
                    source: 'viacep',
                    address: {
                        cep: data.cep || cleanCep,
                        logradouro: data.logradouro || '',
                        bairro: data.bairro || '',
                        localidade: data.localidade || '',
                        uf: data.uf || '',
                        complemento: data.complemento || '',
                    }
                };
            } else {
                return { success: false, error: 'CEP não encontrado. Por favor, confira os números digitados.' };
            }
        }
    } catch (err) {
        console.error('ViaCEP também falhou:', err);
    }

    return {
        success: false,
        error: 'Não foi possível consultar o CEP no momento. Você pode preencher os dados manualmente.'
    };
}

/**
 * Formata string como XXXXX-XXX
 */
export function formatCep(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
}
