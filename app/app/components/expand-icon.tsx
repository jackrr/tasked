export default function ExpandIcon({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      viewBox="0 0 19 19"
    >
      <path
        className="fill-foreground"
        d="M.5 13.504a.5.5 0 0 1 .5.5v3.293l3.146-3.147a.5.5 0 1 1 .708.707l-3.147 3.147H5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5v-4.5a.5.5 0 0 1 .5-.5m18 0a.5.5 0 0 1 .5.5v4.5a.5.5 0 0 1-.5.5H14a.5.5 0 0 1 0-1h3.293l-3.146-3.147a.5.5 0 0 1 .707-.707L18 17.297v-3.293a.5.5 0 0 1 .5-.5M4.996 0a.5.5 0 0 1 .008 1l-3.293.025 3.17 3.122a.5.5 0 0 1-.701.713L1.01 1.738l.025 3.293a.5.5 0 0 1-1 .008L0 .54A.5.5 0 0 1 .496.035zM18.5.004a.5.5 0 0 1 .5.5v4.5a.5.5 0 1 1-1 0V1.71l-3.146 3.146a.5.5 0 1 1-.707-.707l3.146-3.146H14a.5.5 0 0 1 0-1z"
      />
    </svg>
  );
}
