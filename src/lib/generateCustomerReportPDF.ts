import jsPDF from "jspdf";
import { Receivable } from "./receivablesStore";
import { Customer } from "./customersStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateCustomerReportPDF = (
  customer: Customer,
  receivables: Receivable[],
  storeName: string = "LOJA"
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const now = new Date();
  const totals = {
    total: receivables.reduce((sum, r) => sum + r.totalAmount, 0),
    paid: receivables.reduce((sum, r) => sum + r.paidAmount, 0),
    remaining: receivables.reduce((sum, r) => sum + r.remainingAmount, 0),
    activeCount: receivables.filter((r) => r.status !== "paid").length,
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

  // Helper to add text with auto line break
  const addText = (text: string, x: number, size: number = 10, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.text(text, x, yPos);
  };

  // Header - Title
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("EXTRATO DA CADERNETA", pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(storeName, pageWidth / 2, 25, { align: "center" });
  doc.text(format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth / 2, 32, { align: "center" });

  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Customer Info Section
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, "F");
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin + 5, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Código: ${customer.code}`, margin + 5, yPos);
  doc.text(`Nome: ${customer.name}`, margin + 5, yPos + 6);
  
  if (customer.cpfCnpj) {
    doc.text(`${customer.type === "lojista" ? "CNPJ" : "CPF"}: ${customer.cpfCnpj}`, margin + 5, yPos + 12);
  }
  if (customer.phone) {
    doc.text(`Telefone: ${customer.phone}`, pageWidth / 2, yPos + 12);
  }

  yPos += 30;

  // Financial Summary Section
  checkPageBreak(40);
  
  doc.setFillColor(220, 252, 231); // green-100
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, "F");
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO FINANCEIRO", margin + 5, yPos);
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Comprado: R$ ${totals.total.toFixed(2)}`, margin + 5, yPos);
  doc.text(`Total Pago: R$ ${totals.paid.toFixed(2)}`, margin + 5, yPos + 6);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Saldo Devedor: R$ ${totals.remaining.toFixed(2)}`, margin + 5, yPos + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Compras Ativas: ${totals.activeCount}`, pageWidth / 2, yPos + 12);

  yPos += 30;

  // Receivables Detail Section
  checkPageBreak(15);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETALHAMENTO DAS COMPRAS", margin, yPos);
  yPos += 10;

  receivables.forEach((receivable, index) => {
    const isOverdue =
      receivable.dueDate &&
      new Date(receivable.dueDate) < now &&
      receivable.status !== "paid";
    
    const detailHeight = 50 + (receivable.payments ? receivable.payments.length * 6 : 0);
    checkPageBreak(detailHeight);

    // Receivable Card
    const cardColor = receivable.status === "paid" 
      ? [220, 252, 231] // green-100
      : receivable.status === "partial"
      ? [254, 243, 199] // yellow-100
      : [254, 226, 226]; // red-100

    doc.setFillColor(cardColor[0], cardColor[1], cardColor[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, detailHeight - 5, "F");
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, pageWidth - 2 * margin, detailHeight - 5, "S");

    yPos += 7;

    // Product name and status
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${receivable.productName}`, margin + 5, yPos);
    
    const statusText = receivable.status === "paid" 
      ? "PAGO" 
      : receivable.status === "partial" 
      ? "PARCIAL" 
      : "PENDENTE";
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const statusWidth = doc.getTextWidth(statusText);
    doc.text(statusText, pageWidth - margin - statusWidth - 5, yPos);

    yPos += 7;

    // Dates
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Data: ${format(new Date(receivable.createdAt), "dd/MM/yyyy", { locale: ptBR })}`,
      margin + 5,
      yPos
    );
    
    if (receivable.dueDate) {
      const dueText = `Vencimento: ${format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}${isOverdue ? " ⚠ VENCIDO" : ""}`;
      doc.text(dueText, margin + 60, yPos);
      
      if (isOverdue) {
        doc.setTextColor(220, 38, 38); // red-600
      }
    }
    doc.setTextColor(0, 0, 0);

    yPos += 7;

    // Amounts
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total: R$ ${receivable.totalAmount.toFixed(2)}`, margin + 5, yPos);
    doc.text(`Pago: R$ ${receivable.paidAmount.toFixed(2)}`, margin + 60, yPos);
    doc.text(`Resta: R$ ${receivable.remainingAmount.toFixed(2)}`, margin + 115, yPos);

    yPos += 7;

    // Payments
    if (receivable.payments && receivable.payments.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Pagamentos:", margin + 5, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      receivable.payments.forEach((payment) => {
        const paymentText = `• ${format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })} - R$ ${payment.amount.toFixed(2)} (${payment.paymentMethod.toUpperCase()})`;
        doc.text(paymentText, margin + 7, yPos);
        yPos += 5;
      });
    }

    if (receivable.notes) {
      yPos += 2;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`Obs: ${receivable.notes}`, margin + 5, yPos);
      yPos += 5;
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
