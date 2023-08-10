const express = require('express');
const app = express();
const port = 8081;
const puppeteer = require('puppeteer');
const cors = require('cors');

app.use(cors());


app.get('/', function (req, res) {
    res.send('Consulta códigos postales');
})

app.get('/consulta/:cp', async (req, res) => {
    const cp = req.params.cp;

    try {
        // Ejecutamos la función asíncrona con await para resolver la promesa
        const data = await openWebPage(cp);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`El servidor está funcionando en http://localhost:${port}`);
});

async function openWebPage(cp) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx');
    await page.type('input[name="txtcp"]', cp);
    await page.waitForSelector('#btnFind');
    await page.click('#btnFind');

    // Datos tabla
    await page.waitForSelector('#dgCP');

    console.log(page);

    // Función para extraer los datos de la tabla y devolverlos en un array
    const tableData = await page.evaluate(() => {
        const data = [];
        const table = document.querySelector('#dgCP');

        const nameItem = ['cp', 'asentamiento', 'tipo_asentamiento', 'municipio', 'estado', 'ciudad', 'clave_oficina']

        // Obtener todas las filas de la tabla (excepto la primera que contiene las cabeceras)
        const rows = table.querySelectorAll('tr.dgNormal');

        // Recorrer las filas y extraer los datos de cada celda
        rows.forEach((row) => {
            const rowData = {};
            const cells = row.querySelectorAll('td');

            cells.forEach((cell, index) => {
                rowData[nameItem[index]] = cell.innerText.trim();
            });

            data.push(rowData);
        });

        return data;
    });

    if (browser) await browser.close();
    return tableData;
}