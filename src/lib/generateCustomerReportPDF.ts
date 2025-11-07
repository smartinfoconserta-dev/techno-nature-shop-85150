import jsPDF from "jspdf";
import { Receivable } from "./receivablesStore";
import { Customer } from "./customersStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateCustomerReportPDF = (
  customer: Customer,
  receivables: Receivable[],
  storeName: string = "LOJA",
  showOnlyDebts: boolean = true
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const now = new Date();
  
  // Filtrar apenas dívidas ativas se showOnlyDebts = true
  const filteredReceivables = showOnlyDebts
    ? receivables.filter(r => r.status !== "paid")
    : receivables;
  
  const totals = {
    total: filteredReceivables.reduce((sum, r) => sum + r.totalAmount, 0),
    paid: filteredReceivables.reduce((sum, r) => sum + r.paidAmount, 0),
    remaining: filteredReceivables.reduce((sum, r) => sum + r.remainingAmount, 0),
    activeCount: filteredReceivables.filter((r) => r.status !== "paid").length,
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add separator line
  const addSeparator = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  // Header - Simple and clean
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(storeName, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Extrato da Caderneta - ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: "center" });

  yPos += 8;
  addSeparator();

  // Customer Info - Simple text
  yPos += 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${customer.code} - ${customer.name}`, margin, yPos);
  
  yPos += 6;
  const leftInfo = customer.cpfCnpj ? `${customer.type === "lojista" ? "CNPJ" : "CPF"}: ${customer.cpfCnpj}` : "";
  const rightInfo = customer.phone ? `Telefone: ${customer.phone}` : "";
  
  if (leftInfo) doc.text(leftInfo, margin, yPos);
  if (rightInfo) doc.text(rightInfo, pageWidth / 2, yPos);

  yPos += 8;
  addSeparator();

  // Financial Summary - Simple and clean
  checkPageBreak(25);
  
  yPos += 2;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO:", margin, yPos);
  
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total Comprado: R$ ${totals.total.toFixed(2)}`, margin, yPos);
  
  yPos += 5;
  doc.text(`Total Pago: R$ ${totals.paid.toFixed(2)}`, margin, yPos);
  
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`SALDO DEVEDOR: R$ ${totals.remaining.toFixed(2)}`, margin, yPos);

  yPos += 8;
  addSeparator();

  // Receivables List - Simple numbered list
  checkPageBreak(15);
  
  yPos += 2;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COMPRAS:", margin, yPos);
  yPos += 8;

  filteredReceivables.forEach((receivable, index) => {
    const isOverdue =
      receivable.dueDate &&
      new Date(receivable.dueDate) < now &&
      receivable.status !== "paid";
    
    const detailHeight = 25 + (receivable.payments ? receivable.payments.length * 5 : 0);
    checkPageBreak(detailHeight);

    // Number and product name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${receivable.productName}`, margin, yPos);

    yPos += 6;

    // Date and due date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const dateText = `Data: ${format(new Date(receivable.createdAt), "dd/MM/yyyy", { locale: ptBR })}`;
    doc.text(dateText, margin + 3, yPos);
    
    if (receivable.dueDate) {
      const dueText = `Vencimento: ${format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}${isOverdue ? " ⚠ VENCIDO" : ""}`;
      doc.text(dueText, margin + 60, yPos);
    }

    yPos += 5;

    // Amounts in one line
    doc.text(
      `Total: R$ ${receivable.totalAmount.toFixed(2)}  |  Pago: R$ ${receivable.paidAmount.toFixed(2)}  |  Resta: R$ ${receivable.remainingAmount.toFixed(2)}`,
      margin + 3,
      yPos
    );

    yPos += 5;

    // Payments as bullet list
    if (receivable.payments && receivable.payments.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Pagamentos:", margin + 3, yPos);
      yPos += 4;

      doc.setFont("helvetica", "normal");
      receivable.payments.forEach((payment) => {
        const paymentText = `• ${format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })} - R$ ${payment.amount.toFixed(2)} (${payment.paymentMethod.toUpperCase()})`;
        doc.text(paymentText, margin + 5, yPos);
        yPos += 4;
      });
      yPos += 1;
    } else {
      // Show status if no payments
      const statusText = receivable.status === "paid" 
        ? "Status: PAGO" 
        : receivable.status === "partial" 
        ? "Status: PARCIAL" 
        : "Status: PENDENTE";
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(statusText, margin + 3, yPos);
      yPos += 5;
    }

    if (receivable.notes) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`Obs: ${receivable.notes}`, margin + 3, yPos);
      yPos += 4;
    }

    yPos += 5;
  });

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Relatório gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Save PDF
  const fileName = `caderneta_${customer.code}_${format(now, "ddMMyyyy_HHmm")}.pdf`;
  doc.save(fileName);
};
