"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../lib/supabase";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableRef = useRef();

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action_type,
        object_type,
        object_id,
        object_name,
        details,
        created_at,
        users!inner(id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  }

  // 📄 EXPORT PDF
  const exportPDF = async () => {
    const element = tableRef.current;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("audit-logs.pdf");
  };

  // 📊 EXPORT EXCEL
  const exportExcel = () => {
    const formattedData = logs.map((log, index) => {
      let detailsText = "";
      try {
        detailsText = log.details
          ? JSON.stringify(JSON.parse(log.details))
          : "";
      } catch {
        detailsText = log.details || "";
      }

      return {
        "#": index + 1,
        User: log.users?.name || log.users?.email || "Unknown",
        Action: log.action_type,
        Object: log.object_type,
        Details: log.object_name || detailsText,
        Date: new Date(log.created_at).toLocaleString(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

    XLSX.writeFile(workbook, "audit-logs.xlsx");
  };

  if (loading) return <p className="p-6">Loading audit logs...</p>;

  if (logs.length === 0)
    return <p className="p-6">No audit logs yet.</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">
        Admin Audit & Logs
      </h1>

      {/* 🔥 EXPORT BUTTONS */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={exportPDF}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>

        <button
          onClick={exportExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* 🔹 TABLE */}
      <div ref={tableRef} className="overflow-x-auto bg-white p-4">
        <table className="min-w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">#</th>
              <th className="border px-4 py-2">User</th>
              <th className="border px-4 py-2">Action</th>
              <th className="border px-4 py-2">Object</th>
              <th className="border px-4 py-2">Name / Details</th>
              <th className="border px-4 py-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, index) => {
              let detailsText = "";
              try {
                detailsText = log.details
                  ? JSON.stringify(JSON.parse(log.details), null, 2)
                  : "";
              } catch {
                detailsText = log.details || "";
              }

              return (
                <tr key={log.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{index + 1}</td>

                  <td className="border px-4 py-2">
                    {log.users?.name ||
                      log.users?.email ||
                      "Unknown"}
                  </td>

                  <td className="border px-4 py-2 capitalize">
                    {log.action_type}
                  </td>

                  <td className="border px-4 py-2 capitalize">
                    {log.object_type}
                  </td>

                  <td className="border px-4 py-2">
                    {log.object_name || detailsText}
                  </td>

                  <td className="border px-4 py-2">
                    {new Date(
                      log.created_at
                    ).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}