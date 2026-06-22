import nodemailer from "nodemailer";
import { requireAnyEnv } from "./env";

// Hexagonal "P" logo — embedded as inline CID attachment so Gmail renders it
// without requiring an external image request.
const LOGO_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAASZSURBVGhD7dpNTBtHFAdwjjlyzDFHjjm1BAomUOzlyzbGBmOMxw7hIwUKabAxH61Re0CtKuVIW0KQKrWop/TScuRWh7QSt9IbRx837NfMOoleZ2CiOgglnt314q3yl56E5AXPT+v3xmi24X3eRyynPtTMf/x/RfOhm0pn6kDtSoHSOX6kdo118Je8HQq7rt5ObamdKWA4tWsc1I9pdSdpjT2RA+gGv9RbAR+6pvhQnuLkS3F+WoEkKFICqz2JTTmEGvmv1n+e+5CkdqSO1dsI3oZTpTFQe8ZA602A2pcoKf3xGf4n6jP0jjWp7al9tYPCBHBaH63+UdAGaAVHi6cDw/U1iGQfatTa0w9VH0XZw4EWioMWjoMeHtnTYrHr/C2uLkobmlHb0rKjuMER0CMjoEViWB+KbQBC1/jbuRe1FXUobekjtT0NtcDpQ8OgR2nFaA1HS+pwNM7furaRP0Q3TlvTT+hdA3dwMdBHYmDEo2CMRotaInaTL8XZsLGvtqQ3KQ5fEQ6MxBAYY7SSkS0NOdifz2+h+GlLuqR8RFFXjqM1HmElayict9Wfpx+gZuVWpqi0pqGucClaaBCM9CDomfCJficU5kuuPkpzZk9pyUA944xMGIw7tCZo3Q0eyChU/bchb+FCYEyGAE+Hqv9e6zncVFAQ6DmcINAODn/5Lbz849l5FSvq6es6BPPRDhhT087hZgYEgTbunLm1C9WGfPO1M7h7okAbH0vzu+qBLPjepH3cJ6JAGz1XCXz19zHg7AqtPOAcreU8lPd+5q+ep/zLT/Zxs/2AF0SANgaK+f1jvnQ467nLBkr58SN+Bb3mz6f2cXMMGBAAWsSxafkm8PDSaUm+KvArONAmjsz3CQIt4thWYP6ww5dOF39IgRe3gkwSXv1zzK8AePHbr7Zx5FNhoDUc2+fM7f+ALAz58tl5VcJeh3yRtY0jC72CQIs4tolfBL4tL36nd88BHFkUBVrEsYHCNvFqUv5x2zEcuS8KtIhjA6USyD6SZDUHZC0LZJ3W51nA8xOO9FwljnzWIwi0iGMDxdyp2AJo3zmyib8DRx5Q4LII0CKOTcs3gGwLcAFHlkSBFnG12sTfhSNZQaBVHNvnyrsXgC7gSE4SBFrEsf8KyrvbnEeBf1GgCziyLAq0iGMDBc/ePZuWZxMzN+cKjuRFgRZxbg2UiziyEhAEegxHVkWBHsOZq35BoMdw5hoFFgSAXsOZ691iQC0yfOIlHFnvlrWCr/oDGXaooUVieYqT6x1H6yEUfNYeYmDHyNpIdKtOcfuk4G/iS7UXdvBojA4V6wPXfYzXuiS+NGdjJKNxIzlYugocWfHLZNW/yJdSu7D+1NHghp4OY9fu3Ip/Syv0uvvUBTtG1jPhvdri/AfmandtzuWrDZ4IdRiTwSNncf4TWuInt7WMPhWcwdMDJZs42Vjx5+nYd//ZmGoiL4QaKXDTmO3H4rjAnrbkcp9ZDZnrbyJzffvV4QJFPSd580FZPN8r4cWe48txgZKRk9x5gqnWIfelRfJAkhkOL/VgnA1s1G2fWQ3Q/jSWpLxn+qz+09DwL4PcNWwNY0/VAAAAAElFTkSuQmCC";

export const LOGO_ATTACHMENT = {
  filename: "logo-mark.png",
  content: Buffer.from(LOGO_PNG_B64, "base64"),
  cid: "logomark",
  contentType: "image/png",
};

export const FROM_ADDRESS =
  process.env.SMTP_FROM || "Prodi-Surveys <no-reply@prodigitality.net>";

// Headers that signal good email hygiene to spam filters.
// List-Unsubscribe + One-Click satisfies Gmail's bulk-sender requirements and
// prevents "Report as spam" being the only opt-out visible to the user.
export const TRANSACTIONAL_HEADERS = {
  "List-Unsubscribe": "<mailto:no-reply@prodigitality.net?subject=unsubscribe>",
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  "X-Mailer": "Prodi-Surveys",
};

export function createTransporter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: Record<string, any> = {
    host: requireAnyEnv(["SMTP_HOST"]),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: requireAnyEnv(["SMTP_USER"]),
      pass: requireAnyEnv(["SMTP_PASS"]),
    },
  };

  // DKIM signing: add DKIM_PRIVATE_KEY, DKIM_SELECTOR, DKIM_DOMAIN to .env
  // to cryptographically sign outgoing mail — biggest single spam-score win.
  if (process.env.DKIM_PRIVATE_KEY && process.env.DKIM_SELECTOR) {
    config.dkim = {
      domainName: process.env.DKIM_DOMAIN || "prodigitality.net",
      keySelector: process.env.DKIM_SELECTOR,
      privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return nodemailer.createTransport(config);
}
