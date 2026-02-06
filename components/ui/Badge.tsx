interface BadgeProps {
  name: string;
}

export default function Badge({ name }: BadgeProps) {
  return (
    <span className="bg-white rounded-full px-4 py-2 text-sm font-medium text-gray-800 shadow-sm">
      {name}
    </span>
  );
}
