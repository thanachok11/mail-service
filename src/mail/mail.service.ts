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
            secure: false,
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
            requireTLS: true,
            tls: { rejectUnauthorized, ...(servername ? { servername } : {}) },

            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 15_000,
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

        // cid is no longer needed for logo, using direct URL


        const attachments: Attachment[] = [
            {
                filename: "facebook.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/facebook.png"),
                cid: "facebook@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
                headers: { "Content-ID": `<facebook@cmtram>`, "X-Attachment-Id": "facebook@cmtram" }
            },
            {
                filename: "x.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/x.png"),
                cid: "x@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
                headers: { "Content-ID": `<x@cmtram>`, "X-Attachment-Id": "x@cmtram" }
            },
            {
                filename: "instagram.png",
                path: path.join(process.cwd(), "src/mail/templates/assets/instagram.png"),
                cid: "instagram@cmtram",
                contentType: "image/png",
                contentDisposition: "inline",
                headers: { "Content-ID": `<instagram@cmtram>`, "X-Attachment-Id": "instagram@cmtram" }
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

    async sendReceiptEmail(payload: BookingConfirmedDto) {
        // 1) compile MJML -> HTML
        const mjmlPath = path.join(
            process.cwd(),
            "src/mail/templates/receipt.mjml"
        );
        if (!fs.existsSync(mjmlPath)) {
            throw new InternalServerErrorException(
                `Template not found: ${mjmlPath}`
            );
        }

        const mjml = fs.readFileSync(mjmlPath, "utf8");

        // Prepare table rows
        let receiptTableRows = "";
        if (payload.receiptItems) {
            receiptTableRows = payload.receiptItems.map(item => {
                const desc = escapeHtml(item.description).replace(/\\n/g, "<br/>");
                return `
                <tr>
                    <td>${desc}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">${item.amount.toFixed(2)}</td>
                </tr>
                `;
            }).join("");
        }

        const compiled = mjml2html(
            mjml
                .replaceAll("{{receiptNo}}", escapeHtml(payload.receiptNo || payload.bookingId))
                .replaceAll("{{receiptDate}}", escapeHtml(payload.receiptDate || payload.travelDateText))
                .replaceAll("{{receiptTableRows}}", receiptTableRows)
                .replaceAll("{{totalAmount}}", (payload.totalAmount || 0).toFixed(2))
                .replaceAll("{{paymentMethod}}", escapeHtml(payload.paymentMethod || "Credit Card / Transfer")),
            { validationLevel: "soft" }
        );

        if (!compiled.html) {
            throw new InternalServerErrorException("Template compile failed");
        }

        // 2) no inline attachments needed for receipt
        const attachments: Attachment[] = [];

        // 3) send email
        const from = process.env.MAIL_FROM || process.env.MAIL_USER;
        if (!from) throw new InternalServerErrorException("MAIL_FROM or MAIL_USER is required");

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject: `Receipt for your booking (${payload.receiptNo || payload.bookingId})`,
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