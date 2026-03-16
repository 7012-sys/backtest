export const exportToCsv = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const cellValue = value === null || value === undefined ? "" : String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (cellValue.includes(",") || cellValue.includes("\n") || cellValue.includes('"')) {
            return `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
