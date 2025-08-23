// app/users/page.tsx
import { getUsers } from "@/lib/actions/userActions";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u: any) => (
          <li key={u._id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
