import PDFDocument from "pdfkit";
import * as path from "path";
import * as QRCode from 'qrcode';

export interface ReceiptData {
    receiptNo: string;
    date: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: "A4" });
            const buffers: Buffer[] = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => {
                resolve(Buffer.concat(buffers));
            });
            doc.on("error", (err) => {
                reject(err);
            });

            // Register Thai fonts
            const fontRegular = path.join(process.cwd(), "src/mail/fonts/Sarabun-Regular.ttf");
            const fontBold = path.join(process.cwd(), "src/mail/fonts/Sarabun-Bold.ttf");

            doc.registerFont('Sarabun', fontRegular);
            doc.registerFont('Sarabun-Bold', fontBold);

            const boxTop = 50;
            const boxLeft = 50;
            const boxWidth = 495;
            let cursorY = boxTop + 20;
            const marginX = boxLeft + 15;

            // Ensure we use the Thai font
            doc.font('Sarabun');

            // Header Texts
            doc.fontSize(12).font('Sarabun-Bold').text("Chaingmai Tram by Lannatique", marginX, cursorY);
            cursorY += 20;
            doc.font('Sarabun').text("Tax ID : 0105565154315", marginX, cursorY);
            cursorY += 25;

            // Receipt Title
            doc.fontSize(14).font('Sarabun-Bold').text("RECEIPT", marginX, cursorY);
            cursorY += 25;

            // Details
            doc.fontSize(12).font('Sarabun').text(`Receipt No.: ${data.receiptNo}`, marginX, cursorY);
            cursorY += 20;
            doc.text(`Date: ${data.date}`, marginX, cursorY);
            cursorY += 30;

            // Table Header layout
            const colDesc = marginX;
            const colQty = marginX + 220;
            const colPrice = marginX + 300;
            const colAmount = marginX + 400;

            doc.fontSize(11).text("Description", colDesc, cursorY, { width: 200, align: "left" });
            doc.text("Quantity", colQty, cursorY, { width: 60, align: "center" });
            doc.text("Unit Price (THB)", colPrice, cursorY, { width: 90, align: "right" });
            doc.text("Amount (THB)", colAmount, cursorY, { width: 80, align: "right" });

            cursorY += 15;

            // Horizontal line
            doc.moveTo(boxLeft, cursorY).lineTo(boxLeft + boxWidth, cursorY).stroke();
            cursorY += 15;

            // Table Rows
            doc.fontSize(11);
            data.items.forEach((item) => {
                const textHeight = doc.heightOfString(item.description, { width: 200, align: "left" });

                doc.text(item.description, colDesc, cursorY, { width: 200, align: "left" });
                doc.text(item.quantity.toString(), colQty, cursorY, { width: 60, align: "center" });
                doc.text(item.unitPrice.toString(), colPrice, cursorY, { width: 90, align: "right" });
                doc.text(item.amount.toString(), colAmount, cursorY, { width: 80, align: "right" });

                cursorY += Math.max(textHeight, 15) + 5;
            });

            cursorY += 10;

            // Total Amount
            doc.fontSize(12).font('Sarabun-Bold').text(`Total Amount: ${data.totalAmount.toFixed(2)} THB`, marginX, cursorY);
            cursorY += 25;

            // Payment method
            doc.font('Sarabun').text(`Payment Method: ${data.paymentMethod}`, marginX, cursorY);
            cursorY += 25;

            // Footer
            doc.text("Thank you for Using Chaingmai Tram by Lannatique", marginX, cursorY);
            cursorY += 25;

            // Draw outer box border
            const boxHeight = cursorY - boxTop;
            doc.rect(boxLeft, boxTop, boxWidth, boxHeight).stroke();

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

export interface TicketData {
    ticketNo: string;
    customerName: string;
    travelDate: string;
    bookingId: string;
    description: string; // e.g., "Adult Tram Fare"
}

export async function generateTicketsPdf(tickets: TicketData[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: "A4", autoFirstPage: false });
            const buffers: Buffer[] = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            const fontRegular = path.join(process.cwd(), "src/mail/fonts/Sarabun-Regular.ttf");
            const fontBold = path.join(process.cwd(), "src/mail/fonts/Sarabun-Bold.ttf");

            doc.registerFont('Sarabun', fontRegular);
            doc.registerFont('Sarabun-Bold', fontBold);
            doc.font('Sarabun');

            for (let i = 0; i < tickets.length; i++) {
                // Add page for the first ticket (i=0) and every subsequent pair (i=2, 4...)
                if (i % 2 === 0) {
                    doc.addPage();
                }

                const t = tickets[i];

                // If it's the second ticket on the page (index 1, 3, 5...), push it lower
                const isSecondOnPage = i % 2 === 1;
                // A4 Height is ~841.
                const boxTop = isSecondOnPage ? 430 : 50;
                const boxLeft = 50;
                const boxWidth = 495;
                const boxHeight = 280;
                let marginX = boxLeft + 20;
                let cursorY = boxTop + 20;

                // Title
                doc.fontSize(16).font('Sarabun-Bold').text("E-Ticket : Chiang Mai Tram", marginX, cursorY, { align: 'center', width: boxWidth - 40 });
                cursorY += 40;

                // QR Code mapping from ticketNo
                const qrUrl = await QRCode.toDataURL(t.ticketNo, { margin: 1, width: 140 });
                const base64Data = qrUrl.replace(/^data:image\/png;base64,/, "");
                const qrBuffer = Buffer.from(base64Data, "base64");

                const qrSize = 140;
                const qrX = boxLeft + boxWidth - qrSize - 20;
                doc.image(qrBuffer, qrX, cursorY, { width: qrSize, height: qrSize });

                // Ticket info
                doc.fontSize(14).font('Sarabun-Bold').text(`Ticket No: ${t.ticketNo}`, marginX, cursorY);
                cursorY += 30;
                doc.fontSize(12).font('Sarabun').text(`Name: ${t.customerName}`, marginX, cursorY);
                cursorY += 25;
                doc.text(`Booking Ref: ${t.bookingId}`, marginX, cursorY);
                cursorY += 25;
                doc.text(`Travel Date: ${t.travelDate}`, marginX, cursorY);
                cursorY += 25;
                doc.text(`Type: ${t.description}`, marginX, cursorY);

                // Draw ticket border
                doc.rect(boxLeft, boxTop, boxWidth, boxHeight).dash(5, { space: 3 }).stroke();
                doc.undash(); // Reset dash for any subsequent drawing if needed
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
