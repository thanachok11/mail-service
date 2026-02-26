import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import mjml2html from "mjml";
import * as fs from "fs";
import * as path from "path";
import { BookingConfirmedDto } from "./dto/booking-confirmed.dto";

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        const host = process.env.MAIL_HOST!;
        const port = Number(process.env.MAIL_PORT || 587);

        // 587 = STARTTLS
        const secure = false;

        // dev: ถ้าเจอ self-signed ให้ตั้ง MAIL_TLS_REJECT_UNAUTHORIZED=false
        const rejectUnauthorized =
            process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false";

        // ถ้า host เป็น IP แต่ cert ออกให้โดเมน ให้ใส่โดเมนตรงนี้
        // ex: MAIL_TLS_SERVERNAME=mail.yourdomain.com
        const servername = process.env.MAIL_TLS_SERVERNAME;

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            requireTLS: true,
            tls: {
                rejectUnauthorized,
                ...(servername ? { servername } : {}),
            },
        });
    }

    async sendBookingConfirmed(payload: BookingConfirmedDto) {
        // 1) compile MJML -> HTML
        const mjmlPath = path.join(
            process.cwd(),
            "src/mail/templates/booking-confirmed.mjml"
        );
        if (!fs.existsSync(mjmlPath)) {
            throw new InternalServerErrorException(
                `Template not found: ${mjmlPath}`
            );
        }

        const mjml = fs.readFileSync(mjmlPath, "utf8");

        const compiled = mjml2html(
            mjml
                .replaceAll("{{customerName}}", escapeHtml(payload.customerName))
                .replaceAll("{{bookingId}}", escapeHtml(payload.bookingId))
                .replaceAll("{{travelDateText}}", escapeHtml(payload.travelDateText))
                .replaceAll("{{manageUrl}}", payload.manageUrl),
            { validationLevel: "soft" }
        );

        if (!compiled.html) {
            throw new InternalServerErrorException("Template compile failed");
        }

        // 2) inline logo as CID attachment
        const logoPath = path.join(
            process.cwd(),
            "src/mail/templates/assets/logo.png"
        );
        if (!fs.existsSync(logoPath)) {
            throw new InternalServerErrorException(
                `logo.png not found: ${logoPath}`
            );
        }

        // IMPORTANT: cid ต้องตรงกับใน MJML: src="cid:brandlogo@cmtram"
        const logoCid = "brandlogo@cmtram";

        const attachments: Attachment[] = [
            {
                filename: "logo.png",
                path: logoPath,
                cid: logoCid,
                contentType: "image/png",
                contentDisposition: "inline",
            },
            {
                filename: "facebook.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/facebook.png"),
                cid: "facebook@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
            },
            {
                filename: "x.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/x.png"),
                cid: "x@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
            },
            {
                filename: "instagram.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/instagram.png"),
                cid: "instagram@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
            },
        ];

        // 3) attach QR from base64 (optional)
        if (payload.qrBase64) {
            const base64 = stripDataUrl(payload.qrBase64);
            attachments.push({
                filename: payload.qrFilename || "QR-Code.png",
                content: Buffer.from(base64, "base64"),
                contentType: guessContentType(payload.qrFilename) || "application/octet-stream",
            });
        }

        // 4) send email
        const from = process.env.MAIL_FROM || process.env.MAIL_USER;
        if (!from) throw new InternalServerErrorException("MAIL_FROM or MAIL_USER is required");

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject: `Your booking is confirmed (${payload.bookingId})`,
                html: compiled.html,
                attachments,
            });
        } catch (e: any) {
            throw new InternalServerErrorException(
                `Send mail failed: ${e?.message || "unknown"}`
            );
        }
    }
}

function stripDataUrl(v: string) {
    // รองรับทั้ง raw base64 และ data:*;base64,xxxx
    const idx = v.indexOf("base64,");
    return idx >= 0 ? v.slice(idx + "base64,".length) : v;
}

function escapeHtml(s: string) {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function guessContentType(filename?: string) {
    if (!filename) return "";
    const ext = filename.toLowerCase().split(".").pop();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "pdf") return "application/pdf";
    return "";
}