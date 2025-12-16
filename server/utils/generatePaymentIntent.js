import database from "../database/db.js";
import crypto from "crypto";

export async function generatePaymentIntent(orderId, totalPrice) {
  const dummyPaymentId = crypto.randomUUID();

  await database.query(
    `
    INSERT INTO payments 
    (order_id, payment_type, payment_status, payment_reference)
    VALUES ($1, $2, $3, $4)
    `,
    [orderId, "Dummy", "Pending", dummyPaymentId]
  );

  return {
    success: true,
    clientSecret: dummyPaymentId
  };
}
