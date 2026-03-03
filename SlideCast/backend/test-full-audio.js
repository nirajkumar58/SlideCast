import { generateDualNarratorScript, generateAudioForScript } from './utils/audioProcessor.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const testContent = `
Title: Introduction to Neural Networks

Slide 1:
Neural networks are computational models inspired by the human brain. They consist of interconnected nodes (neurons) that process and transmit information.

Slide 2:
Key components:
- Input Layer: Receives raw data
- Hidden Layers: Process information
- Output Layer: Produces final results
- Weights and Biases: Adjust during learning

Slide 3:
Applications:
- Image Recognition
- Natural Language Processing
- Game Playing
- Medical Diagnosis
`;

async function testFullAudioGeneration() {
    try {
        console.log('Starting full audio generation test...\n');

        // Step 1: Generate script
        console.log('Step 1: Generating dual narrator script...');
        let script = await generateDualNarratorScript(testContent);
        
        // Fix script format (remove asterisks)
        script = script.replace(/\*\*Narrator:\*\*/g, 'Narrator:')
                      .replace(/\*\*Expert:\*\*/g, 'Expert:');
        
        console.log('\nGenerated Script:');
        console.log(script);

        // Save script to file for reference
        const scriptPath = path.join(process.cwd(), 'test-script.txt');
        fs.writeFileSync(scriptPath, script);
        console.log('\nScript saved to:', scriptPath);

        // Step 2: Generate audio
        console.log('\nStep 2: Generating audio for each part...');
        const audioSegments = await generateAudioForScript(script, 'narrator_expert');
        
        // Save each audio segment
        console.log('\nSaving audio segments...');
        audioSegments.forEach((segment, index) => {
            const audioPath = path.join(process.cwd(), `test-audio-${segment.role}-${index + 1}.mp3`);
            fs.writeFileSync(audioPath, segment.audio);
            console.log(`Saved ${segment.role} audio to:`, audioPath);
        });

        console.log('\nTest completed successfully!');
        return true;
    } catch (error) {
        console.error('\nTest failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', 
                error.response.data instanceof Buffer 
                    ? 'Binary audio data received but with error status'
                    : error.response.data
            );
        }
        return false;
    }
}

// Run the test
testFullAudioGeneration()
    .then(success => {
        console.log('\nFinal Result:', success ? 'SUCCESS' : 'FAILED');
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test execution error:', error);
        process.exit(1);
    }); 