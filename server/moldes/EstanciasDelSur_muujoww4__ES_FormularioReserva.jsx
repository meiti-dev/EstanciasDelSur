/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [depto, setDepto] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '', huespedes: '1', nombre_huesped: '', telefono_huesped: '' });
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    const resSel = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('es_seleccion_temporal')}?ecosistema=${eco}`);
    if (resSel.ok && resSel.registros.length > 0) {
      const deptoId = resSel.registros[0].departamento_id;
      const [resDep, resRes] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_departamentos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`)
      ]);
      if (resDep.ok) setDepto(resDep.registros.find(d => d.id === deptoId));
      if (resRes.ok) setReservas(resRes.registros.filter(r => r.departamento_id === deptoId && r.estado !== 'Cancelada'));
    }
  };

  useEffect(() => { cargar(); }, []);

  if (!depto) return null;

  const calcularNoches = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    if (d2 <= d1) return 0;
    return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  };

  const noches = calcularNoches(form.fecha_inicio, form.fecha_fin);
  const montoAlojamiento = noches * depto.precio_noche;
  const montoTotal = montoAlojamiento + depto.tarifa_limpieza;

  const fechasOcupadas = (inicio, fin) => {
    if (!inicio || !fin) return false;
    return reservas.some(r => {
      return (inicio < r.fecha_fin && fin > r.fecha_inicio);
    });
  };

  const reservar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.fecha_inicio || !form.fecha_fin) return setError(MEITI.t('select_dates', null, 'Selecciona las fechas.'));
    if (noches <= 0) return setError(MEITI.t('invalid_dates', null, 'La fecha de salida debe ser posterior a la de llegada.'));
    if (Number(form.huespedes) > depto.capacidad) return setError(MEITI.t('max_capacity_err', { cap: depto.capacidad }, 'La capacidad máxima es de {cap} huéspedes.'));
    if (!form.nombre_huesped.trim() || !form.telefono_huesped.trim()) return setError(MEITI.t('contact_info_req', null, 'Completa tus datos de contacto.'));
    if (fechasOcupadas(form.fecha_inicio, form.fecha_fin)) return setError(MEITI.t('dates_occupied', null, 'Las fechas seleccionadas ya están ocupadas.'));

    setProcesando(true);
    const reservaId = 'res_' + Date.now();
    const payload = {
      id: reservaId,
      departamento_id: depto.id,
      huesped_id: miId,
      nombre_huesped: form.nombre_huesped.trim(),
      telefono_huesped: form.telefono_huesped.trim(),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      huespedes: Number(form.huespedes),
      total_noches: noches,
      monto_alojamiento: montoAlojamiento,
      monto_limpieza: depto.tarifa_limpieza,
      monto_total: montoTotal,
      estado: 'Pendiente',
      notas: '',
      fecha_registro: new Date().toISOString()
    };

    const resPrecio = await MEITI.fetchMutante(`/api/pagos-conectados/${eco}/precios`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ item_id: reservaId, item_titulo: `Reserva: ${depto.nombre}`, monto_centavos: Math.round(montoTotal * 100) })
    });

    if (!resPrecio.ok) {
      setError(resPrecio.error || MEITI.t('price_error', null, 'No se pudo registrar el precio.'));
      setProcesando(false);
      return;
    }

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('es_reservas')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('booking_success', null, 'Reserva creada con éxito. Redirigiendo al pago...'));
        setTimeout(async () => {
          const resPago = await MEITI.fetchMutante(`/api/pagos-conectados/${eco}/comprar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item_id: reservaId, usuario_id: miId, url_exito: window.location.origin + '/?pagina=reservas', url_cancelado: window.location.href })
          });
          if (resPago.ok && resPago.data && resPago.data.url) {
            window.location.href = resPago.data.url;
          } else {
            MEITI.irAPagina('reservas');
          }
        }, 2000);
      },
      alFallar: (err) => { setError(err); setProcesando(false); }
    });
  };

  return (
    <Animacion.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
      <UI.Tarjeta className="p-6 rounded-3xl sticky top-6 shadow-xl border-0" style={{backgroundColor: tema.superficie}}>
        <h3 className="font-serif text-2xl mb-6" style={{color: tema.texto}}>{MEITI.t('book_now', null, 'Reservar')}</h3>
        <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
        <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

        <form onSubmit={reservar} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('check_in', null, 'Llegada')} tipo="date" valor={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} /></div>
            <div className="flex-1"><UI.Campo etiqueta={MEITI.t('check_out', null, 'Salida')} tipo="date" valor={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} /></div>
          </div>
          <UI.Campo etiqueta={MEITI.t('guests_count', null, 'Huéspedes')} tipo="number" valor={form.huespedes} onChange={e => setForm({...form, huespedes: e.target.value})} />
          <UI.Campo etiqueta={MEITI.t('full_name', null, 'Nombre Completo')} tipo="text" valor={form.nombre_huesped} onChange={e => setForm({...form, nombre_huesped: e.target.value})} />
          <UI.Campo etiqueta={MEITI.t('phone', null, 'Teléfono')} tipo="text" valor={form.telefono_huesped} onChange={e => setForm({...form, telefono_huesped: e.target.value})} />

          {noches > 0 && (
            <div className="mt-4 p-4 rounded-2xl flex flex-col gap-2" style={{backgroundColor: tema.fondo}}>
              <div className="flex justify-between text-sm" style={{color: tema.texto}}>
                <span>${depto.precio_noche} x {noches} {MEITI.t('nights_label', null, 'noches')}</span>
                <span>${montoAlojamiento}</span>
              </div>
              <div className="flex justify-between text-sm" style={{color: tema.texto}}>
                <span>{MEITI.t('cleaning_fee', null, 'Tarifa de limpieza')}</span>
                <span>${depto.tarifa_limpieza}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t" style={{color: tema.texto, borderColor: tema.texto + '1A'}}>
                <span>{MEITI.t('total', null, 'Total')}</span>
                <span>${montoTotal}</span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <UI.Boton tipo="submit" variante="primario" disabled={procesando || noches <= 0}>{procesando ? MEITI.t('processing', null, 'Procesando...') : MEITI.t('confirm_pay', null, 'Confirmar y Pagar')}</UI.Boton>
          </div>
        </form>
      </UI.Tarjeta>
    </Animacion.motion.div>
  );
}