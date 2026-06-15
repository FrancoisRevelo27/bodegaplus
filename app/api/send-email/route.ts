import { NextRequest, NextResponse } from "next/server";
import { getEmailConfig } from "@/lib/emailConfig";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic';

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

    // Configurar el transporte SMTP con los datos de la base de datos
    const transporter = nodemailer.createTransport({
      host: emailConfig.servidorSMTP,
      port: emailConfig.puerto,
      secure: emailConfig.usarSSL, // true para puerto 465, false para otros
      auth: {
        user: emailConfig.emailRemitente,
        pass: emailConfig.contrasena,
      },
    });

    // Envío del correo
    const info = await transporter.sendMail({
      from: `"BodegaPlus" <${emailConfig.emailRemitente}>`,
      to,
      subject: subject || "Tu factura de BodegaPlus",
      html: html,
      attachments: pdfBase64 
        ? [{ filename: fileName || "factura.pdf", content: pdfBase64, encoding: 'base64' }] 
        : [],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email enviado exitosamente",
        id: info.messageId,
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
