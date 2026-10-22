import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginAttemptService } from './login-attempt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SseJwtStrategy } from './strategies/sse-jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { BitacoraModule } from '../bitacora/bitacora.module';

@Module({
  imports: [
    PrismaModule,
    BitacoraModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'sigeb-jwt-secret-dev',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Se construye por fábrica: sus parámetros (máximo de intentos, ventana,
    // reloj) tienen valores por defecto y NO deben resolverse por inyección.
    { provide: LoginAttemptService, useFactory: () => new LoginAttemptService() },
    JwtStrategy,
    SseJwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
