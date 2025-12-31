import express from 'express'; // FIX: Removed named imports to avoid conflict with global Request/Response types.
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// --- INITIALIZATION ---

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO;
const PORT = process.env.PORT || 3002;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !CLIENT_URL || !STRIPE_PRICE_ID_PRO) {
  throw new Error("Missing required environment variables for Stripe integration.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

// --- IN-MEMORY DATA (for demonstration) ---
// In a real app, this would be your database (e.g., MongoDB, PostgreSQL)

interface User {
  email: string;
  plan: 'Free' | 'Pro';
  stripeCustomerId?: string;
  quota_used: number;
  quota_limit: number;
}

const plans = {
  Free: { quota_limit: 5 },
  Pro: { quota_limit: 100 },
};

const users: Map<string, User> = new Map([
  ["demo@example.com", {
    email: "demo@example.com",
    plan: "Free",
    quota_used: 2,
    quota_limit: plans.Free.quota_limit,
  }]
]);

// --- MIDDLEWARES ---

// Special raw body parser for the webhook, MUST be before app.use(express.json())
// FIX: Casting to any to bypass strict type check conflicts between Express and native types.
app.post('/api/webhook', express.raw({ type: 'application/json' }) as any, handleWebhook as any);

// FIX: Casting express.json() to any to ensure it is accepted by app.use regardless of local type conflicts.
app.use(cors({ origin: '*' }));
app.use(express.json() as any);

// Logger
// FIX: Using 'any' for req/res/next to resolve property access errors where Express types conflict with global Request/Response.
app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// --- API ROUTES ---

/**
 * GET /api/quota
 * Returns the current quota usage for a user.
 * Query Params: ?email=user@example.com
 */
// FIX: Using 'any' for req/res to resolve property access errors where Express types conflict with global Request/Response.
app.get('/api/quota', (req: any, res: any) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required." });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({
    plan: user.plan,
    quota_used: user.quota_used,
    quota_limit: user.quota_limit,
    quota_remaining: user.quota_limit - user.quota_used,
  });
});

/**
 * POST /api/subscribe
 * Creates a Stripe Checkout session for a user to subscribe to the Pro plan.
 * Body: { "email": "user@example.com" }
 */
// FIX: Using 'any' for req/res to resolve property access errors where Express types conflict with global Request/Response.
app.post('/api/subscribe', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required in the request body." });
  }
  
  const user = users.get(email);
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PRICE_ID_PRO,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/payment-cancelled`,
      // Pass user's email to identify them in the webhook
      client_reference_id: email,
      // Pre-fill email and link to existing customer if they exist
      customer_email: user?.email,
      customer: user?.stripeCustomerId,
    });
    
    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe session creation failed:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});


/**
 * POST /api/webhook (Logic is in the handler function)
 * Listens for events from Stripe.
 */
// FIX: Using 'any' for req/res to resolve property access errors where Express types conflict with global Request/Response.
async function handleWebhook(req: any, res: any) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.client_reference_id;

      if (!email) {
          console.error("Webhook Error: No client_reference_id (email) in session.", session.id);
          break;
      }
      
      const user = users.get(email);
      if (!user) {
          console.error("Webhook Error: User not found for email:", email);
          break;
      }

      // Update user in our "database"
      user.plan = 'Pro';
      user.quota_limit = plans.Pro.quota_limit;
      user.stripeCustomerId = session.customer as string;
      console.log(`User ${email} has successfully subscribed to the Pro plan.`);
      break;
    }
    
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Find user by stripeCustomerId
        const userEmail = Array.from(users.entries()).find(([, u]) => u.stripeCustomerId === subscription.customer)?. [0];
        
        if (userEmail && (subscription.status === 'canceled' || subscription.cancel_at_period_end)) {
            const user = users.get(userEmail);
            if (user) {
                user.plan = 'Free';
                user.quota_limit = plans.Free.quota_limit;
                console.log(`User ${userEmail}'s subscription ended. Downgraded to Free plan.`);
            }
        }
        break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

// --- ERROR HANDLING & SERVER START ---

// FIX: Using 'any' for req/res/next to resolve property access errors where Express types conflict with global Request/Response.
app.use((err: Error, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Stripe API server listening on http://localhost:${PORT}`);
});