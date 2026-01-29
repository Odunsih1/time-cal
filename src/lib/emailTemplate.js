
export const generateEmailTemplate = ({ title, body, details, ctaLink, ctaText, footer }) => {
  const detailsHtml = details
    ? `
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Details:</h3>
      <ul style="padding-left: 20px; margin-bottom: 0; color: #475569;">
        ${details.map((detail) => `<li style="margin-bottom: 8px;"><strong>${detail.label}:</strong> ${detail.value}</li>`).join("")}
      </ul>
    </div>
  `
    : "";

  const ctaHtml =
    ctaLink && ctaText
      ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        ${ctaText}
      </a>
    </div>
  `
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 24px 0;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: none;
    }
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 32px;
      margin-bottom: 24px;
    }
    .title {
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      color: #334155;
      font-size: 16px;
      margin-bottom: 16px;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://time-cal.vercel.app" class="logo">Time-Cal</a>
    </div>
    <div class="card">
      <h1 class="title">${title}</h1>
      <div class="text">
        ${body}
      </div>
      ${detailsHtml}
      ${ctaHtml}
      <div class="text" style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
        <p style="margin: 0;">Best regards,<br>The Time-Cal Team</p>
      </div>
    </div>
    <div class="footer">
      <p>${footer || "© 2024 Time-Cal. All rights reserved."}</p>
    </div>
  </div>
</body>
</html>
  `;
};
