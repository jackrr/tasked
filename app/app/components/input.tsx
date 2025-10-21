export default function Input({
  onChange,
  ...rest
}: Omit<React.HTMLProps<HTMLInputElement>, "onChange"> & {
  onChange?: (v: string) => void;
}) {
  return (
    <input {...rest} onChange={(e) => onChange && onChange(e.target.value)} />
  );
}
