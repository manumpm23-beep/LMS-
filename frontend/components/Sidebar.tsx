export const Sidebar = () => (
  <aside className="w-64 bg-white border-r h-full flex flex-col">
    <div className="p-4 border-b">
      <h2 className="font-bold text-lg">Course Content</h2>
    </div>
    <nav className="flex-1 overflow-y-auto p-4">
      <ul className="space-y-2">
        <li>Section 1</li>
        <li>Section 2</li>
      </ul>
    </nav>
  </aside>
);