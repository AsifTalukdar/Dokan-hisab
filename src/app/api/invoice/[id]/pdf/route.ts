import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import InvoiceTemplate from '@/lib/pdf/invoice-template';
import { NextResponse } from 'next/server';
import React from 'react';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // 1. Fetch Invoice and Client
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(`*, clients(*)`)
      .eq('id', id)
      .single();

    if (invError || !invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    // 2. Fetch Business details separately using business_id from invoice
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', invoice.business_id)
      .single();

    if (bizError || !business) {
      return new NextResponse('Business info not found', { status: 404 });
    }

    // 3. Fetch Invoice Items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    if (itemsError) {
      return new NextResponse('Error fetching items', { status: 500 });
    }

    // 4. Render PDF
    const pdfDocument = React.createElement(InvoiceTemplate, {
      data: {
        invoice,
        client: invoice.clients,
        business,
        items: items || [],
      },
    });
    const stream = await renderToStream(pdfDocument as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
