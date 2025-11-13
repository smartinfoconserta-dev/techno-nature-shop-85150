import jsPDF from "jspdf";
import { format } from "date-fns";

interface ReceivablePayment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
}

interface Receivable {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: number;
  installmentRate: number;
  dueDate?: string;
  status: "pending" | "partial" | "paid";
  payments: ReceivablePayment[];
  warranty?: number;
  warrantyExpiresAt?: string;
  notes?: string;
  createdAt: string;
}

interface Customer {
  code: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
}

export function generateCustomerPortalPDF(
  customer: Customer,
  receivables: Receivable[],
  periodLabel: string,
  storeName: string = "LOJA"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Calcular totais
  const totalComprado = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPago = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDevedor = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  const activeCount = receivables.filter(r => r.status !== "paid").length;

  // Helper para quebrar página
  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (yPos + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper para adicionar separador
  const addSeparator = () => {
    checkPageBreak(10);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // ===== CABEÇALHO =====
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(storeName, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Extrato de Compras", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Período: ${periodLabel} | Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 10;

  addSeparator();

  // ===== DADOS DO CLIENTE =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("DADOS DO CLIENTE", margin, yPos);
  yPos += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Código: ${customer.code}`, margin, yPos);
  yPos += 5;
  doc.text(`Nome: ${customer.name}`, margin, yPos);
  yPos += 5;

  if (customer.cpfCnpj) {
    doc.text(`CPF/CNPJ: ${customer.cpfCnpj}`, margin, yPos);
    yPos += 5;
  }

  if (customer.phone) {
    doc.text(`Telefone: ${customer.phone}`, margin, yPos);
    yPos += 5;
  }

  yPos += 3;
  addSeparator();

  // ===== RESUMO FINANCEIRO =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO FINANCEIRO", margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Comprado: R$ ${totalComprado.toFixed(2)}`, margin, yPos);
  yPos += 5;
  doc.setTextColor(0, 128, 0);
  doc.text(`Total Pago: R$ ${totalPago.toFixed(2)}`, margin, yPos);
  yPos += 5;
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text(`SALDO DEVEDOR: R$ ${totalDevedor.toFixed(2)}`, margin, yPos);
  yPos += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Compras ativas: ${activeCount}`, margin, yPos);
  yPos += 5;

  yPos += 3;
  addSeparator();

  // ===== LISTA DE COMPRAS =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COMPRAS", margin, yPos);
  yPos += 7;

  receivables.forEach((receivable, index) => {
    checkPageBreak(40);

    // Título do produto
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const productTitle = `${index + 1}. ${receivable.productName}`;
    doc.text(productTitle, margin, yPos);
    yPos += 5;

    // Marca e categoria
    if (receivable.brand || receivable.category) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const details = [receivable.brand, receivable.category].filter(Boolean).join(" - ");
      doc.text(details, margin + 3, yPos);
      yPos += 5;
    }

    // Data da compra
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Data da Compra: ${format(new Date(receivable.createdAt), "dd/MM/yyyy")}`, margin + 3, yPos);
    yPos += 5;

    // Vencimento (destacar atraso)
    if (receivable.dueDate) {
      const isOverdue = new Date(receivable.dueDate) < new Date() && receivable.status !== "paid";
      if (isOverdue) {
        doc.setTextColor(220, 38, 38);
        doc.setFont("helvetica", "bold");
      }
      doc.text(
        `Vencimento: ${format(new Date(receivable.dueDate), "dd/MM/yyyy")}${isOverdue ? " (ATRASADO)" : ""}`,
        margin + 3,
        yPos
      );
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      yPos += 5;
    }

    // Valores
    doc.text(`Total: R$ ${receivable.totalAmount.toFixed(2)}`, margin + 3, yPos);
    yPos += 4;
    doc.setTextColor(0, 128, 0);
    doc.text(`Pago: R$ ${receivable.paidAmount.toFixed(2)}`, margin + 3, yPos);
    yPos += 4;
    doc.setTextColor(220, 38, 38);
    doc.text(`Restante: R$ ${receivable.remainingAmount.toFixed(2)}`, margin + 3, yPos);
    yPos += 5;
    doc.setTextColor(0, 0, 0);

    // Histórico de pagamentos
    if (receivable.payments.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Pagamentos:", margin + 3, yPos);
      yPos += 4;

      doc.setFont("helvetica", "normal");
      receivable.payments.forEach((payment) => {
        checkPageBreak(15);
        const paymentMethodLabel =
          payment.paymentMethod === "cash"
            ? "Dinheiro"
            : payment.paymentMethod === "pix"
            ? "PIX"
            : "Cartão";
        doc.text(
          `• ${format(new Date(payment.paymentDate), "dd/MM/yyyy")} - ${paymentMethodLabel}: R$ ${payment.amount.toFixed(2)}`,
          margin + 6,
          yPos
        );
        yPos += 4;
      });
      yPos += 1;
    }

    // Status
    const statusLabels = {
      pending: "Pendente",
      partial: "Parcial",
      paid: "Quitado",
    };
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    if (receivable.status === "paid") {
      doc.setTextColor(34, 197, 94);
    } else if (receivable.status === "partial") {
      doc.setTextColor(234, 179, 8);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`Status: ${statusLabels[receivable.status]}`, margin + 3, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 5;

    // Garantia
    if (receivable.warranty && receivable.warranty > 0 && receivable.warrantyExpiresAt) {
      const warrantyExpiration = new Date(receivable.warrantyExpiresAt);
      const now = new Date();
      const isActive = warrantyExpiration > now;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      if (isActive) {
        const daysRemaining = Math.ceil((warrantyExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        doc.text(
          `Garantia: ${receivable.warranty} dias (${daysRemaining} dias restantes até ${format(warrantyExpiration, "dd/MM/yyyy")})`,
          margin + 3,
          yPos
        );
      } else {
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Garantia: ${receivable.warranty} dias (expirada em ${format(warrantyExpiration, "dd/MM/yyyy")})`,
          margin + 3,
          yPos
        );
        doc.setTextColor(0, 0, 0);
      }
      yPos += 5;
    } else if (receivable.warranty === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Garantia: Sem garantia", margin + 3, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    // Observações
    if (receivable.notes) {
      checkPageBreak(15);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Obs: ${receivable.notes}`, margin + 3, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 3;

    // Linha separadora entre produtos
    if (index < receivables.length - 1) {
      checkPageBreak(5);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 3, yPos, pageWidth - margin - 3, yPos);
      yPos += 6;
    }
  });

  // ===== RODAPÉ =====
  const footerText = `Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

  // Salvar PDF
  const fileName = `extrato_${customer.code}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  doc.save(fileName);
}
