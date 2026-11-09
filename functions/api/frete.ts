import type { PagesFunction } from "@cloudflare/workers-types";

interface FreteItem {
  id: string;
  quantidade: number;
  peso_bruto_gramas?: number;
  dimensoes_embalagem?: {
    altura_cm: number;
    largura_cm: number;
    comprimento_cm: number;
  };
}

interface FreteRequest {
  cep_destino: string;
  itens: FreteItem[];
}

interface Env {
  MELHORENVIO_API_URL?: string;
  MELHORENVIO_TOKEN?: string;
  MELHORENVIO_CEP_ORIGEM?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as FreteRequest;
    const { cep_destino, itens } = body;

    if (!cep_destino || !itens || itens.length === 0) {
      return new Response(
        JSON.stringify({ error: "CEP de destino e lista de itens são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cepDestinoLimpo = cep_destino.replace(/\D/g, "");
    const cepOrigemLimpo = (env.MELHORENVIO_CEP_ORIGEM || "59000000").replace(/\D/g, "");
    const token = env.MELHORENVIO_TOKEN;
    const apiUrl = env.MELHORENVIO_API_URL || "https://sandbox.melhorenvio.com.br";

    // Se o token ainda não estiver configurado em produção/sandbox, retornar fallback seguro
    if (!token || token.includes("XXXXX")) {
      return new Response(
        JSON.stringify({
          aviso: "Melhor Envio operando com estimativa padrão (credenciais em configuração).",
          cotacoes: [
            { id: 1, nome: "PAC (Correios)", valor: 22.50, prazo_dias: 6 },
            { id: 2, nome: "Sedex (Correios)", valor: 38.90, prazo_dias: 2 },
            { id: 3, nome: ".Package (Jadlog)", valor: 19.80, prazo_dias: 5 }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Monta payload de cotação para o Melhor Envio API v2
    const productsPayload = itens.map((item, idx) => ({
      id: item.id || `item_${idx}`,
      width: item.dimensoes_embalagem?.largura_cm || 7,
      height: item.dimensoes_embalagem?.altura_cm || 12,
      length: item.dimensoes_embalagem?.comprimento_cm || 7,
      weight: (item.peso_bruto_gramas || 400) / 1000,
      insurance_value: 89.90,
      quantity: item.quantidade || 1
    }));

    const response = await fetch(`${apiUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "User-Agent": "gratidao-live/1.0 (contato@gratidao.live)"
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigemLimpo },
        to: { postal_code: cepDestinoLimpo },
        products: productsPayload
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: "Falha na cotação com a transportadora.", detalhe: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const cotacoes = await response.json();
    return new Response(JSON.stringify({ cotacoes }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Erro interno no cálculo de frete.", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
