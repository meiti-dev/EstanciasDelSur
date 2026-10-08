/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [deptos, setDeptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCapacidad, setFiltroCapacidad] = useState('');

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`);
    if (res.ok) setDeptos(res.registros.filter(d => d.estado === 'Activo'));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const verDetalle = async (id) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_seleccion_temporal')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id: 'sel_' + miId, usuario_id: miId, departamento_id: id })
    }, {
      alLograr: () => MEITI.irAPagina('detalle_reserva'),
      alFallar: () => {}
    });
  };

  const filtrados = deptos.filter(d => !filtroCapacidad || d.capacidad >= Number(filtroCapacidad));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <h2 className="font-serif text-3xl tracking-tight" style={{color: tema.texto}}>{MEITI.t('our_accommodations', null, 'Nuestros Alojamientos')}</h2>
        <div className="w-full md:w-64">
          <UI.Campo etiqueta={MEITI.t('min_capacity', null, 'Capacidad mínima')} tipo="number" valor={filtroCapacidad} onChange={e => setFiltroCapacidad(e.target.value)} placeholder={MEITI.t('ex_capacity', null, 'Ej: 2')} />
        </div>
      </div>

      {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading_accommodations', null, 'Cargando alojamientos...')}</p> : filtrados.length === 0 ? <UI.EstadoVacio icono="fa-bed" mensaje={MEITI.t('no_accommodations', null, 'No se encontraron alojamientos con esos filtros.')} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtrados.map(d => (
            <Animacion.motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <UI.Tarjeta className="p-0 rounded-3xl overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-shadow h-full" onClick={() => verDetalle(d.id)}>
                <div className="w-full aspect-[4/3] bg-black/5 relative">
                  {d.fotos_url ? <img src={d.fotos_url} alt={d.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Iconos.Image size={48} color={tema.colorPrimario} opacity={0.5} /></div>}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-sm" style={{color: tema.texto}}>
                    ${d.precio_noche} / {MEITI.t('night', null, 'noche')}
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-2 flex-1">
                  <h3 className="font-serif text-xl" style={{color: tema.texto}}>{d.nombre}</h3>
                  <div className="flex items-center gap-4 opacity-70 text-sm" style={{color: tema.texto}}>
                    <span className="flex items-center gap-1"><Iconos.Users size={16} /> {d.capacidad} {MEITI.t('pers', null, 'pers.')}</span>
                    <span className="flex items-center gap-1"><Iconos.Sparkles size={16} /> {MEITI.t('cleaning_fee', null, 'Limpieza')} ${d.tarifa_limpieza}</span>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2 opacity-80 flex-1" style={{color: tema.texto}}>{d.descripcion}</p>
                  <div className="mt-4">
                    <UI.Boton variante="primario" onClick={(e) => { e.stopPropagation(); verDetalle(d.id); }}>{MEITI.t('check_availability', null, 'Ver Disponibilidad')}</UI.Boton>
                  </div>
                </div>
              </UI.Tarjeta>
            </Animacion.motion.div>
          ))}
        </div>
      )}
    </div>
  );
}