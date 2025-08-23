const customers = [
  {
    id: "#1505324",
    name: "AMIR HAMDI",
    phone: "/",
    status: "active",
    spent: "2300 DA",
    credit: "0.00 DA",
  },
  {
    id: "#5135016",
    name: "WALID",
    phone: "0778509997",
    status: "not active",
    spent: "1100 DA",
    credit: "500 DA",
  },
];

export default function CustomerTable() {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-md m-4">
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-blue-600 uppercase border-b">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Spent This Month</th>
            <th className="px-4 py-3 text-red-600">Credit</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3">{c.id}</td>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">{c.phone}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
                    c.status === "active"
                      ? "bg-green-400"
                      : "bg-red-400"
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3">{c.spent}</td>
              <td className="px-4 py-3">{c.credit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
