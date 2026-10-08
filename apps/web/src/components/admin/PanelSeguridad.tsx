'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PanelUsuarios } from '@/components/admin/PanelUsuarios';
import { MatrizRoles } from '@/components/admin/MatrizRoles';

export function PanelSeguridad() {
  const [subtab, setSubtab] = useState<'matriz' | 'usuarios'>('matriz');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={subtab === 'matriz' ? 'primary' : 'ghost'}
          onClick={() => setSubtab('matriz')}
        >
          Matriz de roles
        </Button>
        <Button
          variant={subtab === 'usuarios' ? 'primary' : 'ghost'}
          onClick={() => setSubtab('usuarios')}
        >
          Usuarios
        </Button>
      </div>

      {subtab === 'matriz' ? <MatrizRoles /> : <PanelUsuarios />}
    </div>
  );
}
