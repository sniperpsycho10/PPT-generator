import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get('dept');
  
  // Example QR URL: /qr?dept=RailMill
  if (dept) {
    // Redirect the user directly to the submission form with their department pre-filled
    return NextResponse.redirect(new URL(`/submit?dept=${encodeURIComponent(dept)}`, request.url));
  }
  
  // If no department is provided in the QR code, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}
