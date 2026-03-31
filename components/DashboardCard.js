// components/DashboardCard.js
export default function DashboardCard({ title, value, link }) {
  return (
    <a
      href={link}
      className="block p-6 bg-white rounded shadow hover:shadow-md transition"
    >
      <h2 className="font-bold text-lg mb-2">{title}</h2>
      <p className="text-2xl">{value}</p>
    </a>
  );
}