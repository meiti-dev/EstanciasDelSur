import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const EstanciasDelSur_muujoww4__ES_GestorReservas = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const esAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';
  
  const [reservas, setReservas] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const urlRes = `/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}${!esAdmin ? '&huesped_id=' + miId : ''}`;
    const [resRes, resDep] = await Promise.all([
      MEITI.fetchDatos(urlRes),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`)
    ]);
    if (resRes.ok) {
      let regs = resRes.registros;
      setReservas(regs.sort((a,b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio)));
    }
    if (resDep.ok) setDeptos(resDep.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (reserva, nuevoEstado) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ...reserva, estado: nuevoEstado })
    }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('cancel_res_q', null, '¿Cancelar y eliminar esta reserva?'))) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'departamento_id', etiqueta: MEITI.t('accommodation', null, 'Alojamiento'), render: f => deptos.find(d => d.id === f.departamento_id)?.nombre || '---' },
    { clave: 'nombre_huesped', etiqueta: MEITI.t('guest', null, 'Huésped') },
    { clave: 'fecha_inicio', etiqueta: MEITI.t('check_in', null, 'Llegada'), tipo: 'fecha' },
    { clave: 'fecha_fin', etiqueta: MEITI.t('check_out', null, 'Salida'), tipo: 'fecha' },
    { clave: 'monto_total', etiqueta: MEITI.t('total', null, 'Total'), tipo: 'moneda' },
    { clave: 'estado', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={f.estado === 'Confirmada' ? 'exito' : f.estado === 'Cancelada' ? 'peligro' : 'alerta'}>{f.estado}</UI.Chip> }
  ];

  const accionesExtra = esAdmin ? [
    { etiqueta: MEITI.t('confirm', null, 'Confirmar'), icono: 'fa-check', tono: 'exito', condicion: f => f.estado === 'Pendiente', onClick: f => cambiarEstado(f, 'Confirmada') },
    { etiqueta: MEITI.t('complete', null, 'Completar'), icono: 'fa-flag-checkered', tono: 'neutro', condicion: f => f.estado === 'Confirmada', onClick: f => cambiarEstado(f, 'Completada') },
    { etiqueta: MEITI.t('cancel', null, 'Cancelar'), icono: 'fa-ban', tono: 'peligro', condicion: f => f.estado !== 'Cancelada' && f.estado !== 'Completada', onClick: f => cambiarEstado(f, 'Cancelada') }
  ] : [];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{color: tema.texto}}>{esAdmin ? MEITI.t('manage_reservations', null, 'Gestión de Reservas') : MEITI.t('my_reservations', null, 'Mis Reservas')}</h2>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

      <UI.Tarjeta className="p-6 rounded-3xl">
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : reservas.length === 0 ? <UI.EstadoVacio icono="fa-calendar-xmark" mensaje={MEITI.t('no_reservations', null, 'No hay reservas registradas.')} /> : (
          <UI.TablaDatos 
            columnas={columnas} 
            datos={reservas} 
            claveId="id" 
            onBorrar={esAdmin ? f => borrar(f.id) : undefined}
            accionesExtra={accionesExtra}
            advertirAccionIncompleta={false}
          />
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default EstanciasDelSur_muujoww4__ES_GestorReservas;
