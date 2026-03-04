import { Type } from "class-transformer";
import { IsArray, IsEmail, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class ReceiptItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  amount!: number;
}

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

  // ฟิลด์สำหรับใบเสร็จ (Receipt)
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @IsOptional()
  @IsString()
  receiptDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  receiptItems?: ReceiptItemDto[];

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}