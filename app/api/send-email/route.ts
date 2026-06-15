import { NextRequest, NextResponse } from "next/server";
import { getEmailConfig } from "@/lib/emailConfig";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, pdfBase64, fileName } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Obtener configuración de email
    const emailConfig = await getEmailConfig();

    if (!emailConfig) {
      return NextResponse.json(
        {
          error:
            "Configuración de email no encontrada. El administrador debe configurarla primero.",
        },
        { status: 400 }
      );
    }

    // Envío real a través de Resend
    const { data, error: resendError } = await resend.emails.send({
      from: 'BodegaPlus <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Tu factura de BodegaPlus',
      html: html,
      attachments: pdfBase64 ? [
        {
          filename: fileName || 'factura.pdf',
          content: pdfBase64,
        }
      ] : [],
    });

    if (resendError) throw resendError;

    return NextResponse.json(
      {
        success: true,
        message: "Email enviado exitosamente",
        id: data?.id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar email" },
      { status: 500 }
    );
  }
}
