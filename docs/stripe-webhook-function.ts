/**
 * ==============================================================================
 * IMPORTANTE: Este es un ejemplo de una Cloud Function de Firebase.
 * ==============================================================================
 *
 * Este código debe ser desplegado como una Cloud Function de Firebase. No es parte
 * de la aplicación Next.js y no se ejecutará en el mismo entorno.
 *
 * Para desplegar esto:
 * 1.  Inicializa Firebase Functions en tu proyecto: `firebase init functions`
 * 2.  Elige TypeScript como lenguaje.
 * 3.  Copia el contenido de este archivo en `functions/src/index.ts`.
 * 4.  Añade las dependencias a `functions/package.json`:
 *     - "firebase-admin": "^12.0.0"
 *     - "firebase-functions": "^5.0.0"
 *     - "stripe": "^15.0.0"
 * 5.  Configura los secretos de tu entorno de Stripe en Firebase:
 *     - `firebase functions:config:set stripe.secret="sk_test_..."`
 *     - `firebase functions:config:set stripe.webhook_secret="whsec_..."`
 * 6.  Despliega la función: `firebase deploy --only functions`
 * 7.  En tu panel de control de Stripe, crea un "webhook endpoint" que apunte a la URL
 *     de esta función desplegada. Escucha los eventos `checkout.session.completed` y `customer.subscription.deleted`.
 */

// Importa los módulos necesarios de Firebase Functions y el SDK de Admin
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Inicializa el SDK de Admin de Firebase
admin.initializeApp();
const db = admin.firestore();

// Obtiene la clave secreta de Stripe desde la configuración de entorno de Firebase
// La clave se configura con el comando: firebase functions:config:set stripe.secret="sk_test_..."
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2024-04-10',
});

/**
 * Una Cloud Function de Firebase que se activa por una petición HTTP para manejar webhooks de Stripe.
 */
export const handleStripeWebhook = functions.https.onRequest(async (request, response) => {
  // Obtiene la firma del webhook desde las cabeceras de la petición
  const sig = request.headers['stripe-signature'];
  
  // Obtiene el secreto del webhook desde la configuración de entorno de Firebase
  // El secreto se configura con: firebase functions:config:set stripe.webhook_secret="whsec_..."
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    // Verifica que el evento provino de Stripe usando la firma
    if (!sig || !webhookSecret) {
        throw new Error('Webhook secret or signature not provided.');
    }
    event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
  } catch (err) {
    // En caso de error, lo registra y devuelve una respuesta 400
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    functions.logger.error(`La verificación de la firma del webhook falló.`, errorMessage);
    response.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  // Maneja el evento específico del webhook
  switch (event.type) {
    // --- Suscripción Creada o Actualizada ---
    // Ocurre cuando se crea una suscripción o un pago tiene éxito.
    case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Si la sesión incluye datos de suscripción, es un pago recurrente.
        if (session.subscription) {
            const customerEmail = await getCustomerEmail(session.customer);
            if (customerEmail) {
                await updateUserSubscriptionStatus(customerEmail, 'active');
                functions.logger.log(`Subscription activated for ${customerEmail}`);
            }
        }
        break;
    }
    
    // Ocurre cuando un usuario cancela su suscripción o un pago falla.
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerEmail = await getCustomerEmail(subscription.customer);

      if (customerEmail) {
        await updateUserSubscriptionStatus(customerEmail, 'inactive');
        functions.logger.log(`Subscription deactivated for ${customerEmail}`);
      }
      break;
    }

    default:
      // Registra cualquier evento no manejado
      functions.logger.log(`Evento no manejado: ${event.type}`);
  }

  // Confirma la recepción del evento con un estado 200
  response.status(200).send();
});


/**
 * Obtiene el email de un cliente a partir de su ID de cliente en Stripe.
 * @param customerId El ID del cliente de Stripe.
 * @returns El email del cliente o null si no se encuentra.
 */
async function getCustomerEmail(customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string | null> {
  if (typeof customerId !== 'string') {
    return null;
  }
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    return customer.email;
  } catch (error) {
    functions.logger.error(`No se pudo obtener el email del cliente con ID: ${customerId}`, error);
    return null;
  }
}

/**
 * Encuentra un usuario en Firestore por su email y actualiza el estado de su suscripción.
 * @param email El email del usuario.
 * @param status El nuevo estado de la suscripción ('active' o 'inactive').
 */
async function updateUserSubscriptionStatus(email: string, status: 'active' | 'inactive'): Promise<void> {
  if (!email) return;

  // Busca en la colección 'userProfiles' al usuario con el email correspondiente
  const userQuery = db.collection('userProfiles').where('email', '==', email).limit(1);
  const userSnapshot = await userQuery.get();

  if (userSnapshot.empty) {
    functions.logger.warn(`No se encontró ningún usuario con el email: ${email}`);
    return;
  }

  // Obtiene la referencia del documento y actualiza el campo subscriptionStatus
  const userDocRef = userSnapshot.docs[0].ref;
  await userDocRef.update({ subscriptionStatus: status });
}
