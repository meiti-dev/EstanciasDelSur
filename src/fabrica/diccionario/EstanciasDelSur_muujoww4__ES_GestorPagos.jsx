import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const EstanciasDelSur_muujoww4__ES_GestorPagos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const esAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [pagos, setPagos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [catalogos, setCatalogos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState({ id: '', reserva_id: '', monto: '', metodo_pago: '', estado: '' });

  const cargar = async () => {
    setCargando(true);
    const [resPagos, resRes, resDep, resCat] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_pagos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_catalogos')}?ecosistema=${eco}`)
    ]);

    if (resPagos.ok) setPagos(resPagos.registros.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)));
    if (resRes.ok) setReservas(resRes.registros);
    if (resDep.ok) setDeptos(resDep.registros);
    if (resCat.ok) setCatalogos(resCat.registros.sort((a, b) => Number(a.orden) - Number(b.orden)));

    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (!esAdmin) return <UI.EstadoVacio icono="fa-lock" mensaje={MEITI.t('admin_only', null, 'Acceso restringido a administración.')} />;

  const metodosPago = catalogos.filter(c => c.tipo === 'metodo_pago').map(c => ({ value: c.valor, label: c.valor }));
  const estadosPago = catalogos.filter(c => c.tipo === 'estado_pago').map(c => ({ value: c.valor, label: c.valor }));

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    
    if (!form.reserva_id || !form.monto || !form.metodo_pago || !form.estado) {
      return setError(MEITI.t('all_fields_req', null, 'Todos los campos son obligatorios.'));
    }

    const existente = pagos.find(p => p.id === form.id);
    const payload = {
      id: form.id || 'pago_' + Date.now(),
      reserva_id: form.reserva_id,
      registrado_por: MEITI.obtenerUsuarioActual(),
      monto: Number(form.monto),
      metodo_pago: form.metodo_pago,
      estado: form.estado,
      fecha_pago: existente ? existente.fecha_pago : new Date().toISOString()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_pagos')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('payment_saved', null, 'Pago registrado correctamente.'));
        setForm({ id: '', reserva_id: '', monto: '', metodo_pago: '', estado: '' });
        cargar();
      },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_payment_q', null, '¿Eliminar este pago?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('delete_yes', null, 'Sí, borrar'), tono: 'peligro' })) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_pagos')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const editar = (f) => {
    setForm({ id: f.id, reserva_id: f.reserva_id, monto: f.monto, metodo_pago: f.metodo_pago, estado: f.estado });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columnas = [
    { clave: 'reserva_id', etiqueta: MEITI.t('reservation', null, 'Reserva'), render: f => {
      const r = reservas.find(x => x.id === f.reserva_id);
      const d = deptos.find(x => x.id === r?.departamento_id);
      return r ? `${r.nombre_huesped} (${d?.nombre || MEITI.t('unknown_depto', null, 'Desconocido')})` : '---';
    }},
    { clave: 'monto', etiqueta: MEITI.t('amount', null, 'Monto'), tipo: 'moneda' },
    { clave: 'metodo_pago', etiqueta: MEITI.t('method', null, 'Método') },
    { clave: 'fecha_pago', etiqueta: MEITI.t('date', null, 'Fecha'), tipo: 'fecha' },
    { clave: 'estado', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={f.estado === 'Completado' ? 'exito' : 'alerta'}>{f.estado}</UI.Chip> }
  ];

  const saldos = reservas.filter(r => r.estado !== 'Cancelada').map(r => {
    const pagosReserva = pagos.filter(p => p.reserva_id === r.id && p.estado === 'Completado');
    const totalPagado = pagosReserva.reduce((acc, p) => acc + Number(p.monto), 0);
    const pendiente = Number(r.monto_total) - totalPagado;
    return { ...r, totalPagado, pendiente };
  }).filter(r => r.pendiente > 0);

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('payment_control', null, 'Control de Pagos')}</h2>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col gap-8">
          <UI.Tarjeta className="p-6 rounded-3xl">
            <h3 className="font-bold mb-4" style={{ color: tema.texto }}>{form.id ? MEITI.t('edit_payment', null, 'Editar Pago') : MEITI.t('register_payment', null, 'Registrar Pago Manual')}</h3>
            <form onSubmit={guardar} className="flex flex-col gap-4">
              <UI.Campo 
                etiqueta={MEITI.t('reservation', null, 'Reserva')} 
                tipo="select" 
                valor={form.reserva_id} 
                onChange={e => setForm({ ...form, reserva_id: e.target.value })} 
                opciones={[{ value: '', label: MEITI.t('select_ph', null, 'Seleccionar...') }, ...reservas.filter(r => r.estado !== 'Cancelada').map(r => ({ value: r.id, label: `${r.nombre_huesped} - $${r.monto_total}` }))]} 
              />
              <UI.Campo 
                etiqueta={MEITI.t('amount', null, 'Monto')} 
                tipo="number" 
                valor={form.monto} 
                onChange={e => setForm({ ...form, monto: e.target.value })} 
              />
              <UI.Campo 
                etiqueta={MEITI.t('method', null, 'Método')} 
                tipo="select" 
                valor={form.metodo_pago} 
                onChange={e => setForm({ ...form, metodo_pago: e.target.value })} 
                opciones={[{ value: '', label: MEITI.t('select_ph', null, 'Seleccionar...') }, ...metodosPago]} 
              />
              <UI.Campo 
                etiqueta={MEITI.t('status', null, 'Estado')} 
                tipo="select" 
                valor={form.estado} 
                onChange={e => setForm({ ...form, estado: e.target.value })} 
                opciones={[{ value: '', label: MEITI.t('select_ph', null, 'Seleccionar...') }, ...estadosPago]} 
              />
              <div className="flex gap-2 mt-2">
                <UI.Boton tipo="submit" variante="primario">{form.id ? MEITI.t('update', null, 'Actualizar') : MEITI.t('register', null, 'Registrar')}</UI.Boton>
                {form.id && <UI.Boton tipo="button" variante="secundario" onClick={() => setForm({ id: '', reserva_id: '', monto: '', metodo_pago: '', estado: '' })}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>}
              </div>
            </form>
          </UI.Tarjeta>

          <UI.Tarjeta className="p-6 rounded-3xl">
            <h3 className="font-bold mb-4" style={{ color: tema.texto }}>{MEITI.t('pending_balances', null, 'Saldos Pendientes')}</h3>
            {saldos.length === 0 ? (
              <p className="text-sm opacity-70" style={{ color: tema.texto }}>{MEITI.t('no_pending_balances', null, 'No hay saldos pendientes.')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {saldos.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: tema.texto + '1A', backgroundColor: tema.fondo }}>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm" style={{ color: tema.texto }}>{s.nombre_huesped}</span>
                      <span className="text-xs opacity-70" style={{ color: tema.texto }}>{MEITI.t('total', null, 'Total')}: ${s.monto_total}</span>
                    </div>
                    <span className="font-bold" style={{ color: tema.colorPrimario }}>${s.pendiente}</span>
                  </div>
                ))}
              </div>
            )}
          </UI.Tarjeta>
        </div>

        <div className="md:col-span-2 flex flex-col">
          <UI.Tarjeta className="p-6 rounded-3xl flex-1 flex flex-col min-h-0">
            <h3 className="font-bold mb-4" style={{ color: tema.texto }}>{MEITI.t('payment_history', null, 'Historial de Pagos')}</h3>
            <div className="flex-1 min-h-0 flex flex-col">
              {cargando ? (
                <p style={{ color: tema.texto }}>{MEITI.t('loading', null, 'Cargando...')}</p>
              ) : pagos.length === 0 ? (
                <UI.EstadoVacio icono="fa-receipt" mensaje={MEITI.t('no_payments', null, 'No hay pagos registrados.')} />
              ) : (
                <UI.TablaDatos columnas={columnas} datos={pagos} claveId="id" onEditar={editar} onBorrar={f => borrar(f.id)} />
              )}
            </div>
          </UI.Tarjeta>
        </div>
      </div>
    </div>
  );
};

export default EstanciasDelSur_muujoww4__ES_GestorPagos;
