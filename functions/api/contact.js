export async function onRequestPost(context) {
  const origin = new URL(context.request.url).origin;
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  try {
    const body = await context.request.json();

    // Hidden honeypot: silently accept bot submissions without sending mail.
    if (body.botcheck) {
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!email || !subject || !message) {
      return Response.json(
        { success: false, message: "Missing required fields." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (email.length > 254 || subject.length > 200 || message.length > 5000) {
      return Response.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { success: false, message: "Invalid email address." },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = context.env.RESEND_API_KEY;
    const from = context.env.RESEND_FROM;
    const to = context.env.CONTACT_TO;

    if (!apiKey || !from || !to) {
      console.error("Missing RESEND_API_KEY, RESEND_FROM, or CONTACT_TO.");
      return Response.json(
        { success: false, message: "Email service is not configured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Meenatoyz] ${subject}`,
        text: `From: ${email}\nSubject: ${subject}\n\n${message}`,
        html: `
          <h2>New message from Meenatoyz</h2>
          <p><strong>From:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
      }),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", result);
      return Response.json(
        { success: false, message: "Resend rejected the email." },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json(
      { success: true, id: result.id },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Contact function error:", error);
    return Response.json(
      { success: false, message: "Unable to send message." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(context) {
  const origin = new URL(context.request.url).origin;

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}
