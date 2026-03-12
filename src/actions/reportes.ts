"use server";

import prisma from "@/lib/prisma";

export interface ClienteDetalle {
  clienteId: string;
  razonSocial: string;
  rut: string;
  unidadesEnviadas: number;
  ventaBruta: number;
  unidadesMerma: number;
  valorMerma: number;
  ventaEfectiva: number;
}

export interface ReporteData {
  label: string;
  totalEnvios: number;
  totalUnidadesEnviadas: number;
  totalMermas: number;
  ventaBruta: number;
  valorMermas: number;
  ventaEfectiva: number;
  detalleClientes: ClienteDetalle[];
}

export async function getReporteByRange(inicioISO: string, finISO: string, label: string): Promise<ReporteData> {
  const inicio = new Date(inicioISO);
  const fin = new Date(finISO);

  try {
    const envios = await prisma.envio.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      include: { cliente: true, detalles: { include: { producto: true } } },
    });

    const mermas = await prisma.merma.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      include: { producto: true, cliente: true },
    });

    // Aggregate per client
    const clienteMap = new Map<string, ClienteDetalle>();

    for (const envio of envios) {
      const c = envio.cliente;
      if (!clienteMap.has(c.id)) {
        clienteMap.set(c.id, { clienteId: c.id, razonSocial: c.razonSocial, rut: c.rut, unidadesEnviadas: 0, ventaBruta: 0, unidadesMerma: 0, valorMerma: 0, ventaEfectiva: 0 });
      }
      const entry = clienteMap.get(c.id)!;
      for (const det of envio.detalles) {
        entry.unidadesEnviadas += det.cantidad;
        entry.ventaBruta += det.cantidad * det.producto.precioBase;
      }
    }

    for (const merma of mermas) {
      const c = merma.cliente;
      if (!clienteMap.has(c.id)) {
        clienteMap.set(c.id, { clienteId: c.id, razonSocial: c.razonSocial, rut: c.rut, unidadesEnviadas: 0, ventaBruta: 0, unidadesMerma: 0, valorMerma: 0, ventaEfectiva: 0 });
      }
      const entry = clienteMap.get(c.id)!;
      entry.unidadesMerma += merma.cantidad;
      entry.valorMerma += merma.cantidad * merma.producto.precioBase;
    }

    // Compute effective per client
    for (const entry of clienteMap.values()) {
      entry.ventaEfectiva = entry.ventaBruta - entry.valorMerma;
    }

    const detalleClientes = Array.from(clienteMap.values()).sort((a, b) => b.ventaEfectiva - a.ventaEfectiva);

    let totalUnidadesEnviadas = 0, ventaBruta = 0, totalMermas = 0, valorMermas = 0;
    for (const c of detalleClientes) {
      totalUnidadesEnviadas += c.unidadesEnviadas;
      ventaBruta += c.ventaBruta;
      totalMermas += c.unidadesMerma;
      valorMermas += c.valorMerma;
    }

    return {
      label,
      totalEnvios: envios.length,
      totalUnidadesEnviadas,
      totalMermas,
      ventaBruta,
      valorMermas,
      ventaEfectiva: ventaBruta - valorMermas,
      detalleClientes,
    };
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return { label, totalEnvios: 0, totalUnidadesEnviadas: 0, totalMermas: 0, ventaBruta: 0, valorMermas: 0, ventaEfectiva: 0, detalleClientes: [] };
  }
}
