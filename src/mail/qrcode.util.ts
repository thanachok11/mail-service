import * as QRCode from 'qrcode';

/**
 * Generates an array of Base64 encoded PNG images from an array of text strings.
 * @param texts Array of strings to encode as QR codes.
 * @returns Array of Base64 strings representing the QR codes.
 */
export async function generateQrCodes(texts: string[]): Promise<string[]> {
    if (!texts || texts.length === 0) {
        return [];
    }

    const qrPromises = texts.map(async (text) => {
        try {
            // Generate QR code as a data URI (data:image/png;base64,...)
            const qrDataUrl = await QRCode.toDataURL(text, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            return qrDataUrl;
        } catch (error) {
            console.error(`Failed to generate QR code for text: ${text}`, error);
            throw error;
        }
    });

    return Promise.all(qrPromises);
}
