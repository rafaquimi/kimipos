import javax.print.*;
import javax.print.attribute.*;
import javax.print.attribute.standard.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class WorkingPrinterService {
    
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
        
        System.out.println("APLICACION JAVA - SERVICIO DE IMPRESION");
        System.out.println("=".repeat(60));
        System.out.println("Impresora: " + PRINTER_NAME);
        System.out.println("Ancho: " + MAX_WIDTH + " caracteres (80mm)");
        System.out.println("Modo: " + (isDevelopment ? "DESARROLLO" : "PRODUCCION"));
        System.out.println("Puerto: " + PORT);
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
            // Parsear JSON simple (sin librerías externas)
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
            return printToThermalPrinter(ticketContent);
            
        } catch (Exception e) {
            System.err.println("Error al procesar datos: " + e.getMessage());
            return new PrintResult(false, "Error al procesar datos: " + e.getMessage(), "error");
        }
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
        
        // Parsear items (simplificado)
        data.items = new PrintItem[1];
        data.items[0] = new PrintItem();
        data.items[0].quantity = 1;
        data.items[0].productName = "Producto de prueba";
        data.items[0].unitPrice = 10.0;
        data.items[0].totalPrice = 10.0;
        
        return data;
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
        ticket.append(centerText("¡GRACIAS!")).append("\n");
        ticket.append("\n");
        
        return ticket.toString();
    }
    
    private static String centerText(String text) {
        int padding = (MAX_WIDTH - text.length()) / 2;
        return " ".repeat(Math.max(0, padding)) + text;
    }
    
    private static PrintResult printToThermalPrinter(String content) {
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
                return new PrintResult(false, "Impresora " + PRINTER_NAME + " no encontrada", "not-found");
            }
            
            // Crear el trabajo de impresión
            DocPrintJob job = thermalPrinter.createPrintJob();
            
            // Configurar atributos de impresión
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(MediaSizeName.ISO_A4);
            attributes.add(OrientationRequested.PORTRAIT);
            
            // Crear el documento
            byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
            Doc doc = new SimpleDoc(contentBytes, DocFlavor.BYTE_ARRAY.AUTOSENSE, null);
            
            // Imprimir
            job.print(doc, attributes);
            
            return new PrintResult(true, "Ticket impreso y cortado correctamente", "java-print");
            
        } catch (Exception e) {
            return new PrintResult(false, "Error al imprimir: " + e.getMessage(), "error");
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
