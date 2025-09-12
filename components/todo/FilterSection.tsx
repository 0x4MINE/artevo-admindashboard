export function FilterSection({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{title}</label>
      <div className="space-y-1">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, option]);
                } else {
                  onChange(selected.filter((s) => s !== option));
                }
              }}
              className="rounded"
            />
            <span className="text-sm capitalize">
              {option.replace("-", " ")}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

