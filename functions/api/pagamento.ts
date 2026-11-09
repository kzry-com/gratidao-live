import type { PagesFunction } from "@cloudflare/workers-types";

interface PagamentoRequest {
  order_id: string;
  valor_total: number;
  metodo: "pix" | "cartao";
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    cpf?: string;
  };
  itens: Array<{
    produto_id: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
  }>;
}

interface Env {
  INFINITEPAY_API_KEY?: string;
  INFINITEPAY_HANDLE?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as PagamentoRequest;
    const { order_id, valor_total, cliente, metodo } = body;

    if (!order_id || !valor_total || !cliente) {
      return new Response(
        JSON.stringify({ error: "order_id, valor_total e dados do cliente são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = env.INFINITEPAY_API_KEY;
    const handle = env.INFINITEPAY_HANDLE || "lojagratidaoshop";

    // Se chave for placeholder, responder com mock dinâmico seguro
    if (!apiKey || apiKey.includes("XXXXX")) {
      return new Response(
        JSON.stringify({
          order_id,
          status: "pendente_pagamento",
          metodo: metodo || "pix",
          pix_copia_cola: `00020126580014br.gov.bcb.pix0136gratidao-live-${order_id}520400005303986540${valor_total.toFixed(2)}5802BR5916Ana Ferreira AF6005Natal62070503***6304ABCD`,
          pix_qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PIX-${order_id}`,
          valor: valor_total,
          aviso: "Chave InfinitePay em modo de simulação/homologação."
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Integração oficial via API InfinitePay
    const response = await fetch("https://api.infinitepay.io/v2/transactions", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        handle,
        order_id,
        amount: Math.round(valor_total * 100),
        payment_method: metodo,
        customer: {
          name: cliente.nome,
          email: cliente.email,
          phone: cliente.telefone
        }
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar pagamento.", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
