import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      Authorization: Deno.env.get("SB_AUTHORIZATION") ?? ""
    }
  }
});
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method !== "POST") {
    return jsonResponse({
      success: false,
      error: "Only POST requests are supported."
    }, 405);
  }
  try {
    /*
     * ---------------------------------------------------------
     * 1. Require the user's Supabase access token
     * ---------------------------------------------------------
     */ const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({
        success: false,
        error: "Authorization header is required."
      }, 401);
    }
    /*
     * Create a client using the user's JWT.
     *
     * We intentionally do NOT use the service-role key here.
     * Database RLS and MineGuard's existing access functions
     * therefore remain part of the security boundary.
     */ const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });
    /*
     * ---------------------------------------------------------
     * 2. Identify the authenticated user
     * ---------------------------------------------------------
     */ const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({
        success: false,
        error: "Invalid or expired authentication token."
      }, 401);
    }
    /*
     * ---------------------------------------------------------
     * 3. Read request body
     * ---------------------------------------------------------
     */ let payload;
    try {
      payload = await req.json();
    } catch  {
      return jsonResponse({
        success: false,
        error: "Request body must be valid JSON."
      }, 400);
    }
    const documentId = payload.document_id;
    if (!documentId) {
      return jsonResponse({
        success: false,
        error: "document_id is required."
      }, 400);
    }
    /*
     * ---------------------------------------------------------
     * 4. Read document metadata
     * ---------------------------------------------------------
     */ const { data: document, error: documentError } = await userSupabase.from("documents").select(`
        id,
        mine_id,
        file_name,
        storage_path,
        mime_type,
        file_size,
        status,
        ocr_status,
        ocr_attempts
      `).eq("id", documentId).single();
    if (documentError || !document) {
      return jsonResponse({
        success: false,
        error: "Document not found or access denied."
      }, 404);
    }
    /*
     * ---------------------------------------------------------
     * 5. Validate document state
     * ---------------------------------------------------------
     */ if (document.status !== "Active") {
      return jsonResponse({
        success: false,
        error: "Document is archived."
      }, 400);
    }
    if (document.ocr_status !== "Pending" && document.ocr_status !== "Failed") {
      return jsonResponse({
        success: false,
        error: `Document OCR status is '${document.ocr_status}'. Expected Pending or Failed.`
      }, 409);
    }
    /*
     * ---------------------------------------------------------
     * 6. Start OCR processing
     * ---------------------------------------------------------
     *
     * This uses the secure database function created in 11-09.
     * MineGuard's existing mine-access rules are therefore
     * enforced by PostgreSQL.
     */ const { data: processingDocument, error: startError } = await userSupabase.rpc("start_document_ocr", {
      requested_document_id: documentId
    });
    if (startError) {
      console.error("OCR start error:", startError);
      return jsonResponse({
        success: false,
        error: "Unable to start OCR processing.",
        details: startError.message
      }, 400);
    }
    /*
     * ---------------------------------------------------------
     * 7. Download the private Storage object
     * ---------------------------------------------------------
     */ const { data: file, error: downloadError } = await userSupabase.storage.from("mineguard-documents").download(document.storage_path);
    if (downloadError || !file) {
      console.error("Storage download error:", downloadError);
      await userSupabase.rpc("fail_document_ocr", {
        requested_document_id: documentId,
        processing_error: downloadError?.message ?? "Unable to download document from Storage.",
        retry_after_minutes: 30
      });
      return jsonResponse({
        success: false,
        error: "Unable to download document from Storage."
      }, 500);
    }
    /*
     * ---------------------------------------------------------
     * 8. Process the document
     * ---------------------------------------------------------
     *
     * Current foundation supports text/plain directly.
     *
     * PDF/image OCR will be connected to an OCR provider in
     * the next stage.
     */ let extractedText;
    const mimeType = document.mime_type || file.type || "application/octet-stream";
    if (mimeType === "text/plain") {
      extractedText = await file.text();
    } else {
      await userSupabase.rpc("fail_document_ocr", {
        requested_document_id: documentId,
        processing_error: `OCR provider is not configured for MIME type: ${mimeType}`,
        retry_after_minutes: 60
      });
      return jsonResponse({
        success: false,
        error: `OCR provider is not configured for MIME type: ${mimeType}.`,
        supported_for_now: [
          "text/plain"
        ]
      }, 422);
    }
    /*
     * ---------------------------------------------------------
     * 9. Basic validation of extracted text
     * ---------------------------------------------------------
     */ if (!extractedText.trim()) {
      await userSupabase.rpc("fail_document_ocr", {
        requested_document_id: documentId,
        processing_error: "Document was processed but no text was extracted.",
        retry_after_minutes: 30
      });
      return jsonResponse({
        success: false,
        error: "No text could be extracted from the document."
      }, 422);
    }
    /*
     * ---------------------------------------------------------
     * 10. Calculate a simple content hash
     * ---------------------------------------------------------
     *
     * This gives us a deterministic fingerprint of the
     * extracted document text.
     */ const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(extractedText));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = hashArray.map((byte)=>byte.toString(16).padStart(2, "0")).join("");
    /*
     * ---------------------------------------------------------
     * 11. Store OCR result
     * ---------------------------------------------------------
     */ const { data: completedDocument, error: completeError } = await userSupabase.rpc("complete_document_ocr", {
      requested_document_id: documentId,
      extracted_text: extractedText,
      requested_provider: "native-text",
      requested_document_hash: documentHash
    });
    if (completeError) {
      console.error("OCR completion error:", completeError);
      return jsonResponse({
        success: false,
        error: "OCR text was extracted but could not be saved.",
        details: completeError.message
      }, 500);
    }
    /*
     * ---------------------------------------------------------
     * 12. Return result
     * ---------------------------------------------------------
     */ return jsonResponse({
      success: true,
      message: "Document OCR processing completed.",
      document_id: documentId,
      mine_id: document.mine_id,
      file_name: document.file_name,
      storage_path: document.storage_path,
      mime_type: mimeType,
      ocr_status: "Completed",
      ocr_provider: "native-text",
      ocr_attempts: completedDocument?.ocr_attempts ?? processingDocument?.ocr_attempts ?? null,
      extracted_characters: extractedText.length,
      document_hash: documentHash,
      processed_by: user.id
    }, 200);
  } catch (error) {
    console.error("Unexpected OCR error:", error);
    return jsonResponse({
      success: false,
      error: "Unexpected OCR processing error."
    }, 500);
  }
});
