
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'Parallelvc.in@gmail.com';
const password = '9894519351$321';

async function registerAdmin() {
    console.log('Attempting to register admin:', email);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'admin',
                name: 'Admin'
            }
        }
    });

    if (error) {
        console.error('Error creating admin:', error.message);
    } else {
        console.log('Admin created successfully:', data.user?.id);
        console.log('Metadata:', data.user?.user_metadata);
    }
}

registerAdmin();
