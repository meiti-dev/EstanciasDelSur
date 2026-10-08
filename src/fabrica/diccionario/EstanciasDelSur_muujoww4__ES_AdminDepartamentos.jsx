import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const EstanciasDelSur_muujoww4__ES_AdminDepartamentos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [deptos, setDeptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ id: '', nombre: '', descripcion: '', capacidad: '', precio_noche: '', tarifa_limpieza: '', fotos_url: '', servicios: '', estado: 'Activo' });
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`);
    if (res.ok) setDeptos(res.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (!MEITI.soyDuenoDeLaApp() && MEITI.miRolEnLaApp() !== 'admin') return null;

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.nombre.trim()) return setError(MEITI.t('name_required', null, 'El nombre es obligatorio.'));

    const payload = {
      id: form.id || 'depto_' + Date.now(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      capacidad: Number(form.capacidad) || 1,
      precio_noche: Number(form.precio_noche) || 0,
      tarifa_limpieza: Number(form.tarifa_limpieza) || 0,
      fotos_url: form.fotos_url.trim(),
      servicios: form.servicios.trim(),
      estado: form.estado
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('depto_saved', null, 'Departamento guardado.'));
        setForm({ id: '', nombre: '', descripcion: '', capacidad: '', precio_noche: '', tarifa_limpieza: '', fotos_url: '', servicios: '', estado: 'Activo' });
        cargar();
      },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_depto_q', null, '¿Borrar este departamento?'))) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { setExito(MEITI.t('deleted', null, 'Borrado.')); cargar(); },
      alFallar: setError
    });
  };

  const editar = (f) => {
    setForm({ id: f.id, nombre: f.nombre, descripcion: f.descripcion, capacidad: f.capacidad, precio_noche: f.precio_noche, tarifa_limpieza: f.tarifa_limpieza, fotos_url: f.fotos_url || '', servicios: f.servicios || '', estado: f.estado || 'Activo' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const subirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = await MEITI.subirArchivo(file);
    if (r.ok) setForm({ ...form, fotos_url: r.url });
    else setError(r.motivo);
  };

  const columnas = [
    { clave: 'nombre', etiqueta: MEITI.t('name', null, 'Nombre') },
    { clave: 'capacidad', etiqueta: MEITI.t('capacity', null, 'Capacidad'), tipo: 'numero' },
    { clave: 'precio_noche', etiqueta: MEITI.t('price_night', null, 'Precio/Noche'), tipo: 'moneda' },
    { clave: 'estado', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={f.estado === 'Activo' ? 'exito' : 'neutro'}>{f.estado}</UI.Chip> }
  ];

  return (
    <div className="flex flex-col gap-8 mt-12 pt-12 border-t" style={{borderColor: tema.texto + '1A'}}>
      <h2 className="font-serif text-3xl tracking-tight" style={{color: tema.texto}}>{MEITI.t('manage_accommodations', null, 'Gestión de Alojamientos')}</h2>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <UI.Tarjeta className="p-6 rounded-3xl">
        <h3 className="font-bold mb-4" style={{color: tema.texto}}>{form.id ? MEITI.t('edit_depto', null, 'Editar Departamento') : MEITI.t('new_depto', null, 'Nuevo Departamento')}</h3>
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('name', null, 'Nombre')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('capacity', null, 'Capacidad')} tipo="number" valor={form.capacidad} onChange={e => setForm({...form, capacidad: e.target.value})} /></div>
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('price_night', null, 'Precio por Noche')} tipo="number" valor={form.precio_noche} onChange={e => setForm({...form, precio_noche: e.target.value})} /></div>
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('cleaning_fee_input', null, 'Tarifa de Limpieza')} tipo="number" valor={form.tarifa_limpieza} onChange={e => setForm({...form, tarifa_limpieza: e.target.value})} /></div>
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('status', null, 'Estado')} tipo="select" valor={form.estado} onChange={e => setForm({...form, estado: e.target.value})} opciones={[{value:'Activo',label:MEITI.t('active', null, 'Activo')},{value:'Inactivo',label:MEITI.t('inactive', null, 'Inactivo')}]} /></div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1" style={{color: tema.texto}}>{MEITI.t('main_photo', null, 'Foto Principal')}</label>
              <div className="flex gap-2 items-center">
                <input type="file" accept="image/*" onChange={subirFoto} className="text-sm" style={{color: tema.texto}} />
                {form.fotos_url && <img src={form.fotos_url} className="w-10 h-10 object-cover rounded" />}
              </div>
            </div>
            <div className="md:col-span-2 flex-1"><UI.Campo etiqueta={MEITI.t('amenities_csv', null, 'Servicios (separados por coma)')} tipo="text" valor={form.servicios} onChange={e => setForm({...form, servicios: e.target.value})} placeholder={MEITI.t('amenities_ph', null, 'WiFi, Piscina, Parrilla...')} /></div>
            <div className="md:col-span-2 flex-1"><UI.Campo etiqueta={MEITI.t('description', null, 'Descripción')} tipo="textarea" valor={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></div>
          </div>
          <div className="flex gap-3 mt-2">
            <UI.Boton tipo="submit" variante="primario">{form.id ? MEITI.t('update', null, 'Actualizar') : MEITI.t('create', null, 'Crear')}</UI.Boton>
            {form.id && <UI.Boton tipo="button" variante="secundario" onClick={() => setForm({ id: '', nombre: '', descripcion: '', capacidad: '', precio_noche: '', tarifa_limpieza: '', fotos_url: '', servicios: '', estado: 'Activo' })}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>}
          </div>
        </form>
      </UI.Tarjeta>

      <UI.Tarjeta className="p-6 rounded-3xl">
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : deptos.length === 0 ? <UI.EstadoVacio icono="fa-building" mensaje={MEITI.t('no_deptos_registered', null, 'No hay departamentos registrados.')} /> : (
          <UI.TablaDatos columnas={columnas} datos={deptos} claveId="id" onEditar={editar} onBorrar={f => borrar(f.id)} />
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default EstanciasDelSur_muujoww4__ES_AdminDepartamentos;
