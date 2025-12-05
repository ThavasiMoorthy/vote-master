import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists!');
    const envConfig = dotenv.config({ path: envPath }).parsed;

    if (envConfig) {
        console.log('Keys found in .env:');
        Object.keys(envConfig).forEach(key => {
            console.log(`- ${key}`);
        });

        const hasUrl = !!envConfig.VITE_SUPABASE_URL;
        const hasKey = !!envConfig.VITE_SUPABASE_ANON_KEY;

        console.log('\nVerification:');
        console.log(`VITE_SUPABASE_URL present: ${hasUrl}`);
        console.log(`VITE_SUPABASE_ANON_KEY present: ${hasKey}`);

        if (!hasUrl || !hasKey) {
            console.log('\nERROR: One or more required keys are missing!');
        } else {
            console.log('\nSUCCESS: Required keys are present.');
        }
    } else {
        console.log('Failed to parse .env file.');
    }
} else {
    console.log('ERROR: .env file NOT found at this path.');
}
