const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const store = getStore("payments");

    // Vérification de la méthode
    if (event.httpMethod === "GET") {
      return response(200, {
        ok: true,
        message: "PATIENCE MARKET - Payment API fonctionne !"
      });
    }

    if (event.httpMethod !== "POST") {
      return response(405, {
        ok: false,
        message: "Méthode non autorisée"
      });
    }

    const data = JSON.parse(event.body || "{}");

    const action = data.action;

    // =========================
    // CRÉER UNE DEMANDE
    // =========================
    if (action === "create") {

      const orderId =
        "PM-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 7).toUpperCase();

      const order = {
        id: orderId,
        customer: data.customer || "",
        phone: data.phone || "",
        plan: data.plan || "",
        amount: Number(data.amount || 0),
        status: "pending",
        ticket: null,
        createdAt: new Date().toISOString()
      };

      await store.set(orderId, JSON.stringify(order));

      return response(200, {
        ok: true,
        orderId: orderId,
        status: "pending"
      });
    }

    // =========================
    // CONSULTER UNE COMMANDE
    // =========================
    if (action === "get") {

      if (!data.orderId) {
        return response(400, {
          ok: false,
          message: "orderId manquant"
        });
      }

      const saved = await store.get(data.orderId);

      if (!saved) {
        return response(404, {
          ok: false,
          message: "Commande introuvable"
        });
      }

      return response(200, JSON.parse(saved));
    }

    // =========================
    // CONFIRMATION ADMIN
    // =========================
    if (action === "confirm") {

      if (!data.orderId || !data.ticket) {
        return response(400, {
          ok: false,
          message: "orderId ou ticket manquant"
        });
      }

      const saved = await store.get(data.orderId);

      if (!saved) {
        return response(404, {
          ok: false,
          message: "Commande introuvable"
        });
      }

      const order = JSON.parse(saved);

      order.status = "confirmed";
      order.ticket = data.ticket;
      order.confirmedAt = new Date().toISOString();

      await store.set(
        data.orderId,
        JSON.stringify(order)
      );

      return response(200, {
        ok: true,
        message: "Paiement confirmé",
        order: order
      });
    }

    return response(400, {
      ok: false,
      message: "Action inconnue"
    });

  } catch (error) {

    console.error(error);

    return response(500, {
      ok: false,
      message: "Erreur serveur"
    });
  }
};


// =========================
// RÉPONSE JSON
// =========================

function response(statusCode, body) {

  return {
    statusCode: statusCode,

    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    },

    body: JSON.stringify(body)
  };
}
