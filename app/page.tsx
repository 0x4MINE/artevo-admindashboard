import Image from "next/image";

export default function Home() {
  return (
    <div className="text-blue-800 underline">
      <a href="/dashboard" className="">
        dashboard
      </a>
      <br />
      <a href="/login">login</a>
      <br />
      <a href="/login">API</a>
    </div>
  );
}
