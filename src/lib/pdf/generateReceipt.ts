import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (order: any, restaurant: any) => {
  const doc = new jsPDF();

  // Color Palette
  const colors = {
    primary: [0, 212, 255], // Bhojan Cyan/Blue
    dark: [2, 6, 23],
    slate: [100, 116, 139],
    lightSlate: [203, 213, 225],
    white: [255, 255, 255]
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(restaurant.name || "BHOJAN", 105, 25, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
  doc.text(restaurant.address || "Restaurant Address", 105, 33, { align: "center" });
  doc.text(`Phone: ${restaurant.phone || "N/A"}`, 105, 38, { align: "center" });
  if (restaurant.gst_number || restaurant.gst) {
    doc.text(`GSTIN: ${restaurant.gst_number || restaurant.gst}`, 105, 43, { align: "center" });
  }

  // Divider
  doc.setDrawColor(colors.lightSlate[0], colors.lightSlate[1], colors.lightSlate[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Customer & Order Info
  doc.setFontSize(9);
  doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
  doc.text("CUSTOMER DETAILS", 20, 60);
  doc.text("ORDER INFO", 150, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text(order.customer_name || "Guest", 20, 67);
  doc.text(`Table: ${order.table_number || order.table || "N/A"}`, 150, 67);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(order.customer_phone || "", 20, 73);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 150, 73);
  doc.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, 150, 78);
  doc.text(`Bill No: ${order.id.slice(-8).toUpperCase()}`, 20, 78);

  // Items Table
  const tableData = order.items.map((item: any) => [
    item.name || item.menu_items?.name,
    item.quantity,
    `INR ${Number(item.price || item.unit_price).toFixed(2)}`,
    `INR ${Number(item.total_price || (item.quantity * item.price)).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["Item Description", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { 
      fillColor: colors.dark as [number, number, number], 
      textColor: colors.white as [number, number, number],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  const rightX = 190;
  const labelX = 140;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
  
  doc.text("Subtotal:", labelX, finalY);
  doc.text(`INR ${Number(order.subtotal).toFixed(2)}`, rightX, finalY, { align: "right" });

  let currentY = finalY + 7;

  // CGST/SGST Breakdown
  if (order.cgst > 0) {
    doc.text(`CGST (${restaurant.cgst_percent || 2.5}%):`, labelX, currentY);
    doc.text(`INR ${Number(order.cgst).toFixed(2)}`, rightX, currentY, { align: "right" });
    currentY += 7;
  }

  if (order.sgst > 0) {
    doc.text(`SGST (${restaurant.sgst_percent || 2.5}%):`, labelX, currentY);
    doc.text(`INR ${Number(order.sgst).toFixed(2)}`, rightX, currentY, { align: "right" });
    currentY += 7;
  }

  // Service Charge
  if (order.serviceCharge > 0) {
    doc.text(`Service Charge (${restaurant.service_charge_percent || 5}%):`, labelX, currentY);
    doc.text(`INR ${Number(order.serviceCharge).toFixed(2)}`, rightX, currentY, { align: "right" });
    currentY += 7;
  }

  // Grand Total Section with Highlight
  currentY += 5;
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.roundedRect(labelX - 15, currentY, (rightX - labelX) + 20, 15, 2, 2, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.text("GRAND TOTAL", labelX - 10, currentY + 10);
  
  doc.setFontSize(14);
  doc.text(`INR ${Number(order.total).toFixed(2)}`, rightX + 2, currentY + 10, { align: "right" });

  // Footer
  const footerY = currentY + 35;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text("Billed by BHOJAN", 105, footerY, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
  doc.text("Thank you for your visit!", 105, footerY + 7, { align: "center" });
  
  // Decorative line at bottom
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(2);
  doc.line(20, footerY + 15, 190, footerY + 15);

  doc.save(`Receipt_${order.id.slice(-6).toUpperCase()}.pdf`);
};



