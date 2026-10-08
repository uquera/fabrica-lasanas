// Lógica pura del módulo Time Market (sin base de datos).
// Replica la planilla "Guia Tiendas TM":
//   - Cada guía es una visita del camión: se ENTREGA producto y se RETIRA (devolución) lo que no se vendió.
//   - La devolución registrada en una visita corresponde a la guía ANTERIOR.
//   - Venta efectiva de la guía N = entrega(N) − devolución(N+1).
//   - Monto neto = venta individual × precio individual + venta mini × precio mini (precios congelados en la guía).

export type TmLineaData = {
  tiendaId: string;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
};

export type TmGuiaData = {
  id: string;
  fecha: string; // YYYY-MM-DD
  precioIndividual: number;
  precioMini: number;
  tasaIva: number;
  nota: string | null;
  lineas: TmLineaData[];
};

export type TmVentaTienda = {
  tiendaId: string;
  entregaIndividual: number;
  entregaMini: number;
  retiroIndividual: number | null; // null = aún no hay guía siguiente
  retiroMini: number | null;
  ventaIndividual: number | null;
  ventaMini: number | null;
  neto: number | null;
};

export type TmGuiaCalculada = {
  guia: TmGuiaData;
  siguienteFecha: string | null; // fecha de la guía donde se registra el retiro
  cerrada: boolean; // true cuando ya existe la guía siguiente (retiro registrado)
  tiendas: TmVentaTienda[];
  totales: {
    entregaIndividual: number;
    entregaMini: number;
    retiroIndividual: number;
    retiroMini: number;
    ventaIndividual: number;
    ventaMini: number;
    neto: number;
    iva: number;
    total: number;
  };
};

/** Calcula todas las guías. Recibe guías en cualquier orden. */
export function calcularGuias(guias: TmGuiaData[]): TmGuiaCalculada[] {
  const orden = [...guias].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return orden.map((guia, i) => {
    const siguiente = orden[i + 1] ?? null;
    const devSiguiente = new Map<string, TmLineaData>();
    for (const l of siguiente?.lineas ?? []) devSiguiente.set(l.tiendaId, l);

    const t = {
      entregaIndividual: 0, entregaMini: 0, retiroIndividual: 0, retiroMini: 0,
      ventaIndividual: 0, ventaMini: 0, neto: 0, iva: 0, total: 0,
    };

    const tiendas: TmVentaTienda[] = guia.lineas.map((l) => {
      const dev = devSiguiente.get(l.tiendaId);
      const retiroIndividual = siguiente ? dev?.devolucionIndividual ?? 0 : null;
      const retiroMini = siguiente ? dev?.devolucionMini ?? 0 : null;
      const ventaIndividual = retiroIndividual === null ? null : l.entregaIndividual - retiroIndividual;
      const ventaMini = retiroMini === null ? null : l.entregaMini - retiroMini;
      const neto =
        ventaIndividual === null || ventaMini === null
          ? null
          : ventaIndividual * guia.precioIndividual + ventaMini * guia.precioMini;

      t.entregaIndividual += l.entregaIndividual;
      t.entregaMini += l.entregaMini;
      t.retiroIndividual += retiroIndividual ?? 0;
      t.retiroMini += retiroMini ?? 0;
      t.ventaIndividual += ventaIndividual ?? 0;
      t.ventaMini += ventaMini ?? 0;
      t.neto += neto ?? 0;

      return {
        tiendaId: l.tiendaId,
        entregaIndividual: l.entregaIndividual,
        entregaMini: l.entregaMini,
        retiroIndividual, retiroMini, ventaIndividual, ventaMini, neto,
      };
    });

    t.iva = Math.round(t.neto * guia.tasaIva);
    t.total = Math.round(t.neto) + t.iva;

    return { guia, siguienteFecha: siguiente?.fecha ?? null, cerrada: !!siguiente, tiendas, totales: t };
  });
}

export type TmResumenTienda = {
  tiendaId: string;
  entregaIndividual: number;
  entregaMini: number;
  retiroIndividual: number;
  retiroMini: number;
  ventaIndividual: number;
  ventaMini: number;
  neto: number;
};

/** Resumen por rango de fechas (igual que "Calcular Resumen por Rango de Fechas"). Solo guías cerradas. */
export function resumenPorRango(calculadas: TmGuiaCalculada[], desde: string, hasta: string) {
  const enRango = calculadas.filter((g) => g.guia.fecha >= desde && g.guia.fecha <= hasta);
  const cerradas = enRango.filter((g) => g.cerrada);
  const porTienda = new Map<string, TmResumenTienda>();
  let neto = 0;
  let iva = 0;

  for (const g of cerradas) {
    for (const v of g.tiendas) {
      const r = porTienda.get(v.tiendaId) ?? {
        tiendaId: v.tiendaId, entregaIndividual: 0, entregaMini: 0, retiroIndividual: 0, retiroMini: 0,
        ventaIndividual: 0, ventaMini: 0, neto: 0,
      };
      r.entregaIndividual += v.entregaIndividual;
      r.entregaMini += v.entregaMini;
      r.retiroIndividual += v.retiroIndividual ?? 0;
      r.retiroMini += v.retiroMini ?? 0;
      r.ventaIndividual += v.ventaIndividual ?? 0;
      r.ventaMini += v.ventaMini ?? 0;
      r.neto += v.neto ?? 0;
      porTienda.set(v.tiendaId, r);
    }
    neto += g.totales.neto;
    iva += g.totales.iva;
  }

  return {
    guias: cerradas.length,
    pendientes: enRango.length - cerradas.length,
    tiendas: [...porTienda.values()],
    ventaIndividual: cerradas.reduce((s, g) => s + g.totales.ventaIndividual, 0),
    ventaMini: cerradas.reduce((s, g) => s + g.totales.ventaMini, 0),
    neto: Math.round(neto),
    iva,
    total: Math.round(neto) + iva,
  };
}

// ── Fechas (siempre como YYYY-MM-DD, sin zonas horarias) ─────────────────────

export function isoAFecha(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

export function fechaAIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Próxima visita: martes → viernes → martes. */
export function siguienteFechaVisita(ultimaIso: string): string {
  const d = isoAFecha(ultimaIso);
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() !== 2 && d.getUTCDay() !== 5);
  return fechaAIso(d);
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatoFecha(iso: string, conDia = false): string {
  const [y, m, d] = iso.split("-");
  const base = `${d}/${m}/${y.slice(2)}`;
  return conDia ? `${DIAS[isoAFecha(iso).getUTCDay()]} ${base}` : base;
}

export const fmtCLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
