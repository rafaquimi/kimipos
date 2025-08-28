const http = require('http');

console.log('🔍 DEBUG - SIMULANDO DASHBOARD CON PRODUCTOS');
console.log('='.repeat(60));
console.log();

// Función que simula el dashboard enviando datos
function enviarDesdeDashboard(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
    console.log('📤 DATOS QUE SE ENVÍAN:');
    console.log(JSON.stringify(datos, null, 2));
    console.log();

    const options = {
      hostname: 'localhost',
      port: 3002,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonStart = responseData.indexOf('{');
          const jsonEnd = responseData.lastIndexOf('}') + 1;
          const jsonResponse = responseData.substring(jsonStart, jsonEnd);
          const result = JSON.parse(jsonResponse);
          resolve(result);
        } catch (error) {
          resolve({ success: false, message: 'Error parsing response', raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Simular diferentes escenarios del dashboard
const escenarios = [
  {
    nombre: "Dashboard con productos y mesa",
    datos: {
      items: [
        {
          quantity: 1,
          productName: "Dr Pepper",
          unitPrice: 30.00,
          totalPrice: 30.00
        },
        {
          quantity: 1,
          productName: "Mountain Dew",
          unitPrice: 28.00,
          totalPrice: 28.00
        }
      ],
      tableNumber: "Mesa 7",
      customerName: "Cliente General",
      restaurantName: "RESTAURANTE EL BUENO"
    }
  },
  {
    nombre: "Dashboard con productos sin mesa",
    datos: {
      items: [
        {
          quantity: 2,
          productName: "Coca Cola",
          unitPrice: 25.00,
          totalPrice: 50.00
        }
      ],
      tableNumber: "Ticket sin mesa",
      customerName: "Cliente General",
      restaurantName: "RESTAURANTE EL BUENO"
    }
  },
  {
    nombre: "Dashboard con pedido vacío (debería fallar)",
    datos: {
      items: [],
      tableNumber: "Mesa 1",
      customerName: "Cliente General",
      restaurantName: "RESTAURANTE EL BUENO"
    }
  }
];

async function probarEscenarios() {
  for (const escenario of escenarios) {
    console.log(`🧪 PROBANDO: ${escenario.nombre}`);
    console.log('-'.repeat(40));
    
    try {
      const resultado = await enviarDesdeDashboard(escenario.datos);
      
      console.log('📥 RESULTADO:');
      console.log('   Success:', resultado.success);
      console.log('   Message:', resultado.message);
      console.log('   Method:', resultado.method || 'N/A');
      console.log();
      
      if (resultado.success) {
        console.log('✅ ESCENARIO EXITOSO');
      } else {
        console.log('❌ ESCENARIO FALLIDO');
      }
      
    } catch (error) {
      console.log('❌ ERROR DE CONEXIÓN:', error.message);
    }
    
    console.log('='.repeat(60));
    console.log();
  }
}

// Ejecutar pruebas
probarEscenarios();
