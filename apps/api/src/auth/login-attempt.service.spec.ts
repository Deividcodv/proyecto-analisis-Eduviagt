import { LoginAttemptService } from './login-attempt.service';

describe('LoginAttemptService (S-002)', () => {
  const construir = (maxIntentos = 5, ventanaMs = 15 * 60 * 1000) => {
    let ahora = 0;
    const servicio = new LoginAttemptService(
      maxIntentos,
      ventanaMs,
      () => ahora,
    );
    return {
      servicio,
      avanzar: (ms: number) => {
        ahora += ms;
      },
    };
  };

  it('no bloquea mientras no se alcanza el máximo de fallos', () => {
    const { servicio } = construir(5);
    servicio.registrarFallo('ip:juan');
    servicio.registrarFallo('ip:juan');

    expect(servicio.estado('ip:juan').bloqueado).toBe(false);
  });

  it('bloquea al alcanzar el máximo de fallos', () => {
    const { servicio } = construir(3);
    servicio.registrarFallo('ip:juan');
    servicio.registrarFallo('ip:juan');
    servicio.registrarFallo('ip:juan');

    expect(servicio.estado('ip:juan').bloqueado).toBe(true);
  });

  it('informa los segundos que faltan para reintentar', () => {
    const { servicio } = construir(1, 60_000);
    servicio.registrarFallo('ip:juan');

    expect(servicio.estado('ip:juan').reintentarEnSegundos).toBe(60);
  });

  it('se desbloquea al pasar la ventana', () => {
    const { servicio, avanzar } = construir(1, 60_000);
    servicio.registrarFallo('ip:juan');
    avanzar(60_001);

    expect(servicio.estado('ip:juan').bloqueado).toBe(false);
  });

  it('un inicio de sesión exitoso reinicia el contador', () => {
    const { servicio } = construir(2);
    servicio.registrarFallo('ip:juan');
    servicio.registrarExito('ip:juan');
    servicio.registrarFallo('ip:juan');

    expect(servicio.estado('ip:juan').bloqueado).toBe(false);
  });

  it('el bloqueo es por clave: no afecta a otras', () => {
    const { servicio } = construir(1);
    servicio.registrarFallo('ip:juan');

    expect(servicio.estado('ip:juan').bloqueado).toBe(true);
    expect(servicio.estado('ip:ana').bloqueado).toBe(false);
  });
});
