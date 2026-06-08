import jsPDF from "jspdf";
import { Invoice } from "@/types/shop";

export function generateInvoicePDF(invoice: Invoice): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  // Encabezado
  doc.setFontSize(20);
  doc.text("FACTURA", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  doc.text(`Número: ${invoice.numeroFactura}`, 10, yPosition);

  yPosition += 5;
  const fechaCreacion = invoice.fechaCreacion?.toDate
    ? invoice.fechaCreacion.toDate()
    : new Date(invoice.fechaCreacion);
  doc.text(`Fecha: ${fechaCreacion.toLocaleDateString("es-CO")}`, 10, yPosition);

  // Información del cliente
  yPosition += 10;
  doc.setFontSize(11);
  doc.text("CLIENTE:", 10, yPosition);

  yPosition += 5;
  doc.setFontSize(9);
  doc.text(`Nombre: ${invoice.customerName}`, 10, yPosition);
  yPosition += 4;
  doc.text(`Cédula: ${invoice.customerCedula}`, 10, yPosition);
  yPosition += 4;
  doc.text(`Email: ${invoice.customerEmail}`, 10, yPosition);

  // Tabla de productos
  yPosition += 10;
  doc.setFontSize(10);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Encabezados de tabla
  const tableStartX = 10;
  const col1X = 10;
  const col2X = 70;
  const col3X = 110;
  const col4X = 150;
  const col5X = 185;

  doc.rect(col1X, yPosition - 3, pageWidth - 20, 6);
  doc.text("Producto", col1X + 2, yPosition, { align: "left" });
  doc.text("Cantidad", col2X + 2, yPosition, { align: "center" });
  doc.text("Precio Unitario", col3X + 2, yPosition, { align: "center" });
  doc.text("Subtotal", col4X + 2, yPosition, { align: "center" });

  yPosition += 8;

  // Filas de productos
  invoice.items.forEach((item) => {
    doc.text(item.productName, col1X + 2, yPosition);
    doc.text(item.quantity.toString(), col2X + 2, yPosition, { align: "center" });
    doc.text(`$${item.unitPrice.toFixed(2)}`, col3X + 2, yPosition, { align: "right" });
    doc.text(`$${item.subtotal.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

    yPosition += 6;

    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 10;
    }
  });

  // Línea separadora
  yPosition += 2;
  doc.setLineWidth(0.3);
  doc.line(10, yPosition, pageWidth - 10, yPosition);

  // Totales
  yPosition += 5;
  doc.setFontSize(9);
  doc.text("Subtotal:", col4X - 20, yPosition, { align: "right" });
  doc.text(`$${invoice.subtotal.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  yPosition += 5;
  doc.text("IVA (19%):", col4X - 20, yPosition, { align: "right" });
  doc.text(`$${invoice.iva.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  yPosition += 6;
  doc.setFontSize(11);
  doc.setFont("", "bold");
  doc.text("TOTAL:", col4X - 20, yPosition, { align: "right" });
  doc.text(`$${invoice.total.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  // Información del vendedor
  yPosition += 10;
  doc.setFontSize(8);
  doc.setFont("", "normal");
  doc.text(`Vendedor: ${invoice.vendedorNombre}`, 10, yPosition);

  if (invoice.observaciones) {
    yPosition += 4;
    doc.text(`Observaciones: ${invoice.observaciones}`, 10, yPosition);
  }

  // Pie de página
  yPosition = pageHeight - 10;
  doc.setFontSize(7);
  doc.text("Gracias por su compra", pageWidth / 2, yPosition, { align: "center" });

  return doc.output("dataurlstring");
}

export function downloadInvoicePDF(invoice: Invoice) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 10;

  // Encabezado
  pdf.setFontSize(20);
  pdf.text("FACTURA", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  pdf.setFontSize(10);
  pdf.text(`Número: ${invoice.numeroFactura}`, 10, yPosition);

  yPosition += 5;
  const fechaCreacion = invoice.fechaCreacion?.toDate
    ? invoice.fechaCreacion.toDate()
    : new Date(invoice.fechaCreacion);
  pdf.text(`Fecha: ${fechaCreacion.toLocaleDateString("es-CO")}`, 10, yPosition);

  // Información del cliente
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.text("CLIENTE:", 10, yPosition);

  yPosition += 5;
  pdf.setFontSize(9);
  pdf.text(`Nombre: ${invoice.customerName}`, 10, yPosition);
  yPosition += 4;
  pdf.text(`Cédula: ${invoice.customerCedula}`, 10, yPosition);
  yPosition += 4;
  pdf.text(`Email: ${invoice.customerEmail}`, 10, yPosition);

  // Tabla de productos
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);

  const col1X = 10;
  const col2X = 70;
  const col3X = 110;
  const col4X = 150;

  pdf.rect(col1X, yPosition - 3, pageWidth - 20, 6);
  pdf.text("Producto", col1X + 2, yPosition, { align: "left" });
  pdf.text("Cantidad", col2X + 2, yPosition, { align: "center" });
  pdf.text("Precio Unitario", col3X + 2, yPosition, { align: "center" });
  pdf.text("Subtotal", col4X + 2, yPosition, { align: "center" });

  yPosition += 8;

  invoice.items.forEach((item) => {
    pdf.text(item.productName, col1X + 2, yPosition);
    pdf.text(item.quantity.toString(), col2X + 2, yPosition, { align: "center" });
    pdf.text(`$${item.unitPrice.toFixed(2)}`, col3X + 2, yPosition, { align: "right" });
    pdf.text(`$${item.subtotal.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

    yPosition += 6;

    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 10;
    }
  });

  yPosition += 2;
  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);

  yPosition += 5;
  pdf.setFontSize(9);
  pdf.text("Subtotal:", col4X - 20, yPosition, { align: "right" });
  pdf.text(`$${invoice.subtotal.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  yPosition += 5;
  pdf.text("IVA (19%):", col4X - 20, yPosition, { align: "right" });
  pdf.text(`$${invoice.iva.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  yPosition += 6;
  pdf.setFontSize(11);
  pdf.setFont("", "bold");
  pdf.text("TOTAL:", col4X - 20, yPosition, { align: "right" });
  pdf.text(`$${invoice.total.toFixed(2)}`, col4X + 2, yPosition, { align: "right" });

  yPosition += 10;
  pdf.setFontSize(8);
  pdf.setFont("", "normal");
  pdf.text(`Vendedor: ${invoice.vendedorNombre}`, 10, yPosition);

  if (invoice.observaciones) {
    yPosition += 4;
    pdf.text(`Observaciones: ${invoice.observaciones}`, 10, yPosition);
  }

  pdf.save(`${invoice.numeroFactura}.pdf`);
}
