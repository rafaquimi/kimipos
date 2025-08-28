const axios = require('axios');

async function testDebugPrint() {
    console.log('🔍 PRUEBA DE DEPURACIÓN - DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));
    
    const testData = {
        restaurantName: "RESTAURANTE EL BUENO",
        tableNumber: "MESA-12",
        customerName: "MARÍA GARCÍA",
        items: [
            {
                quantity: 1,
                productName: "PRUEBA DE IMPRESIÓN",
                unitPrice: 1.00,
                totalPrice: 1.00
            }
        ]
    };
    
    try {
        console.log('📤 Enviando datos de prueba...');
        console.log('📋 Datos:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post('http://localhost:3000/print-ticket', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log('\n✅ Respuesta del servidor:');
        console.log('   Status:', response.status);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 Respuesta exitosa del servidor');
            console.log('📋 Método utilizado:', response.data.method);
            console.log('📋 Respuesta Java:', response.data.javaResponse);
            
            // Verificar el estado del servicio Java
            try {
                console.log('\n🔍 Verificando estado del servicio Java...');
                const javaStatus = await axios.get('http://localhost:3000/java-status', {
                    timeout: 5000
                });
                console.log('✅ Estado Java:', javaStatus.data);
            } catch (javaError) {
                console.log('❌ Error al verificar estado Java:', javaError.message);
            }
            
        } else {
            console.log('\n❌ Error en la impresión:', response.data.message);
        }
        
    } catch (error) {
        console.log('\n❌ Error en la prueba:');
        if (error.code === 'ECONNREFUSED') {
            console.log('   No se puede conectar al servidor en puerto 3000');
            console.log('   Verifica que el servidor esté ejecutándose');
        } else if (error.code === 'ECONNRESET') {
            console.log('   Conexión perdida con el servidor');
        } else if (error.response) {
            console.log('   Error del servidor:', error.response.status);
            console.log('   Datos:', error.response.data);
        } else {
            console.log('   Error:', error.message);
        }
    }
    
    console.log('\n🔍 DIAGNÓSTICO ADICIONAL:');
    console.log('1. Verifica que la impresora POS-80C esté conectada y encendida');
    console.log('2. Verifica que sea la impresora predeterminada');
    console.log('3. Verifica que tenga papel');
    console.log('4. Revisa los logs del servidor para más detalles');
}

testDebugPrint();
