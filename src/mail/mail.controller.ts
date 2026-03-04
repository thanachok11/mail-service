import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { MailService } from "./mail.service";
import { BookingConfirmedDto } from "./dto/booking-confirmed.dto";
import { GenerateQrCodesDto } from "./dto/generate-qrcodes.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { generateQrCodes } from "./qrcode.util";

@Controller("mail")
export class MailController {
  constructor(private mail: MailService) { }

  @UseGuards(ApiKeyGuard)
  @Post("booking-confirmed")
  async bookingConfirmed(@Body() dto: BookingConfirmedDto) {
    await this.mail.sendBookingConfirmed(dto);
    return { ok: true };
  }

  @UseGuards(ApiKeyGuard)
  @Post("qrcode")
  async generateQrCodes(@Body() dto: GenerateQrCodesDto) {
    const qrCodes = await generateQrCodes(dto.texts);
    return {
      ok: true,
      data: qrCodes,
    };
  }

  @UseGuards(ApiKeyGuard)
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.mail.sendResetPassword(dto);
    return { ok: true };
  }
}

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { ok: true };
  }
}