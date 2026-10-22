import { BadRequestException } from '@nestjs/common';

export type SolicitudEstado =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'EN_REVISION'
  | 'CORRECCION'
  | 'EVALUADA'
  | 'PENDIENTE_SEGUNDA_APROBACION'
  | 'APROBADA'
  | 'RECHAZADA';

export type SolicitudTransicion =
  | 'enviar'
  | 'iniciar_revision'
  | 'solicitar_correccion'
  | 'corregir'
  | 'evaluar'
  | 'aprobar'
  | 'rechazar'
  // Sprint 8 (US-802/803): segunda instancia de aprobación.
  | 'solicitar_segunda_aprobacion'
  | 'aprobar_segunda'
  | 'devolver_a_revision';

const TRANSITIONS: Record<
  SolicitudEstado,
  Partial<Record<SolicitudTransicion, SolicitudEstado>>
> = {
  BORRADOR: { enviar: 'ENVIADA' },
  ENVIADA: { iniciar_revision: 'EN_REVISION' },
  EN_REVISION: { solicitar_correccion: 'CORRECCION', evaluar: 'EVALUADA' },
  CORRECCION: { corregir: 'BORRADOR' },
  EVALUADA: {
    aprobar: 'APROBADA',
    rechazar: 'RECHAZADA',
    // Se usa cuando el monto otorgable supera el umbral de control.
    solicitar_segunda_aprobacion: 'PENDIENTE_SEGUNDA_APROBACION',
  },
  PENDIENTE_SEGUNDA_APROBACION: {
    aprobar_segunda: 'APROBADA',
    rechazar: 'RECHAZADA',
    devolver_a_revision: 'EN_REVISION',
  },
  APROBADA: {},
  RECHAZADA: {},
};

export const SOLICITUD_ESTADOS: SolicitudEstado[] = [
  'BORRADOR',
  'ENVIADA',
  'EN_REVISION',
  'CORRECCION',
  'EVALUADA',
  'PENDIENTE_SEGUNDA_APROBACION',
  'APROBADA',
  'RECHAZADA',
];

export class SolicitudStateMachine {
  static next(
    estadoActual: SolicitudEstado,
    accion: SolicitudTransicion,
  ): SolicitudEstado {
    const destino = TRANSITIONS[estadoActual]?.[accion];

    if (!destino) {
      throw new BadRequestException(
        `Transición no válida: "${accion}" no se puede realizar desde el estado "${estadoActual}"`,
      );
    }

    return destino;
  }

  static isAllowed(
    estadoActual: SolicitudEstado,
    accion: SolicitudTransicion,
  ): boolean {
    return Boolean(TRANSITIONS[estadoActual]?.[accion]);
  }
}