// lib/auditLogger.js
import { supabaseAdmin } from "./supabaseAdmin";


export async function auditLogger({
  user_id,
  action_type,
  object_type,
  object_id,
  object_name,
  details = {},
}) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      user_id,
      action_type,
      object_type,
      object_id,
      object_name,
      details,
    });
  } catch (err) {
    console.error("Audit Logger Error:", err);
  }
}