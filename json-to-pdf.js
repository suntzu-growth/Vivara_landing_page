const fs = require('fs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default; // Use .default for jspdf-autotable in Node

async function generatePDF() {
    console.log("📄 Iniciando conversión de JSON a PDF...");

    // 1. Leer el archivo JSON
    const dataPath = './data/scraping/noticias-completas.json';
    if (!fs.existsSync(dataPath)) {
        console.error("❌ No se encontró el archivo JSON. Ejecuta primero el scraper.");
        return;
    }

    try {
        const rawData = fs.readFileSync(dataPath);
        const jsonData = JSON.parse(rawData);
        const articles = jsonData.articles;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- PORTADA ---
        doc.setFontSize(22);
        doc.text("Reporte de Propiedades Vivla", pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`Fecha de extracción: ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: 'center' });
        doc.text(`Total de artículos: ${articles.length}`, pageWidth / 2, 60, { align: 'center' });

        // --- TABLA DE CONTENIDOS (RESUMEN) ---
        const tableData = articles.map((a, index) => [
            index + 1,
            a.title.substring(0, 80) + (a.title.length > 80 ? '...' : ''),
            a.source.toUpperCase(),
            a.category
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['#', 'Título', 'Fuente', 'Categoría']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        // --- CONTENIDO DETALLADO ---
        articles.forEach((article, index) => {
            doc.addPage();

            // Título del artículo
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            const splitTitle = doc.splitTextToSize(article.title, pageWidth - 40);
            doc.text(splitTitle, 20, 30);

            // Metadata
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185); // Blue for labels

            let metaY = 50;

            // Fuente y Categoría
            doc.text(`FUENTE:`, 20, metaY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.text(`${article.source.toUpperCase()} | ${article.category}`, 40, metaY);

            metaY += 7;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text(`URL:`, 20, metaY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.setFontSize(8);
            doc.text(article.url, 40, metaY);

            metaY += 6;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text(`IMÁGENES:`, 20, metaY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.setFontSize(8);

            const displayImages = article.images && article.images.length > 0
                ? article.images
                : (article.image ? [article.image] : ["No disponible"]);

            displayImages.forEach((img, imgIndex) => {
                doc.text(`- ${img}`, 40, metaY + (imgIndex * 4));
            });

            doc.setFontSize(10);
            metaY += (displayImages.length * 4) + 5;

            // Resumen
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);
            doc.text("Resumen:", 20, metaY);
            doc.setFont("helvetica", "normal");
            const splitSummary = doc.splitTextToSize(article.summary || "", pageWidth - 40);
            doc.text(splitSummary, 20, metaY + 5);

            // Contenido
            doc.setFontSize(11);
            let currentY = metaY + 10 + (splitSummary.length * 5) + 10;
            doc.setFont("helvetica", "bold");
            doc.text("Cuerpo de la noticia:", 20, currentY - 5);
            doc.setFont("helvetica", "normal");

            const content = article.content || article.summary || "Sin contenido disponible.";
            const splitContent = doc.splitTextToSize(content, pageWidth - 40);

            // Manejo simple de paginación
            doc.text(splitContent, 20, currentY);
        });

        // Guardar el PDF
        const outputPath = './data/scraping/reporte-vivla.pdf';
        doc.save(outputPath);

        console.log(`✅ PDF generado con éxito en: ${outputPath}`);
    } catch (error) {
        console.error("❌ Error generando PDF:", error.message);
    }
}

generatePDF();
