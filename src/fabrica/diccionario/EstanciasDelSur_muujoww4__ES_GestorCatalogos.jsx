import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const EstanciasDelSur_muujoww4__ES_GestorCatalogos = ({ datos, tema, UI, MEITI }) => {
  const esAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();
  if (!esAdmin) return <UI.Aviso tono="peligro" mensaje={MEITI.t('admin_only', null, 'Acceso restringido: esta sección es solo para administradores.')} />;

  const eco = MEITI.obtenerEcosistemaActual();
  const tabla = MEITI.obtenerTabla('es_catalogos');

  const [datosCat, setDatosCat] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const tiposCatalogo = [
    { id: 'estado_reserva', etiqueta: MEITI.t('cat_reserva', null, 'Estados de Reserva'), icono: <Iconos.CalendarClock size={18} /> },
    { id: 'metodo_pago', etiqueta: MEITI.t('cat_pago', null, 'Métodos de Pago'), icono: <Iconos.CreditCard size={18} /> },
    { id: 'servicio_depto', etiqueta: MEITI.t('cat_servicio', null, 'Servicios de Depto'), icono: <Iconos.Wifi size={18} /> }
  ];

  const [tipoActivo, setTipoActivo] = useState(tiposCatalogo[0].id);
  const vacio = { id: '', valor: '', orden: 0 };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${tabla}?ecosistema=${eco}`);
    if (res.ok) {
      setDatosCat(res.registros || []);
    } else {
      setError(res.error || MEITI.t('err_load_cat', null, 'Error al cargar los catálogos.'));
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!form.valor.trim()) {
      return setError(MEITI.t('err_val_req', null, 'El valor de la opción es obligatorio.'));
    }

    setGuardando(true);
    const esNuevo = !form.id;
    const payload = {
      id: esNuevo ? 'cat_' + Date.now() : form.id,
      tipo: tipoActivo,
      valor: form.valor.trim(),
      orden: Number(form.orden) || 0
    };

    await MEITI.mutar(`/api/boveda/${tabla}?ecosistema=${eco}`, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(esNuevo ? MEITI.t('msg_cat_created', null, 'Opción agregada con éxito.') : MEITI.t('msg_cat_updated', null, 'Opción actualizada.'));
        setForm(vacio);
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_cat', null, 'No se pudo guardar la opción.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_cat', null, '¿Borrar esta opción del catálogo?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null);
    setExito(null);

    await MEITI.mutar(`/api/boveda/${tabla}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_cat_deleted', null, 'Opción eliminada.'));
        if (form.id === id) setForm(vacio);
        cargar();
      },
      alFallar: (err) => setError(err || MEITI.t('err_delete_cat', null, 'No se pudo eliminar la opción.'))
    });
  };

  const editar = (fila) => {
    setForm({
      id: fila.id,
      valor: fila.valor || '',
      orden: fila.orden || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cambiarPestana = (id) => {
    setTipoActivo(id);
    setForm(vacio);
    setError(null);
    setExito(null);
  };

  const filtrados = datosCat.filter(d => d.tipo === tipoActivo).sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const columnas = [
    { clave: 'orden', etiqueta: MEITI.t('col_order', null, 'Orden'), tipo: 'numero' },
    { clave: 'valor', etiqueta: MEITI.t('col_value', null, 'Valor / Opción') }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {tiposCatalogo.map(t => (
            <button
              key={t.id}
              onClick={() => cambiarPestana(t.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap"
              style={{
                background: tipoActivo === t.id ? tema.colorPrimario : tema.superficie,
                color: tipoActivo === t.id ? '#fff' : tema.texto,
                border: `1px solid ${tipoActivo === t.id ? tema.colorPrimario : tema.texto + '22'}`
              }}
            >
              {t.icono}
              {t.etiqueta}
            </button>
          ))}
        </div>
      </Animacion.motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Animacion.motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <UI.Tarjeta>
              <div className="flex items-center gap-2 mb-4">
                <Iconos.Settings2 size={20} color={tema.colorPrimario} />
                <UI.Etiqueta>{form.id ? MEITI.t('title_edit_opt', null, 'Editar Opción') : MEITI.t('title_new_opt', null, 'Nueva Opción')}</UI.Etiqueta>
              </div>
              
              <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
              <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

              <form onSubmit={guardar} className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <UI.Campo 
                      etiqueta={MEITI.t('f_value', null, 'Valor de la opción')} 
                      tipo="text" 
                      valor={form.valor} 
                      onChange={e => setForm({...form, valor: e.target.value})} 
                      placeholder={MEITI.t('ph_value', null, 'Ej: Confirmada, Tarjeta, WiFi...')}
                    />
                  </div>
                  <div className="flex-1">
                    <UI.Campo 
                      etiqueta={MEITI.t('f_order', null, 'Orden (para listados)')} 
                      tipo="number" 
                      valor={form.orden} 
                      onChange={e => setForm({...form, orden: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                    <span className="flex items-center justify-center gap-2">
                      <Iconos.Save size={16} /> 
                      {guardando ? MEITI.t('btn_saving', null, 'Guardando...') : (form.id ? MEITI.t('btn_update', null, 'Actualizar Opción') : MEITI.t('btn_create', null, 'Agregar Opción'))}
                    </span>
                  </UI.Boton>
                  {form.id && (
                    <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>
                      <span className="flex items-center justify-center gap-2">
                        <Iconos.X size={16} /> 
                        {MEITI.t('btn_cancel', null, 'Cancelar')}
                      </span>
                    </UI.Boton>
                  )}
                </div>
              </form>
            </UI.Tarjeta>
          </Animacion.motion.div>
        </div>

        <div className="lg:col-span-2 flex flex-col">
          <Animacion.motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex-1 flex flex-col min-h-0">
            <UI.Tarjeta className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Iconos.List size={20} color={tema.colorSecundario} />
                <UI.Etiqueta>{MEITI.t('title_cat_list', null, 'Opciones Registradas')}</UI.Etiqueta>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto">
                {cargando ? (
                  <div className="p-8 text-center">
                    <Iconos.LoaderCircle size={32} className="animate-spin mx-auto mb-2" color={tema.colorPrimario} />
                    <p style={{color: tema.texto}}>{MEITI.t('loading_cat', null, 'Cargando opciones...')}</p>
                  </div>
                ) : filtrados.length === 0 ? (
                  <UI.EstadoVacio icono="fa-tags" mensaje={MEITI.t('empty_cat', null, 'No hay opciones registradas en este catálogo.')} />
                ) : (
                  <UI.TablaDatos 
                    columnas={columnas} 
                    datos={filtrados} 
                    claveId="id" 
                    onEditar={editar} 
                    onBorrar={(fila) => borrar(fila.id)} 
                  />
                )}
              </div>
            </UI.Tarjeta>
          </Animacion.motion.div>
        </div>
      </div>
    </div>
  );
};

export default EstanciasDelSur_muujoww4__ES_GestorCatalogos;
