import javax.print.*;
import javax.print.attribute.*;
import javax.print.attribute.standard.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class SimplePrinter {
    
    private static final String PRINTER_NAME = "POS-80C";
    private static final int MAX_WIDTH = 48;
    
    public static void main(String[] args) {
        System.out.println("APLICACION JAVA SIMPLE - IMPRESORA POS-80C");
        System.out.println("=".repeat(60));
        System.out.println();
        
        // Generar contenido de prueba
        String ticketContent = generateTestTicket();
        
        System.out.println("📄 CONTENIDO DEL TICKET:");
        System.out.println("-".repeat(50));
        System.out.println(ticketContent);
        System.out.println("-".repeat(50));
        System.out.println();
        
        // Intentar imprimir
        System.out.println("Intentando imprimir...");
        boolean success = printToThermalPrinter(ticketContent);
        
        if (success) {
            System.out.println("✅ ¡IMPRESIÓN EXITOSA!");
            System.out.println("💡 Verifica que se imprimió físicamente en la impresora POS-80C");
        } else {
            System.out.println("Error en la impresion");
            System.out.println("🔧 Verifica que la impresora esté conectada y encendida");
        }
        
        System.out.println();
        System.out.println("=".repeat(60));
        System.out.println("Aplicacion completada");
    }
    
    private static String generateTestTicket() {
        StringBuilder ticket = new StringBuilder();
        
        // Encabezado
        ticket.append(centerText("RESTAURANTE EL BUENO")).append("\n");
        ticket.append("=".repeat(MAX_WIDTH)).append("\n");
        
        // Información del pedido
        ticket.append("MESA: MESA-12").append("\n");
        ticket.append("CLIENTE: MARIA GARCIA").append("\n");
        ticket.append("FECHA: ").append(java.time.LocalDateTime.now().format(
            java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Items
        ticket.append("2x Hamburguesa Clásica").append("\n");
        ticket.append("   12.50 EUR x 2 = 25.00 EUR").append("\n");
        ticket.append("1x Coca Cola 330ml").append("\n");
        ticket.append("   2.50 EUR x 1 = 2.50 EUR").append("\n");
        ticket.append("1x Patatas Fritas").append("\n");
        ticket.append("   4.00 EUR x 1 = 4.00 EUR").append("\n");
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Total
        ticket.append(centerText("TOTAL: 31.50 EUR")).append("\n");
        ticket.append("\n");
        ticket.append(centerText("¡GRACIAS!")).append("\n");
        ticket.append("\n");
        
        return ticket.toString();
    }
    
    private static String centerText(String text) {
        int padding = (MAX_WIDTH - text.length()) / 2;
        return " ".repeat(Math.max(0, padding)) + text;
    }
    
    private static boolean printToThermalPrinter(String content) {
        try {
            // Buscar la impresora POS-80C
            PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
            PrintService thermalPrinter = null;
            
            System.out.println("Buscando impresora: " + PRINTER_NAME);
            for (PrintService service : services) {
                System.out.println("   - " + service.getName());
                if (service.getName().equalsIgnoreCase(PRINTER_NAME)) {
                    thermalPrinter = service;
                    break;
                }
            }
            
            if (thermalPrinter == null) {
                System.out.println("Impresora " + PRINTER_NAME + " no encontrada");
                System.out.println("📋 Impresoras disponibles:");
                for (PrintService service : services) {
                    System.out.println("   - " + service.getName());
                }
                return false;
            }
            
            System.out.println("✅ Impresora encontrada: " + thermalPrinter.getName());
            
            // Crear el trabajo de impresión
            DocPrintJob job = thermalPrinter.createPrintJob();
            
            // Configurar atributos de impresión
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(MediaSizeName.ISO_A4);
            attributes.add(OrientationRequested.PORTRAIT);
            
            // Crear el documento
            byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
            Doc doc = new SimpleDoc(contentBytes, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
            
            System.out.println("Enviando a impresora...");
            
            // Imprimir
            job.print(doc, attributes);
            
            System.out.println("✅ Trabajo de impresión enviado");
            return true;
            
        } catch (Exception e) {
            System.err.println("Error al imprimir: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
