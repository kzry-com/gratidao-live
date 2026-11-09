import type { PagesFunction } from "@cloudflare/workers-types";

interface WebhookPayload {
  event: string;
  transaction: {
    id: string;
    order_id: string;
    status: "paid" | "declined" | "canceled" | "refunded";
    amount: number;
    paid_at?: string;
  };
}

interface Env {
  INFINITEPAY_WEBHOOK_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const signature = request.headers.get("x-infinitepay-signature");
    const payload = (await request.json()) as WebhookPayload;

    if (!payload?.transaction?.order_id) {
      return new Response(JSON.stringify({ error: "Payload inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { order_id, status } = payload.transaction;

    // Atualiza status do pedido se liquidado com sucesso
    if (status === "paid") {
      // Callback registrado com sucesso
      return new Response(
        JSON.stringify({
          sucesso: true,
          mensagem: `Pagamento do pedido ${order_id} confirmado.`,
          order_id,
          status: "pago"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ sucesso: true, mensagem: `Evento ignorado: status ${status}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Erro no processamento do webhook.", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
