import type { EmailDef } from "./types";
import { LOGO_ATTACHMENT } from "./mailer";

// Re-export so callers import one thing.
export { LOGO_ATTACHMENT };

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render an EmailDef (block-based template from lib/emails.ts) into a
 * Gmail-compatible HTML string. Pass actual variable values in `vars`
 * to substitute {{placeholder}} tokens.
 */
export function renderEmailHtml(def: EmailDef, vars: Record<string, string>): string {
  const accent = def.accent;
  const preheader = def.preheader ? esc(interpolate(def.preheader, vars)) : "";

  const logoImg = `<img src="cid:logomark" width="28" height="28" alt="P" style="display:inline-block;vertical-align:middle;border:0"/>`;

  const blocksHtml = def.blocks.map((block) => {
    switch (block.type) {
      case "h":
        return `<h1 style="margin:0 0 14px;font-size:22px;font-weight:900;line-height:1.3;color:#18181B">${esc(interpolate(block.text ?? "", vars))}</h1>`;

      case "p":
        return `<p style="margin:0 0 14px;font-size:13.5px;line-height:1.7;color:${accent}">${esc(interpolate(block.text ?? "", vars))}</p>`;

      case "note":
        return `<p style="margin:0 0 14px;font-size:12px;line-height:1.65;color:#9CA3AF">${esc(interpolate(block.text ?? "", vars))}</p>`;

      case "code":
        return `<div style="border-radius:12px;background:#F5F5F7;padding:22px;text-align:center;margin:0 0 14px">
  <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:34px;font-weight:900;letter-spacing:10px;color:#18181B">${esc(interpolate(block.text ?? "", vars))}</div>
</div>`;

      case "btn":
        return `<div style="margin:20px 0">
  <a href="#" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-size:13.5px;font-weight:700;padding:12px 24px;border-radius:10px">${esc(interpolate(block.text ?? "", vars))}</a>
</div>`;

      case "linkbox":
        return `<div style="margin:0 0 14px;padding:11px 14px;border-radius:9px;border:1px solid #E2E2E6;font-size:12.5px;word-break:break-all;color:${accent}">${esc(interpolate(block.text ?? "", vars))}</div>`;

      case "kv": {
        const rows = (block.rows ?? [])
          .map(([label, value]) => {
            const v = interpolate(value, vars);
            if (!v) return "";
            const labelVal = esc(label);
            const valueVal = esc(v);
            return `<tr>
  <td style="padding:10px 14px;font-size:12.5px;color:#6B7280;border-bottom:1px solid #F2F2F4">${labelVal}</td>
  <td style="padding:10px 14px;font-size:12.5px;font-weight:700;color:#18181B;text-align:right;border-bottom:1px solid #F2F2F4">${valueVal}</td>
</tr>`;
          })
          .join("");
        return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #E2E2E6;margin:0 0 18px">${rows}</table>`;
      }

      case "bullets": {
        const items = (block.items ?? [])
          .map((item) => `<li style="margin-bottom:6px;font-size:13.5px;line-height:1.6;color:#18181B">${esc(interpolate(item, vars))}</li>`)
          .join("");
        return `<ul style="margin:0 0 14px;padding-left:20px">${items}</ul>`;
      }

      case "divider":
        return `<div style="height:1px;background:#F2F2F4;margin:16px 0"></div>`;

      default:
        return "";
    }
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>${esc(def.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F0F0F3;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#18181B">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${preheader}</div>` : ""}

  <div style="padding:32px 16px">
    <div style="margin:0 auto;max-width:540px;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)">

      <div style="height:5px;background:${accent}"></div>

      <div style="padding:24px 32px 0">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">${logoImg}</td>
            <td style="vertical-align:middle;font-size:14px;font-weight:800;letter-spacing:-.3px;color:#18181B;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif">Prodi-Surveys</td>
          </tr>
        </table>
      </div>

      <div style="padding:20px 32px 8px">
        ${blocksHtml}
      </div>

      <div style="margin-top:16px;border-top:1px solid #F2F2F4;padding:20px 32px">
        <p style="margin:0;font-size:11px;line-height:1.7;color:#9CA3AF">
          <span style="color:#6B7280">Prodigitality</span> &middot; <a href="https://prodigitalitydata.live" style="color:${accent};text-decoration:none">prodigitalitydata.live</a>
        </p>
        <p style="margin:4px 0 0;font-size:11px;line-height:1.7;color:#9CA3AF">
          You received this email because you registered for or were added to the <a href="https://prodigitalitydata.live" style="color:${accent};text-decoration:none">Prodigitality</a> baseline survey.
        </p>
      </div>
    </div>

    ${preheader ? `<p style="margin:12px 0 0;text-align:center;font-size:11px;color:#ADADB8">${preheader}</p>` : ""}
  </div>
</body>
</html>`;
}
