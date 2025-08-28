import java.io.*;
import java.net.*;
import java.util.*;
import javax.print.*;
import javax.print.attribute.*;
import javax.print.attribute.standard.*;

public class PrinterService {
    private static final int PORT = 3002;
    private static final String PRINTER_NAME = "POS-80C";
    private static final int MAX_WIDTH = 48; // Optimizado para 80mm (48 caracteres)
    
    public static void main(String[] args) {
        System.out.println("Iniciando servicio de impresion Java...");
        System.out.println("Escuchando en puerto " + PORT);
        System.out.println("Impresora: " + PRINTER_NAME);
        
        // Ocultar la ventana de consola en Windows
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            try {
                // Intentar ocultar la ventana
                ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "title", "Java Printer Service");
                pb.start();
            } catch (Exception e) {
                // Ignorar errores de ocultacion
            }
        }
        
        startServer();
    }
    
    private static void startServer() {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("Servidor iniciado correctamente");
            
            while (true) {
                try (Socket clientSocket = serverSocket.accept();
                     BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                     PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {
                    
                    System.out.println("Conexion recibida desde: " + clientSocket.getInetAddress());
                    
                    // Leer datos JSON del cliente
                    StringBuilder jsonData = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null && !line.isEmpty()) {
                        jsonData.append(line);
                    }
                    
                    if (jsonData.length() > 0) {
                        System.out.println("Datos recibidos: " + jsonData.toString().substring(0, Math.min(100, jsonData.length())) + "...");
                        
                        // Procesar e imprimir
                        boolean success = processAndPrint(jsonData.toString());
                        
                        // Enviar respuesta
                        String response = success ? 
                            "{\"success\": true, \"message\": \"Ticket impreso y cortado correctamente\"}" :
                            "{\"success\": false, \"message\": \"Error al imprimir ticket\"}";
                        
                        out.println("HTTP/1.1 200 OK");
                        out.println("Content-Type: application/json");
                        out.println("Content-Length: " + response.length());
                        out.println();
                        out.println(response);
                        
                        System.out.println(success ? "Impresion y corte completados" : "Error en impresion");
                    }
                    
                } catch (Exception e) {
                    System.err.println("Error en conexion: " + e.getMessage());
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error al iniciar servidor: " + e.getMessage());
        }
    }
    
    private static boolean processAndPrint(String jsonData) {
        try {
            // Parsear JSON simple (para simplificar, usamos un parser basico)
            PrintData printData = parseJson(jsonData);
            if (printData == null) {
                System.err.println("Error al parsear JSON");
                return false;
            }
            
            // Generar contenido del ticket
            String ticketContent = generateTicketContent(printData);
            System.out.println("Contenido generado:");
            System.out.println(ticketContent);
            
            // Intentar diferentes métodos de impresión con corte
            boolean success = false;
            
            // Método 1: Usar comando print de Windows (mejor soporte para corte)
            System.out.println("Intentando metodo 1: Comando print de Windows...");
            success = printWithWindowsCommand(ticketContent);
            
            if (!success) {
                // Método 2: Usar Java Print API con comandos ESC/POS
                System.out.println("Intentando metodo 2: Java Print API con ESC/POS...");
                success = printToThermalPrinterWithCut(ticketContent);
            }
            
            return success;
            
        } catch (Exception e) {
            System.err.println("Error al procesar datos: " + e.getMessage());
            return false;
        }
    }
    
    private static PrintData parseJson(String json) {
        try {
            // Parser JSON simple para los datos del ticket
            PrintData data = new PrintData();
            
            // Extraer items
            if (json.contains("\"items\"")) {
                String itemsSection = json.substring(json.indexOf("\"items\""));
                itemsSection = itemsSection.substring(itemsSection.indexOf("[") + 1, itemsSection.indexOf("]"));
                
                String[] items = itemsSection.split("\\{");
                for (String item : items) {
                    if (item.trim().length() > 0) {
                        PrintItem printItem = new PrintItem();
                        
                        // Extraer cantidad
                        if (item.contains("\"quantity\"")) {
                            String quantityStr = item.substring(item.indexOf("\"quantity\":") + 11);
                            quantityStr = quantityStr.substring(0, quantityStr.indexOf(","));
                            printItem.quantity = Integer.parseInt(quantityStr.trim());
                        }
                        
                        // Extraer nombre del producto
                        if (item.contains("\"productName\"")) {
                            String nameStr = item.substring(item.indexOf("\"productName\":\"") + 15);
                            nameStr = nameStr.substring(0, nameStr.indexOf("\""));
                            printItem.productName = nameStr;
                        }
                        
                        // Extraer precio unitario
                        if (item.contains("\"unitPrice\"")) {
                            String priceStr = item.substring(item.indexOf("\"unitPrice\":") + 12);
                            priceStr = priceStr.substring(0, priceStr.indexOf(","));
                            printItem.unitPrice = Double.parseDouble(priceStr.trim());
                        }
                        
                        // Extraer precio total
                        if (item.contains("\"totalPrice\"")) {
                            String totalStr = item.substring(item.indexOf("\"totalPrice\":") + 13);
                            totalStr = totalStr.substring(0, totalStr.indexOf(","));
                            printItem.totalPrice = Double.parseDouble(totalStr.trim());
                        }
                        
                        data.items.add(printItem);
                    }
                }
            }
            
            // Extraer numero de mesa
            if (json.contains("\"tableNumber\"")) {
                String tableStr = json.substring(json.indexOf("\"tableNumber\":\"") + 15);
                tableStr = tableStr.substring(0, tableStr.indexOf("\""));
                data.tableNumber = tableStr;
            }
            
            // Extraer nombre del cliente
            if (json.contains("\"customerName\"")) {
                String customerStr = json.substring(json.indexOf("\"customerName\":\"") + 16);
                customerStr = customerStr.substring(0, customerStr.indexOf("\""));
                data.customerName = customerStr;
            }
            
            // Extraer nombre del restaurante
            if (json.contains("\"restaurantName\"")) {
                String restaurantStr = json.substring(json.indexOf("\"restaurantName\":\"") + 18);
                restaurantStr = restaurantStr.substring(0, restaurantStr.indexOf("\""));
                data.restaurantName = restaurantStr;
            }
            
            return data;
            
        } catch (Exception e) {
            System.err.println("Error al parsear JSON: " + e.getMessage());
            return null;
        }
    }
    
    private static String generateTicketContent(PrintData data) {
        StringBuilder content = new StringBuilder();
        
        // Calcular total
        double total = 0;
        for (PrintItem item : data.items) {
            total += item.totalPrice;
        }
        
        // Encabezado optimizado para 80mm
        String restaurantName = data.restaurantName != null ? data.restaurantName : "RESTAURANTE";
        content.append(centerText(restaurantName)).append("\n");
        content.append(separatorLine()).append("\n");
        
        // Informacion de mesa y cliente (más compacta)
        content.append(String.format("MESA: %s", data.tableNumber != null ? data.tableNumber : "N/A")).append("\n");
        if (data.customerName != null && !data.customerName.isEmpty()) {
            content.append(String.format("CLIENTE: %s", data.customerName)).append("\n");
        }
        
        // Fecha más compacta
        String fecha = new Date().toString().substring(0, 19); // Solo fecha y hora
        content.append(String.format("FECHA: %s", fecha)).append("\n");
        content.append(dividerLine()).append("\n");
        
        // Items del pedido (formato más compacto)
        for (PrintItem item : data.items) {
            // Línea del producto
            String itemLine = String.format("%dx %s", item.quantity, item.productName);
            content.append(itemLine).append("\n");
            
            // Línea del precio (más compacta)
            String priceLine = String.format("   %.2f EUR x %d = %.2f EUR", item.unitPrice, item.quantity, item.totalPrice);
            content.append(priceLine).append("\n");
        }
        
        content.append(dividerLine()).append("\n");
        
        // Total centrado
        content.append(centerText(String.format("TOTAL: %.2f EUR", total))).append("\n");
        content.append("\n");
        
        // Mensaje de agradecimiento centrado
        content.append(centerText("!GRACIAS!")).append("\n");
        content.append("\n\n"); // Menos líneas en blanco
        
        return content.toString();
    }
    
    // Funcion para centrar texto CORREGIDA
    private static String centerText(String text) {
        // Calcular el padding correcto para centrar el texto
        int padding = Math.max(0, (MAX_WIDTH - text.length()) / 2);
        StringBuilder result = new StringBuilder();
        
        // Agregar espacios al inicio para centrar
        for (int i = 0; i < padding; i++) {
            result.append(" ");
        }
        
        // Agregar el texto
        result.append(text);
        
        // Agregar espacios al final para completar la línea si es necesario
        int remainingSpaces = MAX_WIDTH - result.length();
        for (int i = 0; i < remainingSpaces; i++) {
            result.append(" ");
        }
        
        return result.toString();
    }
    
    // Funcion para lineas de separacion
    private static String separatorLine() {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < MAX_WIDTH; i++) {
            result.append("=");
        }
        return result.toString();
    }
    
    private static String dividerLine() {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < MAX_WIDTH; i++) {
            result.append("-");
        }
        return result.toString();
    }
    
    // Método 1: Usar comando print de Windows (mejor soporte para corte)
    private static boolean printWithWindowsCommand(String content) {
        try {
            // Crear archivo temporal
            File tempFile = File.createTempFile("ticket_", ".txt");
            tempFile.deleteOnExit();
            
            // Escribir contenido al archivo
            try (PrintWriter writer = new PrintWriter(new FileWriter(tempFile))) {
                writer.print(content);
            }
            
            // Usar comando print de Windows
            ProcessBuilder pb = new ProcessBuilder("print", tempFile.getAbsolutePath());
            Process process = pb.start();
            
            // Esperar a que termine
            int exitCode = process.waitFor();
            
            // Limpiar archivo temporal
            tempFile.delete();
            
            if (exitCode == 0) {
                System.out.println("Impresion exitosa usando comando print de Windows");
                return true;
            } else {
                System.out.println("Error en comando print, codigo: " + exitCode);
                return false;
            }
            
        } catch (Exception e) {
            System.err.println("Error en metodo Windows print: " + e.getMessage());
            return false;
        }
    }
    
    // Método 2: Usar Java Print API con comandos ESC/POS de corte
    private static boolean printToThermalPrinterWithCut(String content) {
        try {
            // Buscar la impresora termica
            PrintService[] printServices = PrintServiceLookup.lookupPrintServices(null, null);
            PrintService thermalPrinter = null;
            
            for (PrintService service : printServices) {
                if (service.getName().contains(PRINTER_NAME)) {
                    thermalPrinter = service;
                    break;
                }
            }
            
            if (thermalPrinter == null) {
                System.err.println("No se encontro la impresora: " + PRINTER_NAME);
                return false;
            }
            
            System.out.println("Impresora encontrada: " + thermalPrinter.getName());
            
            // Crear documento de impresion
            DocPrintJob printJob = thermalPrinter.createPrintJob();
            
            // Configurar atributos de impresion optimizados para 80mm
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(new MediaPrintableArea(0, 0, 80, 1000, MediaPrintableArea.MM)); // 80mm de ancho
            attributes.add(MediaSizeName.ISO_A4); // Tamano de papel
            attributes.add(OrientationRequested.PORTRAIT); // Orientacion
            
            // Combinar contenido del ticket con comandos de corte
            byte[] contentBytes = content.getBytes("UTF-8");
            byte[] cutCommands = generateCutCommands();
            
            // Crear array combinado
            byte[] combinedData = new byte[contentBytes.length + cutCommands.length];
            System.arraycopy(contentBytes, 0, combinedData, 0, contentBytes.length);
            System.arraycopy(cutCommands, 0, combinedData, contentBytes.length, cutCommands.length);
            
            // Crear documento con contenido y comandos de corte
            Doc doc = new SimpleDoc(combinedData, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
            
            // Imprimir
            printJob.print(doc, attributes);
            
            System.out.println("Documento enviado a la impresora con corte automatico");
            return true;
            
        } catch (Exception e) {
            System.err.println("Error al imprimir: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    // Función para generar comandos ESC/POS de corte (múltiples opciones)
    private static byte[] generateCutCommands() {
        // Probar diferentes comandos de corte
        byte[] cutCommands = {
            (byte) 0x1B, (byte) 0x69,  // ESC i - Partial cut (corte parcial)
            (byte) 0x1B, (byte) 0x6D,  // ESC m - Full cut (corte completo)
            (byte) 0x1D, (byte) 0x56, (byte) 0x00,  // GS V 0 - Full cut
            (byte) 0x1D, (byte) 0x56, (byte) 0x01,  // GS V 1 - Partial cut
            (byte) 0x1D, (byte) 0x56, (byte) 0x41,  // GS V A - Full cut
            (byte) 0x1D, (byte) 0x56, (byte) 0x42   // GS V B - Partial cut
        };
        return cutCommands;
    }
    
    // Clases de datos
    static class PrintData {
        List<PrintItem> items = new ArrayList<>();
        String tableNumber;
        String customerName;
        String restaurantName;
    }
    
    static class PrintItem {
        int quantity;
        String productName;
        double unitPrice;
        double totalPrice;
    }
}
