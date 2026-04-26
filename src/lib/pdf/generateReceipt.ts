import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateReceipt = (order: any, restaurant: any) => {
  const doc: any = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(2, 6, 23); // Dark slate
  doc.text(restaurant.name, 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(restaurant.address, 105, 28, { align: "center" });
  doc.text(`Phone: ${restaurant.phone}`, 105, 33, { align: "center" });
  if (restaurant.gst) doc.text(`GST: ${restaurant.gst}`, 105, 38, { align: "center" });

  doc.setDrawColor(200);
  doc.line(20, 45, 190, 45);

  // Order Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Bill No: ${order.id}`, 20, 55);
  doc.text(`Table: ${order.table}`, 150, 55);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 62);
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, 150, 62);

  // Items Table
  const tableData = order.items.map((item: any) => [
    item.name,
    item.quantity,
    `INR ${item.price.toFixed(2)}`,
    `INR ${(item.quantity * item.price).toFixed(2)}`,
  ]);

  doc.autoTable({
    startY: 70,
    head: [["Item", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [0, 212, 255] },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.text("Subtotal:", 140, finalY);
  doc.text(`INR ${order.subtotal.toFixed(2)}`, 190, finalY, { align: "right" });

  doc.text(`GST (${restaurant.tax}%):`, 140, finalY + 7);
  doc.text(`INR ${order.tax.toFixed(2)}`, 190, finalY + 7, { align: "right" });

  if (restaurant.serviceCharge > 0) {
    doc.text(`Service Charge (${restaurant.serviceCharge}%):`, 140, finalY + 14);
    doc.text(`INR ${order.serviceCharge.toFixed(2)}`, 190, finalY + 14, { align: "right" });
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 140, finalY + 25);
  doc.text(`INR ${order.total.toFixed(2)}`, 190, finalY + 25, { align: "right" });

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Thank you for dining with us!", 105, finalY + 45, { align: "center" });
  doc.text("Bhojan POS System", 105, finalY + 50, { align: "center" });

  doc.save(`receipt-${order.id}.pdf`);
};
