import javax.print.*;
import javax.print.attribute.*;
import javax.print.attribute.standard.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class FinalPrinterService {
    
    private static final String PRINTER_NAME = "POS-80C";
    private static final int MAX_WIDTH = 48;
    private static final int PORT = 3002;
    private static boolean isDevelopment = true;
    
    public static void main(String[] args) {
        // Verificar argumentos para modo producción
        for (String arg : args) {
            if (arg.equals("--production")) {
                isDevelopment = false;
                break;
            }
        }
        
        System.out.println("APLICACION JAVA FINAL - SERVICIO DE IMPRESION");
        System.out.println("=".repeat(60));
        System.out.println("Impresora: " + PRINTER_NAME);
        System.out.println("Ancho: " + MAX_WIDTH + " caracteres (80mm)");
        System.out.println("Modo: " + (isDevelopment ? "DESARROLLO" : "PRODUCCION"));
        System.out.println("Puerto: " + PORT);
        System.out.println();
        
        // Primero probar que la impresión funciona
        System.out.println("PROBANDO IMPRESION DIRECTA...");
        String testContent = generateTestTicket();
        boolean printTest = printToThermalPrinter(testContent);
        
        if (!printTest) {
            System.out.println("ADVERTENCIA: La impresora puede estar ocupada, continuando...");
            // No retornar, continuar con el servidor
        }
        
        System.out.println("IMPRESION FUNCIONA CORRECTAMENTE");
        System.out.println("INICIANDO SERVIDOR HTTP...");
        System.out.println();
        
        // Iniciar servidor HTTP
        startServer();
    }
    
    private static void startServer() {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("Servidor iniciado en puerto " + PORT);
            System.out.println("Esperando conexiones...");
            System.out.println();
            
            while (true) {
                Socket clientSocket = serverSocket.accept();
                
                if (isDevelopment) {
                    System.out.println("Conexion recibida desde: " + clientSocket.getInetAddress());
                }
                
                // Manejar la conexión en un hilo separado
                new Thread(() -> handleClient(clientSocket)).start();
            }
            
        } catch (Exception e) {
            System.err.println("Error al iniciar servidor: " + e.getMessage());
        }
    }
    
    private static void handleClient(Socket clientSocket) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
             PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {
            
            // Leer la primera línea para determinar el método HTTP
            String firstLine = in.readLine();
            if (firstLine == null) {
                return;
            }
            
            String[] parts = firstLine.split(" ");
            String method = parts[0];
            
            if (isDevelopment) {
                System.out.println("Método HTTP: " + method);
            }
            
            // Manejar petición OPTIONS (CORS preflight)
            if ("OPTIONS".equals(method)) {
                String corsResponse = "HTTP/1.1 200 OK\r\n" +
                                    "Access-Control-Allow-Origin: *\r\n" +
                                    "Access-Control-Allow-Methods: POST, OPTIONS\r\n" +
                                    "Access-Control-Allow-Headers: Content-Type\r\n" +
                                    "Content-Length: 0\r\n" +
                                    "\r\n";
                out.print(corsResponse);
                out.flush();
                return;
            }
            
            // Para peticiones POST, leer headers y cuerpo
            if ("POST".equals(method)) {
                // Leer headers HTTP
                String line;
                int contentLength = 0;
                
                while ((line = in.readLine()) != null && !line.isEmpty()) {
                    if (line.toLowerCase().startsWith("content-length:")) {
                        contentLength = Integer.parseInt(line.substring(15).trim());
                    }
                }
                
                // Leer cuerpo JSON
                StringBuilder jsonData = new StringBuilder();
                if (contentLength > 0) {
                    char[] buffer = new char[contentLength];
                    int bytesRead = in.read(buffer, 0, contentLength);
                    if (bytesRead > 0) {
                        jsonData.append(buffer, 0, bytesRead);
                    }
                }
                
                if (isDevelopment) {
                    System.out.println("Datos recibidos: " + jsonData.toString().substring(0, Math.min(100, jsonData.length())) + "...");
                }
                
                // Procesar e imprimir
                PrintResult result = processAndPrint(jsonData.toString());
                
                // Enviar respuesta HTTP
                String response = "HTTP/1.1 200 OK\r\n" +
                                "Content-Type: application/json\r\n" +
                                "Access-Control-Allow-Origin: *\r\n" +
                                "Access-Control-Allow-Methods: POST, OPTIONS\r\n" +
                                "Access-Control-Allow-Headers: Content-Type\r\n" +
                                "\r\n" +
                                "{\"success\":" + result.success + 
                                ",\"message\":\"" + result.message + "\"" +
                                ",\"method\":\"" + result.method + "\"}";
                
                out.print(response);
                out.flush();
                
                if (isDevelopment) {
                    if (result.success) {
                        System.out.println("Impresion exitosa - Metodo: " + result.method);
                    } else {
                        System.out.println("Error en impresion: " + result.message);
                    }
                }
            } else {
                // Método no soportado
                String errorResponse = "HTTP/1.1 405 Method Not Allowed\r\n" +
                                     "Content-Type: application/json\r\n" +
                                     "Access-Control-Allow-Origin: *\r\n" +
                                     "\r\n" +
                                     "{\"success\":false,\"message\":\"Método no soportado\",\"method\":\"error\"}";
                out.print(errorResponse);
                out.flush();
            }
            
        } catch (Exception e) {
            System.err.println("Error en conexion: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (IOException e) {
                // Ignorar
            }
        }
    }
    
    private static PrintResult processAndPrint(String jsonData) {
        try {
            // Parsear JSON simple
            TicketData ticketData = parseJson(jsonData);
            
            if (isDevelopment) {
                System.out.println("Generando contenido del ticket...");
            }
            
            // Generar contenido del ticket
            String ticketContent = generateTicket(ticketData);
            
            if (isDevelopment) {
                System.out.println("CONTENIDO DEL TICKET:");
                System.out.println("-".repeat(50));
                System.out.println(ticketContent);
                System.out.println("-".repeat(50));
            }
            
            // Intentar imprimir
            return printToThermalPrinterResult(ticketContent);
            
        } catch (Exception e) {
            System.err.println("Error al procesar datos: " + e.getMessage());
            return new PrintResult(false, "Error al procesar datos: " + e.getMessage(), "error");
        }
    }
    
    private static String generateTestTicket() {
        StringBuilder ticket = new StringBuilder();
        
        // Encabezado
        ticket.append(centerText("RESTAURANTE EL BUENO")).append("\n");
        ticket.append("=".repeat(MAX_WIDTH)).append("\n");
        
        // Información del pedido
        ticket.append("MESA: MESA-TEST").append("\n");
        ticket.append("CLIENTE: PRUEBA").append("\n");
        ticket.append("FECHA: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Items
        ticket.append("1x Producto de Prueba").append("\n");
        ticket.append("   10.00 EUR x 1 = 10.00 EUR").append("\n");
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Total
        ticket.append(centerText("TOTAL: 10.00 EUR")).append("\n");
        ticket.append("\n");
        ticket.append(centerText("!GRACIAS!")).append("\n");
        
        // Agregar más líneas en blanco para espacio antes del corte
        ticket.append("\n\n\n\n\n");
        
        return ticket.toString();
    }
    
    private static TicketData parseJson(String json) {
        // Parseo simple de JSON
        TicketData data = new TicketData();
        
        // Extraer valores básicos
        if (json.contains("\"tableNumber\":")) {
            data.tableNumber = extractValue(json, "tableNumber");
        }
        if (json.contains("\"customerName\":")) {
            data.customerName = extractValue(json, "customerName");
        }
        if (json.contains("\"restaurantName\":")) {
            data.restaurantName = extractValue(json, "restaurantName");
        }
        
        // Parsear items del JSON
        data.items = parseItems(json);
        
        return data;
    }
    
    private static PrintItem[] parseItems(String json) {
        // Contar cuántos items hay
        int itemCount = 0;
        int pos = 0;
        while ((pos = json.indexOf("\"quantity\":", pos)) != -1) {
            itemCount++;
            pos++;
        }
        
        if (itemCount == 0) {
            // Si no hay items, crear uno por defecto
            PrintItem[] defaultItems = new PrintItem[1];
            defaultItems[0] = new PrintItem();
            defaultItems[0].quantity = 1;
            defaultItems[0].productName = "Producto por defecto";
            defaultItems[0].unitPrice = 0.0;
            defaultItems[0].totalPrice = 0.0;
            return defaultItems;
        }
        
        PrintItem[] items = new PrintItem[itemCount];
        
        // Parsear cada item
        int currentItem = 0;
        int startPos = json.indexOf("\"items\":[");
        if (startPos == -1) {
            // Fallback si no encuentra el array de items
            items[0] = new PrintItem();
            items[0].quantity = 1;
            items[0].productName = "Producto por defecto";
            items[0].unitPrice = 0.0;
            items[0].totalPrice = 0.0;
            return items;
        }
        
        startPos = json.indexOf("{", startPos);
        while (startPos != -1 && currentItem < itemCount) {
            int endPos = json.indexOf("}", startPos);
            if (endPos == -1) break;
            
            String itemJson = json.substring(startPos, endPos + 1);
            
            items[currentItem] = new PrintItem();
            items[currentItem].quantity = Integer.parseInt(extractNumericValue(itemJson, "quantity"));
            items[currentItem].productName = extractValue(itemJson, "productName");
            items[currentItem].unitPrice = Double.parseDouble(extractNumericValue(itemJson, "unitPrice"));
            items[currentItem].totalPrice = Double.parseDouble(extractNumericValue(itemJson, "totalPrice"));
            
            currentItem++;
            startPos = json.indexOf("{", endPos + 1);
        }
        
        return items;
    }
    
    private static String extractNumericValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int start = json.indexOf(searchKey);
        if (start == -1) return "0";
        
        start += searchKey.length();
        // Buscar el siguiente valor numérico
        while (start < json.length() && !Character.isDigit(json.charAt(start)) && json.charAt(start) != '-') {
            start++;
        }
        
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) {
            end++;
        }
        
        return json.substring(start, end);
    }
    
    private static String extractValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int start = json.indexOf(searchKey);
        if (start == -1) return "N/A";
        
        start += searchKey.length();
        int end = json.indexOf("\"", start + 1);
        if (end == -1) return "N/A";
        
        return json.substring(start + 1, end);
    }
    
    private static String generateTicket(TicketData data) {
        StringBuilder ticket = new StringBuilder();
        
        // Encabezado
        String restaurantName = data.restaurantName != null ? data.restaurantName : "RESTAURANTE EL BUENO";
        ticket.append(centerText(restaurantName)).append("\n");
        ticket.append("=".repeat(MAX_WIDTH)).append("\n");
        
        // Información del pedido
        ticket.append("MESA: ").append(data.tableNumber != null ? data.tableNumber : "N/A").append("\n");
        ticket.append("CLIENTE: ").append(data.customerName != null ? data.customerName : "N/A").append("\n");
        ticket.append("FECHA: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Items
        double total = 0;
        for (PrintItem item : data.items) {
            ticket.append(item.quantity).append("x ").append(item.productName).append("\n");
            ticket.append("   ").append(String.format("%.2f", item.unitPrice)).append(" EUR x ").append(item.quantity).append(" = ").append(String.format("%.2f", item.totalPrice)).append(" EUR\n");
            total += item.totalPrice;
        }
        ticket.append("-".repeat(MAX_WIDTH)).append("\n");
        
        // Total
        ticket.append(centerText("TOTAL: " + String.format("%.2f", total) + " EUR")).append("\n");
        ticket.append("\n");
        ticket.append(centerText("!GRACIAS!")).append("\n");
        
        // Agregar más líneas en blanco para espacio antes del corte
        ticket.append("\n\n\n\n\n");
        
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
            
            for (PrintService service : services) {
                if (service.getName().equalsIgnoreCase(PRINTER_NAME)) {
                    thermalPrinter = service;
                    break;
                }
            }
            
            if (thermalPrinter == null) {
                System.out.println("Impresora " + PRINTER_NAME + " no encontrada");
                return false;
            }
            
            System.out.println("Impresora encontrada: " + thermalPrinter.getName());
            
            // Crear el trabajo de impresión
            DocPrintJob job = thermalPrinter.createPrintJob();
            
            // Configurar atributos de impresión
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(MediaSizeName.ISO_A4);
            attributes.add(OrientationRequested.PORTRAIT);
            
            // Crear el documento solo con el contenido del ticket
            // Usar ISO-8859-1 para mejor compatibilidad con impresoras térmicas
            byte[] contentBytes = content.getBytes("ISO-8859-1");
            Doc doc = new SimpleDoc(contentBytes, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
            
            System.out.println("Enviando a impresora...");
            
            // Imprimir el contenido
            job.print(doc, attributes);
            
            // Esperar un poco para que termine la impresión
            Thread.sleep(2000);
            
            // Ahora enviar comandos de corte por separado
            try {
                // Crear un nuevo trabajo de impresión para el corte
                DocPrintJob cutJob = thermalPrinter.createPrintJob();
                
                // Comandos ESC/POS para cortar el ticket
                byte[] cutCommands = new byte[] {
                    (byte) 27, (byte) '@',  // ESC @ - Inicializar impresora
                    (byte) 29, (byte) 'V', (byte) 0  // GS V 0 - Cortar papel
                };
                
                Doc cutDoc = new SimpleDoc(cutCommands, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
                cutJob.print(cutDoc, attributes);
                
                System.out.println("Comando de corte enviado");
            } catch (Exception e) {
                // Si falla el corte, no es crítico
                System.out.println("Advertencia: No se pudo cortar el ticket: " + e.getMessage());
            }
            
            System.out.println("Trabajo de impresion enviado");
            return true;
            
        } catch (Exception e) {
            System.err.println("Error al imprimir: " + e.getMessage());
            return false;
        }
    }
    
    private static PrintResult printToThermalPrinterResult(String content) {
        boolean success = printToThermalPrinter(content);
        if (success) {
            return new PrintResult(true, "Ticket impreso y cortado correctamente", "java-print");
        } else {
            return new PrintResult(false, "Error al imprimir", "error");
        }
    }
    
    // Clases de datos
    static class TicketData {
        String tableNumber;
        String customerName;
        String restaurantName;
        PrintItem[] items;
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
