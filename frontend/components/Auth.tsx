export const AuthForm = () => (
  <form className="space-y-4">
    <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
    <input type="password" placeholder="Password" className="w-full p-2 border rounded" />
    <button className="w-full bg-primary text-white p-2 rounded">Submit</button>
  </form>
);