export interface IvaCalculation {
  neto: number;
  iva: number;
  total: number;
}

/**
 * Factura A: precio es neto, IVA se suma encima.
 * Factura B/C/informal: IVA embebido en el total.
 */
export function calculateIva(
  amount: number,
  ivaRate: number,
  invoiceType: string,
): IvaCalculation {
  if (invoiceType === "factura_a") {
    const neto = amount;
    const iva = neto * (ivaRate / 100);
    return { neto, iva, total: neto + iva };
  }
  const neto = amount / (1 + ivaRate / 100);
  const iva = amount - neto;
  return { neto, iva, total: amount };
}

export function extractIvaFromTotal(
  total: number,
  ivaRate: number,
): IvaCalculation {
  const neto = total / (1 + ivaRate / 100);
  const iva = total - neto;
  return { neto, iva, total };
}

export const IVA_RATES = [0, 10.5, 21, 27] as const;

export function formatCurrency(value: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
