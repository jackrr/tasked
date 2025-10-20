export default function Input({
  onChange,
  initialValue,
  placeholder,
}: {
  onChange: (v: string) => void;
  initialValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      // initialValue={initialValue}
    />
  );
}
