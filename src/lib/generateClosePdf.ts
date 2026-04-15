import PDFDocument from "pdfkit";

interface CloseDocData {
  projectTitle: string;
  clientNames: string[];
  milestones: Array<{ name: string; date: string; completed: boolean }>;
  approvedArtifacts: string[];
  personalNote?: string;
}

export async function generateClosePdf(data: CloseDocData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 72,
      info: {
        Title: `Project Close: ${data.projectTitle}`,
        Author: "La Sprezzatura Interior Design",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(28).font("Helvetica").text("La Sprezzatura", { align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor("#8A8478")
      .text("Interior Design", { align: "center" });
    doc.moveDown(2);

    // Decorative line
    doc.strokeColor("#C4836A").lineWidth(1)
      .moveTo(72, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(1);

    // Project title
    doc.fontSize(20).font("Helvetica").fillColor("#2C2926")
      .text(`Project Close: ${data.projectTitle}`, { align: "left" });
    doc.moveDown(0.5);

    // Client names
    doc.fontSize(12).fillColor("#8A8478")
      .text(`Client: ${data.clientNames.join(", ")}`);
    doc.fontSize(10).fillColor("#8A8478")
      .text(`Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
    doc.moveDown(1.5);

    // Milestones section
    if (data.milestones.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#2C2926")
        .text("Milestones");
      doc.moveDown(0.5);

      data.milestones.forEach((m) => {
        const checkmark = m.completed ? "[x]" : "[ ]";
        const dateStr = m.date ? new Date(m.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date";
        doc.fontSize(10).font("Helvetica").fillColor("#2C2926")
          .text(`${checkmark} ${m.name} -- ${dateStr}`);
      });
      doc.moveDown(1);
    }

    // Approved artifacts
    if (data.approvedArtifacts.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#2C2926")
        .text("Approved Documents");
      doc.moveDown(0.5);

      data.approvedArtifacts.forEach((name) => {
        doc.fontSize(10).font("Helvetica").fillColor("#2C2926")
          .text(`- ${name}`);
      });
      doc.moveDown(1);
    }

    // Personal note
    if (data.personalNote) {
      doc.moveDown(0.5);
      doc.strokeColor("#C4836A").lineWidth(0.5)
        .moveTo(72, doc.y).lineTo(540, doc.y).stroke();
      doc.moveDown(1);
      doc.fontSize(11).font("Helvetica-Oblique").fillColor("#8A8478")
        .text(data.personalNote, { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("#8A8478")
        .text("-- Elizabeth, La Sprezzatura");
    }

    // Footer
    doc.moveDown(2);
    doc.strokeColor("#E8E3DD").lineWidth(0.5)
      .moveTo(72, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica").fillColor("#B8B0A4")
      .text("La Sprezzatura Interior Design -- Long Island & New York City", { align: "center" });

    doc.end();
  });
}

export type { CloseDocData };
