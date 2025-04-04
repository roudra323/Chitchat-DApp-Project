import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';

export async function GET(request: NextRequest) {
    // Get the CID from the URL parameters
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
        return NextResponse.json(
            { message: 'CID is required' },
            { status: 400 }
        );
    }

    try {
        // Initialize Pinata SDK
        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT ?? '',
            pinataGateway: process.env.GATEWAY_URL ?? '',
        });

        // Get file from Pinata
        const file = await pinata.gateways.public.get(cid);

        if (!file) {
            return NextResponse.json(
                { message: 'File not found' },
                { status: 404 }
            );
        }

        // Return the file data
        return NextResponse.json(file);
    } catch (error: any) {
        console.error('Pinata fetch error:', error);
        return NextResponse.json(
            { message: 'Error fetching from Pinata', error: error.message },
            { status: 500 }
        );
    }
}