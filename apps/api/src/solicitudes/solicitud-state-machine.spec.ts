import { BadRequestException } from '@nestjs/common';
import {
  SolicitudStateMachine,
  SOLICITUD_ESTADOS,
} from './solicitud-state-machine';

describe('SolicitudStateMachine', () => {
  it('envía BORRADOR -> ENVIADA', () => {
    expect(SolicitudStateMachine.next('BORRADOR', 'enviar')).toBe('ENVIADA');
  });

  it('recorre el flujo principal completo', () => {
    let estado: string = 'BORRADOR';
    const acciones: Array<[string, string]> = [
      ['enviar', 'ENVIADA'],
      ['iniciar_revision', 'EN_REVISION'],
      ['evaluar', 'EVALUADA'],
      ['aprobar', 'APROBADA'],
    ];

    for (const [accion, esperado] of acciones) {
      estado = SolicitudStateMachine.next(estado as never, accion as never);
      expect(estado).toBe(esperado);
    }
  });

  it('recorre el flujo con correcciones', () => {
    let estado: string = 'BORRADOR';
    const acciones: Array<[string, string]> = [
      ['enviar', 'ENVIADA'],
      ['iniciar_revision', 'EN_REVISION'],
      ['solicitar_correccion', 'CORRECCION'],
      ['corregir', 'BORRADOR'],
      ['enviar', 'ENVIADA'],
    ];

    for (const [accion, esperado] of acciones) {
      estado = SolicitudStateMachine.next(estado as never, accion as never);
      expect(estado).toBe(esperado);
    }
  });

  it('permite rechazar una solicitud evaluada', () => {
    expect(SolicitudStateMachine.next('EVALUADA', 'rechazar')).toBe('RECHAZADA');
  });

  it('rechaza transiciones inválidas con BadRequestException', () => {
    expect(() => SolicitudStateMachine.next('BORRADOR', 'aprobar')).toThrow(
      BadRequestException,
    );
    expect(() => SolicitudStateMachine.next('ENVIADA', 'enviar')).toThrow(
      BadRequestException,
    );
    expect(() => SolicitudStateMachine.next('APROBADA', 'rechazar')).toThrow(
      BadRequestException,
    );
  });

  it('isAllowed refleja las transiciones válidas', () => {
    expect(SolicitudStateMachine.isAllowed('BORRADOR', 'enviar')).toBe(true);
    expect(SolicitudStateMachine.isAllowed('BORRADOR', 'evaluar')).toBe(false);
    expect(SolicitudStateMachine.isAllowed('CORRECCION', 'corregir')).toBe(true);
  });

  it('expone los ocho estados del flujo', () => {
    expect(SOLICITUD_ESTADOS).toEqual([
      'BORRADOR',
      'ENVIADA',
      'EN_REVISION',
      'CORRECCION',
      'EVALUADA',
      'PENDIENTE_SEGUNDA_APROBACION',
      'APROBADA',
      'RECHAZADA',
    ]);
  });

  describe('segunda instancia de aprobación (Sprint 8)', () => {
    it('lleva EVALUADA a PENDIENTE_SEGUNDA_APROBACION', () => {
      expect(
        SolicitudStateMachine.next(
          'EVALUADA',
          'solicitar_segunda_aprobacion',
        ),
      ).toBe('PENDIENTE_SEGUNDA_APROBACION');
    });

    it('aprueba en segunda instancia', () => {
      expect(
        SolicitudStateMachine.next(
          'PENDIENTE_SEGUNDA_APROBACION',
          'aprobar_segunda',
        ),
      ).toBe('APROBADA');
    });

    it('rechaza en segunda instancia', () => {
      expect(
        SolicitudStateMachine.next(
          'PENDIENTE_SEGUNDA_APROBACION',
          'rechazar',
        ),
      ).toBe('RECHAZADA');
    });

    it('devuelve a revisión desde la segunda instancia', () => {
      expect(
        SolicitudStateMachine.next(
          'PENDIENTE_SEGUNDA_APROBACION',
          'devolver_a_revision',
        ),
      ).toBe('EN_REVISION');
    });

    it('no permite aprobar en segunda instancia desde EVALUADA', () => {
      expect(() =>
        SolicitudStateMachine.next('EVALUADA', 'aprobar_segunda'),
      ).toThrow(BadRequestException);
    });

    it('no permite devolver a revisión sin pasar por la segunda instancia', () => {
      expect(() =>
        SolicitudStateMachine.next('EVALUADA', 'devolver_a_revision'),
      ).toThrow(BadRequestException);
    });
  });
});