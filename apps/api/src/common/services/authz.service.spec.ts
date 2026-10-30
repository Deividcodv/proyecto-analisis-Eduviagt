import { AuthzService } from './authz.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROL } from '../constants/roles';

function usuario(nombreRol: string, id = 'u-1'): AuthenticatedUser {
  return {
    id,
    cui: '1234567890123',
    nombres: 'Persona Prueba',
    email: 'prueba@demo.gt',
    rol: { id: 'r-1', nombre: nombreRol, descripcion: null },
  };
}

describe('AuthzService — matriz de roles del flujo de revisión', () => {
  const authz = new AuthzService({
    evaluacion: { findFirst: jest.fn().mockResolvedValue(null) },
  } as any);

  describe('esPersonal (personal revisor)', () => {
    it.each([
      ROL.ADMIN,
      ROL.JEFE_BECAS,
      ROL.COORDINADOR_COMITE,
      ROL.MIEMBRO_COMITE,
    ])('%s es personal revisor', (rol) => {
      expect(authz.esPersonal(usuario(rol))).toBe(true);
    });

    it.each([ROL.POSTULANTE, ROL.EVALUADOR])('%s NO es personal revisor', (rol) => {
      expect(authz.esPersonal(usuario(rol))).toBe(false);
    });
  });

  describe('puedeAprobar (firma de la aprobación)', () => {
    it.each([ROL.ADMIN, ROL.JEFE_BECAS, ROL.COORDINADOR_COMITE])(
      '%s puede aprobar',
      (rol) => {
        expect(authz.puedeAprobar(usuario(rol))).toBe(true);
      },
    );

    // El miembro del comité vota en la sesión; la firma es del jefe de becas
    // o del coordinador del comité.
    it.each([ROL.MIEMBRO_COMITE, ROL.EVALUADOR, ROL.POSTULANTE])(
      '%s NO puede aprobar',
      (rol) => {
        expect(authz.puedeAprobar(usuario(rol))).toBe(false);
      },
    );
  });

  describe('puedeSegundaAprobacion', () => {
    it('es falsa si la persona ya firmó la primera instancia', () => {
      expect(
        authz.puedeSegundaAprobacion(usuario(ROL.JEFE_BECAS, 'u-9'), 'u-9'),
      ).toBe(false);
    });

    it('es verdadera para el jefe de becas si firmó otra persona', () => {
      expect(
        authz.puedeSegundaAprobacion(usuario(ROL.JEFE_BECAS, 'u-9'), 'u-8'),
      ).toBe(true);
    });

    it('es verdadera para el coordinador del comité si firmó otra persona', () => {
      expect(
        authz.puedeSegundaAprobacion(
          usuario(ROL.COORDINADOR_COMITE, 'u-9'),
          'u-8',
        ),
      ).toBe(true);
    });

    it('es falsa para el miembro del comité aunque no haya primera firma', () => {
      expect(
        authz.puedeSegundaAprobacion(usuario(ROL.MIEMBRO_COMITE), null),
      ).toBe(false);
    });
  });
});
