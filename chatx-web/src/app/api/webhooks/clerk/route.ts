import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET in .env", {
      status: 500,
    });
  }

  // 1. Get headers required by Svix
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // 2. Extract the raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // 3. Cryptographically verify the payload is genuinely from Clerk
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Webhook verification failed", { status: 400 });
  }

  // 4. Handle the specific 'user.created' event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name } = evt.data;

    // Clerk allows multiple emails, we just grab the primary one
    const primaryEmail = email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response("Error: No email provided", { status: 400 });
    }

    try {
      // 5. Use Drizzle to insert the new user into Neon
      await db.insert(users).values({
        id: id,
        email: primaryEmail,
        firstName: first_name || "User", // Fallback if no first name is provided
      });

      console.log(`User ${id} successfully synced to database.`);
      return new Response("User stored successfully", { status: 201 });
    } catch (error) {
      console.error("Database insertion error:", error);
      return new Response("Error saving user to database", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    try {
      await db
        .update(users)
        .set({
          email: primaryEmail,
          firstName: first_name || "User",
        })
        .where(eq(users.id, id));

      return new Response("User updated", { status: 200 });
    } catch (error) {
      console.error("Update error:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) return new Response("No ID", { status: 400 });

    try {
      await db.delete(users).where(eq(users.id, id));
      return new Response("User deleted", { status: 200 });
    } catch (error) {
      console.error("Delete error:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  // Return a 200 for event types we aren't listening for to acknowledge receipt
  return new Response("Webhook received", { status: 200 });
}
