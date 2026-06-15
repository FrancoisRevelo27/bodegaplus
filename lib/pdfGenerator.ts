import jsPDF from "jspdf";
import { Invoice } from "@/types/shop";
import { IVA_LABEL } from "./tax";

/**
 * Construye el contenido del PDF de forma dinámica y adaptable.
 */
function buildPDFContent(doc: jsPDF, invoice: Invoice) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA DE VENTA", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nota de Venta No: ${invoice.numeroFactura}`, margin, yPosition);

  yPosition += 5;
  const fechaRaw = invoice.fechaCreacion;
  const fechaDate = (fechaRaw && typeof (fechaRaw as any).toDate === 'function') 
    ? (fechaRaw as any).toDate() 
    : (fechaRaw ? new Date(fechaRaw as any) : new Date());
  doc.text(`Fecha: ${fechaDate.toLocaleDateString("es-EC")}`, margin, yPosition);

  // Información del cliente
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", margin, yPosition);

  yPosition += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${invoice.customerName}`, margin, yPosition);
  yPosition += 4;
  doc.text(`Cédula: ${invoice.customerCedula}`, margin, yPosition);
  yPosition += 4;
  doc.text(`Email: ${invoice.customerEmail}`, margin, yPosition);

  // Tabla de productos responsiva (usa proporciones del ancho de página)
  yPosition += 10;
  doc.setFontSize(10);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  const colProductX = margin;
  const colQtyX = pageWidth * 0.55;   // Dinámico
  const colPriceX = pageWidth * 0.75;  // Dinámico
  const colTotalX = pageWidth - margin;

  // Fondo del encabezado de tabla
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), 7, "F");
  doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), 7, "S");
  
  doc.setFont("helvetica", "bold");
  doc.text("Producto", colProductX + 2, yPosition);
  doc.text("Cant.", colQtyX, yPosition, { align: "center" });
  doc.text("P. Unit.", colPriceX, yPosition, { align: "center" });
  doc.text("Subtotal", colTotalX - 2, yPosition, { align: "right" });

  yPosition += 8;
  doc.setFont("helvetica", "normal");

  // Filas de productos
  invoice.items.forEach((item) => {
    // Responsiveness: Ajuste de texto para nombres muy largos de productos
    const nameLines = doc.splitTextToSize(item.productName, colQtyX - colProductX - 8);
    const lineCount = Array.isArray(nameLines) ? nameLines.length : 1;
    
    doc.text(nameLines, colProductX + 2, yPosition);
    doc.text(item.quantity.toString(), colQtyX, yPosition, { align: "center" });
    doc.text(`$${item.unitPrice.toFixed(2)}`, colPriceX + 5, yPosition, { align: "right" });
    doc.text(`$${item.subtotal.toFixed(2)}`, colTotalX - 2, yPosition, { align: "right" });

    yPosition += (5 * lineCount) + 2;

    // Salto de página automático si el contenido excede el alto
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
  });

  // Totales
  yPosition += 5;
  doc.setLineWidth(0.2);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 7;
  doc.setFontSize(9);
  doc.text("Subtotal:", colPriceX, yPosition, { align: "right" });
  doc.text(`$${invoice.subtotal.toFixed(2)}`, colTotalX - 2, yPosition, { align: "right" });

  yPosition += 5;
  doc.text(IVA_LABEL, colPriceX, yPosition, { align: "right" });
  doc.text(`$${invoice.iva.toFixed(2)}`, colTotalX - 2, yPosition, { align: "right" });

  yPosition += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", colPriceX, yPosition, { align: "right" });
  doc.text(`$${invoice.total.toFixed(2)}`, colTotalX - 2, yPosition, { align: "right" });

  // Footer info
  yPosition += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Vendedor: ${invoice.vendedorNombre}`, margin, yPosition);

  if (invoice.observaciones) {
    yPosition += 4;
    doc.text(`Observaciones: ${invoice.observaciones}`, margin, yPosition);
  }

  doc.setFontSize(7);
  doc.text("Gracias por su compra en BodegaPlus", pageWidth / 2, pageHeight - 10, { align: "center" });
}

export function generateInvoicePDF(invoice: Invoice): string {
  const doc = new jsPDF();
  buildPDFContent(doc, invoice);
  return doc.output("dataurlstring");
}

export function downloadInvoicePDF(invoice: Invoice) {
  const pdf = new jsPDF();
  buildPDFContent(pdf, invoice);
  pdf.save(`NotaVenta_${invoice.numeroFactura}.pdf`);
}
