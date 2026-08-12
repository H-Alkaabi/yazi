const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });

function text(form, name, max = 5000) {
  const value = form.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, "").slice(0, 24);
}

function safeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(env, app) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL || !env.EMAIL_FROM) {
    return { sent: false, skipped: true };
  }

  const looks = app.looks.length ? app.looks.join("، ") : "—";
  const availability = app.availability.length ? app.availability.join("، ") : "—";

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
      <h2>طلب مودل جديد — YAZI</h2>
      <p><b>رقم الطلب:</b> ${safeHtml(app.id)}</p>
      <p><b>الاسم:</b> ${safeHtml(app.full_name)}</p>
      <p><b>العمر:</b> ${safeHtml(app.age)}</p>
      <p><b>واتساب:</b> ${safeHtml(app.phone)}</p>
      <p><b>المدينة:</b> ${safeHtml(app.city)}</p>
      <p><b>إنستغرام:</b> ${safeHtml(app.instagram || "—")}</p>
      <p><b>الجنسية:</b> ${safeHtml(app.nationality || "—")}</p>
      <p><b>نوع البشرة:</b> ${safeHtml(app.skin_type || "—")}</p>
      <p><b>اللوكات:</b> ${safeHtml(looks)}</p>
      <p><b>التوفر:</b> ${safeHtml(availability)}</p>
      <p><b>الحساسية/الحالة الجلدية:</b> ${safeHtml(app.allergies || "—")}</p>
      <p><b>الخبرة:</b> ${safeHtml(app.experience || "—")}</p>
      <p><b>الملاحظات:</b> ${safeHtml(app.notes || "—")}</p>
      <p><b>عدد الصور:</b> ${app.photo_keys.length}</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [env.NOTIFY_EMAIL],
      subject: `طلب مودل جديد — ${app.full_name}`,
      html
    })
  });

  if (!res.ok) {
    throw new Error(`Email API failed: ${res.status} ${await res.text()}`);
  }

  return { sent: true };
}

async function sendWhatsApp(env, app) {
  if (
    !env.WHATSAPP_TOKEN ||
    !env.WHATSAPP_PHONE_NUMBER_ID ||
    !env.WHATSAPP_NOTIFY_TO ||
    !env.WHATSAPP_TEMPLATE_NAME
  ) {
    return { sent: false, skipped: true };
  }

  const endpoint =
    `https://graph.facebook.com/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: env.WHATSAPP_NOTIFY_TO.replace(/[^\d]/g, ""),
    type: "template",
    template: {
      name: env.WHATSAPP_TEMPLATE_NAME,
      language: { code: env.WHATSAPP_TEMPLATE_LANG || "ar" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: app.full_name },
            { type: "text", text: app.phone },
            { type: "text", text: app.city },
            { type: "text", text: app.id }
          ]
        }
      ]
    }
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`WhatsApp API failed: ${res.status} ${await res.text()}`);
  }

  return { sent: true };
}

export async function onRequest({ request, env, ctx }) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  if (!env.DB) {
    return json({ ok: false, error: "D1 binding DB is missing." }, 500);
  }

  if (!env.MODEL_UPLOADS) {
    return json({ ok: false, error: "R2 binding MODEL_UPLOADS is missing." }, 500);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid form data." }, 400);
  }

  const botField = text(form, "bot-field", 200);
  if (botField) {
    return json({ ok: true, application_id: "accepted" });
  }

  const full_name = text(form, "full_name", 120);
  const age = Number(text(form, "age", 3));
  const phone = normalizePhone(text(form, "phone", 32));
  const city = text(form, "city", 80);

  if (!full_name || !Number.isInteger(age) || age < 18 || age > 60 || !phone || !city) {
    return json({ ok: false, error: "الحقول المطلوبة غير مكتملة." }, 400);
  }

  const looks = form.getAll("looks")
    .filter(v => typeof v === "string")
    .map(v => v.slice(0, 100));

  const availability = form.getAll("availability")
    .filter(v => typeof v === "string")
    .map(v => v.slice(0, 100));

  const consent_age = text(form, "consent_age", 10) === "نعم" ? 1 : 0;
  const consent_media = text(form, "consent_media", 10) === "نعم" ? 1 : 0;
  const consent_data = text(form, "consent_data", 10) === "نعم" ? 1 : 0;

  if (!consent_age || !consent_media || !consent_data) {
    return json({ ok: false, error: "يجب الموافقة على الإقرارات المطلوبة." }, 400);
  }

  const id = "MDL-" + crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  const request_id = text(form, "request_id", 80) || id;

  const photoFiles = [];
  for (let i = 1; i <= 4; i++) {
    const file = form.get(`photo_${i}`);
    if (file instanceof File && file.size > 0) {
      photoFiles.push(file);
    }
  }

  if (photoFiles.length < 2 || photoFiles.length > 4) {
    return json({ ok: false, error: "يجب رفع صورتين إلى أربع صور." }, 400);
  }

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  for (const file of photoFiles) {
    if (!file.type.startsWith("image/")) {
      return json({ ok: false, error: "الملفات المرفوعة يجب أن تكون صوراً." }, 400);
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: "إحدى الصور أكبر من الحد المسموح." }, 413);
    }
  }

  const photo_keys = [];

  try {
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const ext = file.type === "image/png" ? "png" : "jpg";
      const key = `model-applications/${id}/photo-${i + 1}.${ext}`;

      await env.MODEL_UPLOADS.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || "image/jpeg"
        },
        customMetadata: {
          application_id: id
        }
      });

      photo_keys.push(key);
    }

    const app = {
      id,
      request_id,
      full_name,
      age,
      phone,
      city,
      instagram: text(form, "instagram", 120),
      nationality: text(form, "nationality", 120),
      skin_type: text(form, "skin_type", 80),
      looks,
      availability,
      allergies: text(form, "allergies", 500),
      experience: text(form, "experience", 2000),
      notes: text(form, "notes", 2000),
      photo_keys
    };

    await env.DB.prepare(`
      INSERT INTO model_applications (
        id, request_id, full_name, age, phone, city, instagram, nationality,
        skin_type, looks_json, availability_json, allergies, experience, notes,
        photos_json, consent_age, consent_media, consent_data, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).bind(
      app.id,
      app.request_id,
      app.full_name,
      app.age,
      app.phone,
      app.city,
      app.instagram,
      app.nationality,
      app.skin_type,
      JSON.stringify(app.looks),
      JSON.stringify(app.availability),
      app.allergies,
      app.experience,
      app.notes,
      JSON.stringify(app.photo_keys),
      consent_age,
      consent_media,
      consent_data
    ).run();

    const notify = async () => {
      let emailSent = 0;
      let whatsappSent = 0;

      try {
        const result = await sendEmail(env, app);
        if (result.sent) emailSent = 1;
      } catch (err) {
        console.error("Email notification failed:", err);
      }

      try {
        const result = await sendWhatsApp(env, app);
        if (result.sent) whatsappSent = 1;
      } catch (err) {
        console.error("WhatsApp notification failed:", err);
      }

      try {
        await env.DB.prepare(`
          UPDATE model_applications
          SET notification_email_sent = ?,
              notification_whatsapp_sent = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(emailSent, whatsappSent, id).run();
      } catch (err) {
        console.error("Notification status update failed:", err);
      }
    };

    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(notify());
    } else {
      await notify();
    }

    return json({
      ok: true,
      application_id: id
    }, 201);

  } catch (err) {
    console.error("Model application save failed:", err);

    await Promise.allSettled(
      photo_keys.map(key => env.MODEL_UPLOADS.delete(key))
    );

    return json({
      ok: false,
      error: "تعذر حفظ الطلب. الرجاء المحاولة مرة أخرى."
    }, 500);
  }
}
