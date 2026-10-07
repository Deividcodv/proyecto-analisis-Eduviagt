import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';

function extraerTokenDeQuery(req: Request): string | null {
  const token = req?.query?.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@Injectable()
export class SseJwtStrategy extends PassportStrategy(Strategy, 'sse-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extraerTokenDeQuery,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { rol: true },
    });

    if (!user || user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      id: user.id,
      cui: user.cui,
      nombres: user.nombres,
      email: user.email,
      rol: user.rol,
    };
  }
}
