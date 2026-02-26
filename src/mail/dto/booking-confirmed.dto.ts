import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class BookingConfirmedDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsString()
  @MinLength(1)
  bookingId!: string;

  @IsString()
  @MinLength(1)
  travelDateText!: string; // "24 JAN 2026"

  @IsString()
  @MinLength(1)
  manageUrl!: string;

  // แนบ QR เป็น base64 (optional)
  @IsOptional()
  @IsString()
  qrBase64?: string; // base64 ของไฟล์ png/pdf (ไม่ต้องมี data:... ก็ได้)

  @IsOptional()
  @IsString()
  qrFilename?: string; // "QR-Code.png"
}