// Export common shared components here
export const Button = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <button onClick={onClick} className="px-4 py-2 bg-primary text-white rounded">
    {children}
  </button>
);