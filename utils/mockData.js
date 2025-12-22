export const inventoryMock = [
  { name: "Paracetamol", qty: 50, expiry: "2025-12-20", lowStock: false },
  { name: "Amoxicillin", qty: 5, expiry: "2025-11-15", lowStock: true },
  { name: "Ibuprofen", qty: 12, expiry: "2025-12-10", lowStock: false },
];

export const transactionsMock = [
  { id: "TX001", item: "Paracetamol", amount: 5000, status: "Paid", date: "2025-12-12" },
  { id: "TX002", item: "Ibuprofen", amount: 3000, status: "Pending", date: "2025-12-13" },
];

export const expensesMock = [
  { id: "EX001", name: "Electricity", amount: 12000, date: "2025-12-10" },
  { id: "EX002", name: "Water", amount: 8000, date: "2025-12-11" },
];
