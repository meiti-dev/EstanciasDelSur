/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [metricas, setMetricas] = useState({ ocupacion: 0, ingresos: 0, llegadas: 0, salidas: 0 });
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const [resRes, resPagos, resDeptos] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_pagos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`)
    ]);

    if (resRes.ok && resPagos.ok && resDeptos.ok) {
      const hoy = new Date().toISOString().split('T')[0];
      const reservas = resRes.registros.filter(r => r.estado !== 'Cancelada');
      const pagos = resPagos.registros.filter(p => p.estado === 'Completado');
      const deptos = resDeptos.registros.filter(d => d.estado === 'Activo');

      const ingresos = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
      const llegadas = reservas.filter(r => r.fecha_inicio === hoy).length;
      const salidas = reservas.filter(r => r.fecha_fin === hoy).length;
      
      const ocupadosHoy = reservas.filter(r => r.fecha_inicio <= hoy && r.fecha_fin > hoy).length;
      const ocupacion = deptos.length > 0 ? Math.round((ocupadosHoy / deptos.length) * 100) : 0;

      setMetricas({ ocupacion, ingresos, llegadas, salidas });
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (!MEITI.soyDuenoDeLaApp() && MEITI.miRolEnLaApp() !== 'admin') return null;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{color: tema.texto}}>{MEITI.t('activity_summary', null, 'Resumen de Actividad')}</h2>
      {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading_metrics', null, 'Calculando métricas...')}</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
              <div className="flex items-center gap-3 opacity-70">
                <Iconos.Home size={20} color={tema.colorPrimario} />
                <span className="font-bold text-sm uppercase tracking-wider" style={{color: tema.texto}}>{MEITI.t('occupancy_today', null, 'Ocupación Hoy')}</span>
              </div>
              <span className="text-4xl font-bold" style={{color: tema.texto}}>{metricas.ocupacion}%</span>
            </UI.Tarjeta>
          </Animacion.motion.div>
          <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
              <div className="flex items-center gap-3 opacity-70">
                <Iconos.DollarSign size={20} color={tema.colorSecundario} />
                <span className="font-bold text-sm uppercase tracking-wider" style={{color: tema.texto}}>{MEITI.t('total_income', null, 'Ingresos Totales')}</span>
              </div>
              <span className="text-4xl font-bold" style={{color: tema.texto}}>${metricas.ingresos.toLocaleString()}</span>
            </UI.Tarjeta>
          </Animacion.motion.div>
          <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
              <div className="flex items-center gap-3 opacity-70">
                <Iconos.ArrowRight size={20} color={tema.colorPrimario} />
                <span className="font-bold text-sm uppercase tracking-wider" style={{color: tema.texto}}>{MEITI.t('arrivals_today', null, 'Llegadas Hoy')}</span>
              </div>
              <span className="text-4xl font-bold" style={{color: tema.texto}}>{metricas.llegadas}</span>
            </UI.Tarjeta>
          </Animacion.motion.div>
          <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
              <div className="flex items-center gap-3 opacity-70">
                <Iconos.ArrowLeft size={20} color={tema.colorSecundario} />
                <span className="font-bold text-sm uppercase tracking-wider" style={{color: tema.texto}}>{MEITI.t('departures_today', null, 'Salidas Hoy')}</span>
              </div>
              <span className="text-4xl font-bold" style={{color: tema.texto}}>{metricas.salidas}</span>
            </UI.Tarjeta>
          </Animacion.motion.div>
        </div>
      )}
    </div>
  );
}