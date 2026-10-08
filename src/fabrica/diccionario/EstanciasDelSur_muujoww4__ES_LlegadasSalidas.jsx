import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const EstanciasDelSur_muujoww4__ES_LlegadasSalidas = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [reservas, setReservas] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const [resRes, resDeptos] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`)
    ]);
    if (resRes.ok) setReservas(resRes.registros.filter(r => r.estado !== 'Cancelada'));
    if (resDeptos.ok) setDeptos(resDeptos.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (!MEITI.soyDuenoDeLaApp() && MEITI.miRolEnLaApp() !== 'admin') return null;

  const hoy = new Date().toISOString().split('T')[0];
  const llegadas = reservas.filter(r => r.fecha_inicio === hoy);
  const salidas = reservas.filter(r => r.fecha_fin === hoy);

  const renderFila = (r, tipo) => {
    const depto = deptos.find(d => d.id === r.departamento_id);
    return (
      <div key={r.id} className="flex justify-between items-center p-4 rounded-2xl border" style={{borderColor: tema.texto + '1A', backgroundColor: tema.fondo}}>
        <div>
          <p className="font-bold" style={{color: tema.texto}}>{r.nombre_huesped}</p>
          <p className="text-sm opacity-70" style={{color: tema.texto}}>{depto?.nombre || MEITI.t('unknown_depto', null, 'Alojamiento')} • {r.huespedes} {MEITI.t('guests_label', null, 'huéspedes')}</p>
        </div>
        <UI.Chip tono={tipo === 'llegada' ? 'exito' : 'alerta'}>{tipo === 'llegada' ? MEITI.t('check_in', null, 'Check-in') : MEITI.t('check_out', null, 'Check-out')}</UI.Chip>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
        <h3 className="font-serif text-xl" style={{color: tema.texto}}>{MEITI.t('arrivals_today_title', null, 'Llegadas de Hoy')}</h3>
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : llegadas.length === 0 ? <UI.EstadoVacio icono="fa-door-open" mensaje={MEITI.t('no_arrivals', null, 'No hay llegadas programadas para hoy.')} /> : (
          <div className="flex flex-col gap-3">{llegadas.map(r => renderFila(r, 'llegada'))}</div>
        )}
      </UI.Tarjeta>
      <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
        <h3 className="font-serif text-xl" style={{color: tema.texto}}>{MEITI.t('departures_today_title', null, 'Salidas de Hoy')}</h3>
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : salidas.length === 0 ? <UI.EstadoVacio icono="fa-door-closed" mensaje={MEITI.t('no_departures', null, 'No hay salidas programadas para hoy.')} /> : (
          <div className="flex flex-col gap-3">{salidas.map(r => renderFila(r, 'salida'))}</div>
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default EstanciasDelSur_muujoww4__ES_LlegadasSalidas;
