"use client";

import { useEffect, useState } from "react";
import { EmailConfig } from "@/types/shop";
import { getEmailConfig, saveEmailConfig } from "@/lib/emailConfig";
import { useAuth } from "@/context/AuthContext";
import { createAuditLog } from "@/lib/auditLogs";

export default function EmailConfiguration() {
  const { userProfile, isAdmin } = useAuth();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [formData, setFormData] = useState({
    emailRemitente: "",
    contrasena: "",
    servidorSMTP: "",
    puerto: 587,
    usarSSL: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isAdmin?.()) {
      loadConfig();
    }
  }, []);

  const loadConfig = async () => {
    try {
      const existingConfig = await getEmailConfig();
      if (existingConfig) {
        setConfig(existingConfig);
        setFormData({
          emailRemitente: existingConfig.emailRemitente,
          contrasena: "", // No mostrar contraseña por seguridad
          servidorSMTP: existingConfig.servidorSMTP,
          puerto: existingConfig.puerto,
          usarSSL: existingConfig.usarSSL,
        });
      }
    } catch (err) {
      console.error("Error loading email config:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? target.checked
          : name === "puerto"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.emailRemitente || !formData.contrasena || !formData.servidorSMTP) {
        setError("Todos los campos son requeridos");
        setLoading(false);
        return;
      }

      const configToSave: Omit<EmailConfig, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        contrasena: formData.contrasena,
      };

      await saveEmailConfig(configToSave);

      // Crear log de auditoría
      if (userProfile) {
        await createAuditLog({
          tipo: "parametrizacion",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: "Configuración de email actualizada",
          detalles: {
            emailRemitente: formData.emailRemitente,
            servidorSMTP: formData.servidorSMTP,
            puerto: formData.puerto,
          },
        });
      }

      setSuccess("Configuración de email guardada exitosamente");
      await loadConfig();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin?.()) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-red-600">No tiene permisos para acceder a esta sección</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Configuración de Email</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Email Remitente *</label>
          <input
            type="email"
            name="emailRemitente"
            placeholder="ejemplo@gmail.com"
            value={formData.emailRemitente}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Este será el email desde donde se enviarán las facturas
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Contraseña / Token *</label>
          <input
            type="password"
            name="contrasena"
            placeholder="Contraseña o token de aplicación"
            value={formData.contrasena}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Para Gmail, use una contraseña de aplicación. Para otros servidores, use su contraseña.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Servidor SMTP *</label>
          <input
            type="text"
            name="servidorSMTP"
            placeholder="smtp.gmail.com"
            value={formData.servidorSMTP}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ej: smtp.gmail.com (Gmail), smtp.office365.com (Outlook)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Puerto *</label>
            <input
              type="number"
              name="puerto"
              placeholder="587"
              value={formData.puerto}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Típicamente 587 (TLS) o 465 (SSL)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Usar SSL/TLS</label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                name="usarSSL"
                checked={formData.usarSSL}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm">Activar SSL/TLS</span>
            </label>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-2">Instrucciones de Configuración:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Gmail:</strong> smtp.gmail.com, Puerto 587, TLS activado, Contraseña de aplicación</li>
            <li>• <strong>Outlook:</strong> smtp.office365.com, Puerto 587, TLS activado</li>
            <li>• <strong>Yahoo:</strong> smtp.mail.yahoo.com, Puerto 587, TLS activado</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>

      {config && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-semibold text-green-900">✓ Configuración Guardada</p>
          <p className="text-xs text-green-800 mt-2">
            Email remitente: <strong>{config.emailRemitente}</strong>
          </p>
          <p className="text-xs text-green-800">
            Servidor: <strong>{config.servidorSMTP}:{config.puerto}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
