import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

export async function POST(request: NextRequest) {
    try {
        // Get the form data from the request
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { message: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Initialize Pinata SDK
        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT ?? '',
            pinataGateway: process.env.GATEWAY_URL ?? '',
        });

        // Create a File object from the uploaded file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Use the web API Blob instead of buffer.Blob
        const blob = new globalThis.Blob([buffer]);
        const pinataFile = new File([blob], file.name, { type: file.type });

        // Upload to Pinata
        const uploadResult = await pinata.upload.public.file(pinataFile);

        // Return success response
        return NextResponse.json(uploadResult);
    } catch (error: any) {
        console.error('Pinata upload error:', error);
        return NextResponse.json(
            { message: 'Error uploading to Pinata', error: error.message },
            { status: 500 }
        );
    }
}