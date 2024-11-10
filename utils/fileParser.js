// utils/fileParser.js
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const XLSX = require('xlsx');

async function parsePDF(fileBuffer) {
    return pdf(fileBuffer).then(data => data.text);
}

async function parseDOCX(fileBuffer) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
}
const parseTXT = async (buffer) => {
    return buffer.toString('utf-8');
};

async function parseImage(fileBuffer) {
    const result = await Tesseract.recognize(fileBuffer, 'eng');
    return result.data.text;
}

const parseXLSX = async (buffer) => {
    // Read the workbook from the buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // header: 1 gives a 2D array

    // Flatten the array and join the values with a newline or space
    const flattenedData = jsonData.flat().filter(cell => cell !== null && cell !== undefined);
    const dataString = flattenedData.join('\n'); // Join with newline or space as needed

    console.log(dataString); // Log the final string for debugging

    return dataString; // Return the data as a string
};

// utils/fileParser.js
const parseJS = async (buffer) => {
    // Extract plain text from JavaScript file
    return buffer.toString('utf-8');
};
const parseCSS = async (buffer) => {
    return buffer.toString('utf-8'); // Convert CSS file to plain text
};

module.exports = { parsePDF, parseDOCX, parseImage, parseJS, parseCSS,parseXLSX,parseTXT };




