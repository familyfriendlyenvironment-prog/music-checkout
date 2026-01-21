import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // 1. Read Jotform fields
  const productLabel = req.body["select_your_product"];
  const equipmentAnswer = req.body["do_you_already_have_our_streaming_box"];

  // 2. Your product mapping
  const PRODUCTS = {
    "Basic Music Atmosphere Subscription – Small Business – 1 Zone": {
      setupPriceId: "price_xxx",
      subscriptionPriceId: "price_xxx",
      equipmentEligible: true,
    },
    // ... add all 27 products here
  };

  const EQUIPMENT_PRICE_ID = "price_1SrjNaDJoWN4XXiwj6gY8Inp";

  const product = PRODUCTS[productLabel];
  if (!product) {
    return res.status(400).send("Unknown product");
  }

  // 3. Build line items
  const line_items = [
    { price: product.setupPriceId, quantity: 1 },
    { price: product.subscriptionPriceId, quantity: 1 },
  ];

  const needsEquipment =
    product.equipmentEligible &&
    equipmentAnswer &&
    equipmentAnswer.toLowerCase().includes("need");

  if (needsEquipment) {
    line_items.push({ price: EQUIPMENT_PRICE_ID, quantity: 1 });
  }

  // 4. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items,
    success_url: "https://yourdomain.com/success",
    cancel_url: "https://yourdomain.com/cancel",
  });

  // 5. Redirect to Stripe Checkout
  res.writeHead(303, { Location: session.url });
  res.end();
}
