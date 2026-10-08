/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const tLimpieza = MEITI.obtenerTabla('es_limpieza');
  const tDeptos = MEITI.obtenerTabla('es_departamentos');

  const [tareas, setTareas] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const vacio = { id: '', departamento_id: '', asignado_a: '', estado: 'pendiente', fecha_programada: '', notas: '' };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const [resLimpieza, resDeptos] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${tLimpieza}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${tDeptos}?ecosistema=${eco}`)
    ]);
    if (resLimpieza.ok) setTareas(resLimpieza.registros || []);
    if (resDeptos.ok) setDepartamentos(resDeptos.registros || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!form.departamento_id) {
      return setError(MEITI.t('err_depto_req', null, 'Selecciona un departamento para la tarea.'));
    }

    setGuardando(true);
    const esNuevo = !form.id;
    const payload = {
      id: esNuevo ? 'limp_' + Date.now() : form.id,
      departamento_id: form.departamento_id,
      asignado_a: form.asignado_a,
      estado: form.estado,
      fecha_programada: form.fecha_programada,
      notas: form.notas
    };

    await MEITI.mutar(`/api/boveda/${tLimpieza}?ecosistema=${eco}`, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(esNuevo ? MEITI.t('msg_task_created', null, 'Tarea programada con éxito.') : MEITI.t('msg_task_updated', null, 'Tarea actualizada.'));
        setForm(vacio);
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_saving_task', null, 'No se pudo guardar la tarea.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_task', null, '¿Borrar esta tarea de limpieza?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null);
    setExito(null);

    await MEITI.mutar(`/api/boveda/${tLimpieza}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_task_deleted', null, 'Tarea eliminada.'));
        if (form.id === id) setForm(vacio);
        cargar();
      },
      alFallar: (err) => setError(err || MEITI.t('err_deleting_task', null, 'No se pudo eliminar la tarea.'))
    });
  };

  const editar = (fila) => {
    setForm({
      id: fila.id,
      departamento_id: fila.departamento_id || '',
      asignado_a: fila.asignado_a || '',
      estado: fila.estado || 'pendiente',
      fecha_programada: fila.fecha_programada || '',
      notas: fila.notas || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const marcarListo = async (fila) => {
    await MEITI.mutar(`/api/boveda/${tLimpieza}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fila, estado: 'listo' })
    }, {
      alLograr: () => cargar(),
      alFallar: (err) => setError(err || MEITI.t('err_updating_status', null, 'Error al actualizar el estado.'))
    });
  };

  const columnas = [
    { clave: 'departamento_id', etiqueta: MEITI.t('col_depto', null, 'Departamento'), render: (f) => departamentos.find(d => d.id === f.departamento_id)?.nombre || '---' },
    { clave: 'fecha_programada', etiqueta: MEITI.t('col_date', null, 'Fecha Programada'), tipo: 'fecha' },
    { clave: 'asignado_a', etiqueta: MEITI.t('col_assigned', null, 'Asignado a') },
    { clave: 'estado', etiqueta: MEITI.t('col_status', null, 'Estado'), render: (f) => <UI.Chip tono={f.estado === 'listo' ? 'exito' : 'alerta'}>{f.estado === 'listo' ? MEITI.t('st_ready', null, 'Listo') : MEITI.t('st_pending', null, 'Pendiente')}</UI.Chip> }
  ];

  const accionesExtra = [
    {
      etiqueta: MEITI.t('act_mark_ready', null, 'Marcar Listo'),
      icono: 'fa-check',
      tono: 'exito',
      condicion: (f) => f.estado !== 'listo',
      onClick: marcarListo
    }
  ];

  const pendientes = tareas.filter(t => t.estado !== 'listo').length;
  const listas = tareas.filter(t => t.estado === 'listo').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.colorPrimario + '22', color: tema.colorPrimario }}>
              <Iconos.Sparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('kpi_total', null, 'Total Tareas')}</p>
              <p className="text-2xl font-black" style={{ color: tema.texto }}>{tareas.length}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }}>
              <Iconos.Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('kpi_pending', null, 'Pendientes')}</p>
              <p className="text-2xl font-black" style={{ color: tema.texto }}>{pendientes}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b98122', color: '#10b981' }}>
              <Iconos.CircleCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('kpi_ready', null, 'Completadas')}</p>
              <p className="text-2xl font-black" style={{ color: tema.texto }}>{listas}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
      </div>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <UI.Tarjeta>
          <div className="flex items-center gap-2 mb-4">
            <Iconos.Sparkles size={20} color={tema.colorPrimario} />
            <UI.Etiqueta>{form.id ? MEITI.t('title_edit_task', null, 'Editar Tarea de Limpieza') : MEITI.t('title_new_task', null, 'Programar Limpieza')}</UI.Etiqueta>
          </div>
          
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_depto', null, 'Departamento')} 
                  tipo="select" 
                  valor={form.departamento_id} 
                  onChange={e => setForm({...form, departamento_id: e.target.value})} 
                  opciones={[{value: '', label: MEITI.t('ph_select_depto', null, 'Seleccionar...')}, ...departamentos.map(d => ({ value: d.id, label: d.nombre }))]}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_date', null, 'Fecha Programada')} 
                  tipo="date" 
                  valor={form.fecha_programada} 
                  onChange={e => setForm({...form, fecha_programada: e.target.value})} 
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_assigned', null, 'Asignado a (Nombre)')} 
                  tipo="text" 
                  valor={form.asignado_a} 
                  onChange={e => setForm({...form, asignado_a: e.target.value})} 
                  placeholder={MEITI.t('ph_assigned', null, 'Ej: María Gómez')}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_status', null, 'Estado')} 
                  tipo="select" 
                  valor={form.estado} 
                  onChange={e => setForm({...form, estado: e.target.value})} 
                  opciones={[{value: 'pendiente', label: MEITI.t('st_pending', null, 'Pendiente')}, {value: 'listo', label: MEITI.t('st_ready', null, 'Listo')}]}
                />
              </div>
              <div className="md:col-span-2 flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_notes', null, 'Notas o Instrucciones Especiales')} 
                  tipo="textarea" 
                  valor={form.notas} 
                  onChange={e => setForm({...form, notas: e.target.value})} 
                  placeholder={MEITI.t('ph_notes', null, 'Ej: Reponer toallas extra, revisar aire acondicionado...')}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2">
                  <Iconos.Save size={16} /> 
                  {guardando ? MEITI.t('btn_saving', null, 'Guardando...') : (form.id ? MEITI.t('btn_update', null, 'Actualizar Tarea') : MEITI.t('btn_create', null, 'Programar Tarea'))}
                </span>
              </UI.Boton>
              {form.id && (
                <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>
                  <span className="flex items-center gap-2">
                    <Iconos.X size={16} /> 
                    {MEITI.t('btn_cancel', null, 'Cancelar')}
                  </span>
                </UI.Boton>
              )}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <UI.Etiqueta>{MEITI.t('title_task_list', null, 'Planilla de Limpieza')}</UI.Etiqueta>
          {cargando ? (
            <p style={{color: tema.texto}}>{MEITI.t('loading_tasks', null, 'Cargando tareas...')}</p>
          ) : tareas.length === 0 ? (
            <UI.EstadoVacio icono="fa-broom" mensaje={MEITI.t('empty_tasks', null, 'No hay tareas de limpieza programadas.')} />
          ) : (
            <UI.TablaDatos 
              columnas={columnas} 
              datos={tareas} 
              claveId="id" 
              onEditar={editar} 
              onBorrar={(fila) => borrar(fila.id)} 
              accionesExtra={accionesExtra}
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
}