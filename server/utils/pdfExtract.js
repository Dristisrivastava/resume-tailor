const { promises } = require('dns');
const fs=require('fs');
const pdf=require('pdf-parse');
const { buffer } = require('stream/consumers');

/**
 * jdocs 
 * @param {string} filePath -path to pdf uploaded
 * @returns {promises<string>} -the extracted text
 */

async function extracttext(filePath) {
    try {
        const Databuffer=fs.readFileSync(filePath);

        const data=await pdf(Databuffer);
        console.log('pdf extracted')
        return data.text;
    } catch (error) {
        console.error('Error in pdf extraction',error);
        throw new error('Failed');
    }
}

module.exports ={
    extracttext //allowed to be use any where
};