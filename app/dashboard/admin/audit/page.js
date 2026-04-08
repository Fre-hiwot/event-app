"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import style from "../../../styles/dashboard/admin/audit.module.css";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const tableRef = useRef();

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id, user_id, action_type, object_type, object_id, object_name,
        details, created_at, users!inner(id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching audit logs:", error);
    else setLogs(data || []);

    setLoading(false);
  }

  // --- Filter logs by date range including full "To" day ---
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const logDate = new Date(log.created_at + "Z"); // UTC timestamp
      const from = startDate ? new Date(startDate + "T00:00:00Z") : null;
      const to = endDate ? new Date(endDate + "T23:59:59Z") : null;
      if (from && logDate < from) return false;
      if (to && logDate > to) return false;
      return true;
    });
  };

  // --- Export PDF ---
  const exportPDF = async () => {
    const filteredLogs = getFilteredLogs();

    // Create temporary table for PDF
    const tempDiv = document.createElement("div");
    const title = document.createElement("h2");
    title.innerText = `Audit Logs From ${startDate || "All"} To ${endDate || "All"}`;
    title.style.fontWeight = "bold";
    title.style.marginBottom = "1rem";
    tempDiv.appendChild(title);

    const tableClone = tableRef.current.cloneNode(true);
    tempDiv.appendChild(tableClone);
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, { scale: 2 });
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

    document.body.removeChild(tempDiv);
    pdf.save("audit-logs.pdf");
  };

  // --- Export Excel ---
  const exportExcel = () => {
    const filteredLogs = getFilteredLogs();

    const formattedData = filteredLogs.map((log, index) => {
      let detailsText = "";
      try { detailsText = log.details ? JSON.stringify(JSON.parse(log.details)) : ""; }
      catch { detailsText = log.details || ""; }

      return {
        "#": index + 1,
        User: log.users?.name || log.users?.email || "Unknown",
        Action: log.action_type,
        Object: log.object_type,
        Details: log.object_name || detailsText,
        Date: new Date(log.created_at + "Z").toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Audit Logs From", startDate || "All", "To", endDate || "All"]],
      { origin: "A1" }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(workbook, "audit-logs.xlsx");
  };

  if (loading) return <p className={style.container}>Loading audit logs...</p>;
  if (!logs.length) return <p className={style.container}>No audit logs yet.</p>;

  return (
    <div className={style.container}>
      <h1 className={style.title}>Admin Audit & Logs</h1>

      {/* --- DATE RANGE PICKERS --- */}
      <div className={style.dateFilters}>
        <label>
          From:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={style.dateInput}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={style.dateInput}
          />
        </label>
      </div>

      {/* --- EXPORT BUTTONS --- */}
      <div className={style.buttons}>
        <button onClick={exportPDF} className={style.btnPdf}>Export PDF</button>
        <button onClick={exportExcel} className={style.btnExcel}>Export Excel</button>
      </div>

      <div ref={tableRef} className={style.tableWrapper}>
        <table className={style.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Action</th>
              <th>Object</th>
              <th>Name / Details</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredLogs().map((log, index) => {
              let detailsText = "";
              try { detailsText = log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : ""; }
              catch { detailsText = log.details || ""; }

              return (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td>{log.users?.name || log.users?.email || "Unknown"}</td>
                  <td>{log.action_type}</td>
                  <td>{log.object_type}</td>
                  <td>{log.object_name || detailsText}</td>
                  <td>{new Date(log.created_at + "Z").toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}