import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { headers: any }>();
    const apiKey = req.headers["x-api-key"];
    const expected = this.config.get<string>("MAIL_API_KEY");

    if (!expected || apiKey !== expected) {
      throw new UnauthorizedException("Invalid API key");
    }
    return true;
  }
}