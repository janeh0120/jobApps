#!/usr/bin/env node
/**
 * Generate placeholder images for grid visualization
 * Uses node built-in modules to create simple colored squares
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple function to create a minimal 24x24 PNG file
// This creates a basic PNG with a solid color
function createPNG(filename, hexColor) {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create a minimal valid PNG file
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk (image header) for 24x24 8-bit RGB
    const width = 24;
    const height = 24;
    const ihdrData = Buffer.allocUnsafe(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;    // bit depth
    ihdrData[9] = 2;    // color type (RGB)
    ihdrData[10] = 0;   // compression
    ihdrData[11] = 0;   // filter
    ihdrData[12] = 0;   // interlace
    
    const ihdr = createChunk('IHDR', ihdrData);
    
    // IDAT chunk (image data) - single color fill
    const imageData = Buffer.alloc((width * height * 3) + height); // RGB data + filter bytes
    let pos = 0;
    
    for (let y = 0; y < height; y++) {
        imageData[pos++] = 0; // filter type: none
        for (let x = 0; x < width; x++) {
            imageData[pos++] = r;
            imageData[pos++] = g;
            imageData[pos++] = b;
        }
    }
    
    // Compress with zlib
    const compressed = zlib.deflateSync(imageData);
    const idat = createChunk('IDAT', compressed);
    
    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));
    
    // Combine all chunks
    const png = Buffer.concat([signature, ihdr, idat, iend]);
    fs.writeFileSync(path.join(__dirname, filename), png);
    console.log(`✓ Created ${filename}`);
}

function createChunk(type, data) {
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcInput = Buffer.concat([typeBuffer, data]);
    
    // Simple CRC (not fully correct but works for testing)
    const crc = Buffer.allocUnsafe(4);
    crc.writeUInt32BE(calculateCRC(crcInput), 0);
    
    return Buffer.concat([length, typeBuffer, data, crc]);
}

// Simple CRC32 calculation
function calculateCRC(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = crc ^ buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// Image definitions
const images = [
    ['email_questions.png', '#FF6B6B'],
    ['one-sided_interview.png', '#4ECDC4'],
    ['behavioural_interview.png', '#45B7D1'],
    ['portfolio_walkthrough.png', '#96CEB4'],
    ['take-home_challenge.png', '#FFEAA7'],
    ['recruiter_call.png', '#DDA0DD'],
    ['rejected.png', '#FF4757'],
    ['accepted.png', '#2ED573'],
    ['no_answer_ongoing.png', '#FFA502'],
    ['design_related.png', '#A29BFE'],
    ['referred.png', '#FD79A8'],
];

images.forEach(([filename, color]) => {
    createPNG(filename, color);
});

console.log('\nAll placeholder images created successfully!');
