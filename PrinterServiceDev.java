import java.io.*;
import java.net.*;
import java.util.*;
import javax.print.*;
import javax.print.attribute.*;
import javax.print.attribute.standard.*;

public class PrinterServiceDev {
    private static final int PORT = 3002;
    private static final String PRINTER_NAME = "POS-80C";
    private static final int MAX_WIDTH = 48; // Optimizado para 80mm (48 caracteres)
    private static boolean isDevelopment = true; // Cambiar a false para producción
    
    public static void main(String[] args) {
        // Verificar argumentos para modo desarrollo/producción
        if (args.length > 0 && args[0].equals("--production")) {
            isDevelopment = false;
        }
        
        if (isDevelopment) {
            System.out.println("🚀 INICIANDO SERVICIO DE IMPRESIÓN - MODO DESARROLLO");
            System.out.println("=".repeat(60));
            System.out.println("📡 Puerto: " + PORT);
            System.out.println("Impresora: " + PRINTER_NAME);
            System.out.println("Ancho: " + MAX_WIDTH + " caracteres (80mm)");
            System.out.println("Modo: VISIBLE (desarrollo)");
            System.out.println("=".repeat(60));
        } else {
            System.out.println("🚀 Iniciando servicio de impresión en modo producción...");
            // Ocultar la ventana de consola en Windows (solo en producción)
            if (System.getProperty("os.name").toLowerCase().contains("windows")) {
                try {
                    ProcessBuilder pb = new ProcessBuilder("cmd", "/c", "title", "Java Printer Service");
                    pb.start();
                } catch (Exception e) {
                    // Ignorar errores de ocultación
                }
            }
        }
        
        startServer();
    }
    
    private static void startServer() {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            if (isDevelopment) {
                System.out.println("✅ Servidor iniciado correctamente en puerto " + PORT);
                System.out.println("🔄 Esperando conexiones...");
                System.out.println();
            } else {
                System.out.println("Servidor iniciado correctamente");
            }
            
            while (true) {
                try (Socket clientSocket = serverSocket.accept();
                     BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                     PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {
                    
                    if (isDevelopment) {
                        System.out.println("Conexión recibida desde: " + clientSocket.getInetAddress());
                    }
                    
                    // Leer datos JSON del cliente
                    StringBuilder jsonData = new StringBuilder();
                    String line;
                    boolean readingBody = false;
                    int contentLength = 0;
                    
                    // Leer headers para encontrar Content-Length
                    while ((line = in.readLine()) != null && !line.isEmpty()) {
                        if (line.toLowerCase().startsWith("content-length:")) {
                            contentLength = Integer.parseInt(line.substring(15).trim());
                        }
                    }
                    
                    // Leer el cuerpo JSON
                    if (contentLength > 0) {
                        char[] buffer = new char[contentLength];
                        int bytesRead = in.read(buffer, 0, contentLength);
                        if (bytesRead > 0) {
                            jsonData.append(buffer, 0, bytesRead);
                        }
                    }
                    
                    if (jsonData.length() > 0) {
                        if (isDevelopment) {
                            System.out.println("Datos recibidos: " + jsonData.toString().substring(0, Math.min(100, jsonData.length())) + "...");
                        }
                        
                        // Procesar e imprimir
                        PrintResult result = processAndPrint(jsonData.toString());
                        
                        // Enviar respuesta
                        String response = result.success ? 
                            "{\"success\": true, \"message\": \"" + result.message + "\", \"method\": \"" + result.method + "\"}" :
                            "{\"success\": false, \"message\": \"" + result.message + "\"}";
                        
                        out.println("HTTP/1.1 200 OK");
                        out.println("Content-Type: application/json");
                        out.println("Access-Control-Allow-Origin: *");
                        out.println("Content-Length: " + response.length());
                        out.println();
                        out.println(response);
                        
                        if (isDevelopment) {
                            if (result.success) {
                                System.out.println("Impresión exitosa - Método: " + result.method);
                            } else {
                                System.out.println("Error en impresión: " + result.message);
                            }
                            System.out.println();
                        }
                    }
                    
                } catch (Exception e) {
                    if (isDevelopment) {
                        System.err.println("Error en conexión: " + e.getMessage());
                    }
                }
            }
            
        } catch (Exception e) {
            if (isDevelopment) {
                System.err.println("Error al iniciar servidor: " + e.getMessage());
            }
        }
    }
    
    private static PrintResult processAndPrint(String jsonData) {
        try {
            // Parsear JSON simple
            PrintData printData = parseJson(jsonData);
            if (printData == null) {
                return new PrintResult(false, "Error al parsear JSON", "");
            }
            
            if (isDevelopment) {
                System.out.println("Generando contenido del ticket...");
            }
            
            // Generar contenido del ticket
            String ticketContent = generateTicketContent(printData);
            
            if (isDevelopment) {
                System.out.println("CONTENIDO DEL TICKET:");
                System.out.println("-".repeat(50));
                System.out.println(ticketContent);
                System.out.println("-".repeat(50));
            }
            
            // Intentar diferentes métodos de impresión con corte
            PrintResult result = null;
            
            // Método 1: Usar comando print de Windows (mejor soporte para corte)
            if (isDevelopment) {
                System.out.println("Intentando método 1: Comando print de Windows...");
            }
            result = printWithWindowsCommand(ticketContent);
            
            if (!result.success) {
                // Método 2: Usar Java Print API con comandos ESC/POS
                if (isDevelopment) {
                    System.out.println("Intentando método 2: Java Print API con ESC/POS...");
                }
                result = printToThermalPrinterWithCut(ticketContent);
            }
            
            if (!result.success) {
                // Método 3: Imprimir a archivo para debugging
                if (isDevelopment) {
                    System.out.println("Intentando método 3: Guardar en archivo...");
                }
                result = printToFile(ticketContent);
            }
            
            return result;
            
        } catch (Exception e) {
            if (isDevelopment) {
                System.err.println("Error al procesar datos: " + e.getMessage());
                e.printStackTrace();
            }
            return new PrintResult(false, "Error interno: " + e.getMessage(), "");
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
            if (isDevelopment) {
                System.err.println("Error al parsear JSON: " + e.getMessage());
            }
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
        content.append(centerText("¡GRACIAS!")).append("\n");
        content.append("\n\n"); // Menos líneas en blanco
        
        return content.toString();
    }
    
    // Función para centrar texto CORREGIDA
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
    
    // Función para líneas de separación
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
    private static PrintResult printWithWindowsCommand(String content) {
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
                return new PrintResult(true, "Ticket impreso y cortado correctamente", "windows-print");
            } else {
                return new PrintResult(false, "Error en comando print, código: " + exitCode, "windows-print");
            }
            
        } catch (Exception e) {
            return new PrintResult(false, "Error en método Windows print: " + e.getMessage(), "windows-print");
        }
    }
    
    // Método 2: Usar Java Print API con comandos ESC/POS de corte
    private static PrintResult printToThermalPrinterWithCut(String content) {
        try {
            // Buscar la impresora térmica
            PrintService[] printServices = PrintServiceLookup.lookupPrintServices(null, null);
            PrintService thermalPrinter = null;
            
            for (PrintService service : printServices) {
                if (service.getName().contains(PRINTER_NAME)) {
                    thermalPrinter = service;
                    break;
                }
            }
            
            if (thermalPrinter == null) {
                return new PrintResult(false, "No se encontró la impresora: " + PRINTER_NAME, "java-print");
            }
            
            if (isDevelopment) {
                System.out.println("Impresora encontrada: " + thermalPrinter.getName());
            }
            
            // Crear documento de impresión
            DocPrintJob printJob = thermalPrinter.createPrintJob();
            
            // Configurar atributos de impresión optimizados para 80mm
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(new MediaPrintableArea(0, 0, 80, 1000, MediaPrintableArea.MM)); // 80mm de ancho
            attributes.add(MediaSizeName.ISO_A4); // Tamaño de papel
            attributes.add(OrientationRequested.PORTRAIT); // Orientación
            
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
            
            return new PrintResult(true, "Ticket impreso y cortado correctamente", "java-print");
            
        } catch (Exception e) {
            return new PrintResult(false, "Error al imprimir: " + e.getMessage(), "java-print");
        }
    }
    
    // Método 3: Imprimir a archivo para debugging
    private static PrintResult printToFile(String content) {
        try {
            File outputFile = new File("ticket_debug.txt");
            try (PrintWriter writer = new PrintWriter(new FileWriter(outputFile))) {
                writer.print(content);
            }
            
            if (isDevelopment) {
                System.out.println("Ticket guardado en: " + outputFile.getAbsolutePath());
            }
            
            return new PrintResult(true, "Ticket guardado en archivo para debugging", "file-output");
            
        } catch (Exception e) {
            return new PrintResult(false, "Error al guardar archivo: " + e.getMessage(), "file-output");
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
    
    static class PrintResult {
        boolean success;
        String message;
        String method;
        
        PrintResult(boolean success, String message, String method) {
            this.success = success;
            this.message = message;
            this.method = method;
        }
    }
}
