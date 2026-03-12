import React from "react";
import { formatDateTime } from "@/lib/utils";

export interface VisitReportData {
  visitNumber: string;
  technician: { name: string };
  project?: { name: string } | null;
  location?: string | null;
  notes?: string | null;
  status: string;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  customerSignature?: string | null;
  technicianSignature?: string | null;
  signedAt?: string | null;
  companyName?: string;
}

export const VisitReport = React.forwardRef<HTMLDivElement, { data: VisitReportData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: "794px",       // A4 width at 96dpi
          minHeight: "1123px",  // A4 height at 96dpi
          padding: "48px",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          color: "#111827",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "2px solid #1d4ed8", paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div
                style={{
                  width: "40px", height: "40px", backgroundColor: "#1d4ed8",
                  borderRadius: "8px", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#fff", fontWeight: "bold",
                  fontSize: "18px", marginBottom: "8px",
                }}
              >
                A
              </div>
              <p style={{ fontWeight: "bold", fontSize: "16px", margin: 0 }}>
                {data.companyName ?? "Arkaz Al Saudi General Contracting Company"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "20px", fontWeight: "bold", color: "#1d4ed8", margin: 0 }}>
                FIELD VISIT REPORT
              </p>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
                {data.visitNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Visit Details */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <tbody>
            {[
              ["Technician", data.technician.name],
              ["Project / Site", data.project?.name ?? "—"],
              ["Location", data.location ?? "—"],
              ["GPS Coordinates", data.gpsLat && data.gpsLng ? `${data.gpsLat.toFixed(6)}, ${data.gpsLng.toFixed(6)}` : "—"],
              ["Scheduled", formatDateTime(data.scheduledAt)],
              ["Started On-Site", data.startedAt ? formatDateTime(data.startedAt) : "—"],
              ["Completed", data.completedAt ? formatDateTime(data.completedAt) : "—"],
              ["Status", data.status.replace("_", " ")],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px 8px 0", width: "180px", color: "#6b7280", fontWeight: "500" }}>
                  {label}
                </td>
                <td style={{ padding: "8px 0" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {data.notes && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontWeight: "600", marginBottom: "8px" }}>Notes</p>
            <div
              style={{
                backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: "6px", padding: "12px", lineHeight: "1.6",
              }}
            >
              {data.notes}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            gap: "40px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "24px",
          }}
        >
          {[
            { label: "Customer Signature", sig: data.customerSignature },
            { label: "Technician Signature", sig: data.technicianSignature },
          ].map(({ label, sig }) => (
            <div key={label} style={{ flex: 1 }}>
              <p style={{ fontWeight: "600", marginBottom: "8px", fontSize: "13px" }}>{label}</p>
              {sig ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sig}
                  alt={label}
                  style={{
                    border: "1px solid #d1d5db", borderRadius: "4px",
                    width: "100%", height: "100px", objectFit: "contain",
                    backgroundColor: "#fff",
                  }}
                />
              ) : (
                <div
                  style={{
                    border: "1px dashed #d1d5db", borderRadius: "4px",
                    width: "100%", height: "100px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#9ca3af", fontSize: "12px",
                  }}
                >
                  Not signed
                </div>
              )}
              {data.signedAt && sig && (
                <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                  Signed: {formatDateTime(data.signedAt)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto", paddingTop: "24px", borderTop: "1px solid #e5e7eb",
            fontSize: "11px", color: "#9ca3af", textAlign: "center",
          }}
        >
          Generated by ArkazGPT Field Service Platform · {new Date().toLocaleDateString()}
        </div>
      </div>
    );
  }
);
VisitReport.displayName = "VisitReport";
