/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [depto, setDepto] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const resSel = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('es_seleccion_temporal')}?ecosistema=${eco}`);
    if (resSel.ok && resSel.registros.length > 0) {
      const deptoId = resSel.registros[0].departamento_id;
      const resDep = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`);
      if (resDep.ok) {
        setDepto(resDep.registros.find(d => d.id === deptoId));
      }
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) return <p style={{color: tema.texto}}>{MEITI.t('loading_details', null, 'Cargando detalle...')}</p>;
  if (!depto) return <UI.EstadoVacio icono="fa-bed" mensaje={MEITI.t('no_depto_selected', null, 'No se seleccionó ningún departamento. Vuelve a la lista de alojamientos.')} />;

  const servicios = depto.servicios ? depto.servicios.split(',').map(s => s.trim()) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <button onClick={() => MEITI.irAPagina('alojamientos')} className="p-3 rounded-full bg-black/5 hover:bg-black/10 transition-colors">
          <Iconos.ArrowLeft size={24} color={tema.texto} />
        </button>
        <h2 className="font-serif text-3xl tracking-tight" style={{color: tema.texto}}>{depto.nombre}</h2>
      </div>

      <Animacion.motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden bg-black/5">
          {depto.fotos_url ? <img src={depto.fotos_url} alt={depto.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Iconos.Image size={64} color={tema.colorPrimario} opacity={0.5} /></div>}
        </div>
      </Animacion.motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-8">
          <div className="flex gap-8 pb-8 border-b" style={{borderColor: tema.texto + '1A'}}>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold uppercase opacity-70" style={{color: tema.texto}}>{MEITI.t('capacity', null, 'Capacidad')}</span>
              <span className="text-xl font-serif" style={{color: tema.texto}}>{depto.capacidad} {MEITI.t('guests_label', null, 'huéspedes')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold uppercase opacity-70" style={{color: tema.texto}}>{MEITI.t('price', null, 'Precio')}</span>
              <span className="text-xl font-serif" style={{color: tema.texto}}>${depto.precio_noche} / {MEITI.t('night', null, 'noche')}</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-serif text-2xl mb-4" style={{color: tema.texto}}>{MEITI.t('about_space', null, 'Acerca de este espacio')}</h3>
            <p className="leading-relaxed opacity-90" style={{color: tema.texto}}>{depto.descripcion}</p>
          </div>

          <div>
            <h3 className="font-serif text-2xl mb-4" style={{color: tema.texto}}>{MEITI.t('included_amenities', null, 'Servicios incluidos')}</h3>
            <div className="flex flex-wrap gap-3">
              {servicios.map((s, i) => (
                <div key={i} className="px-4 py-2 rounded-xl border flex items-center gap-2" style={{borderColor: tema.texto + '1A', backgroundColor: tema.fondo}}>
                  <Iconos.Check size={16} color={tema.colorSecundario} />
                  <span style={{color: tema.texto}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1" id="contenedor-reserva">
        </div>
      </div>
    </div>
  );
}