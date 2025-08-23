export const CustomTooltip = ({
  active,
  payload,
}: {
  active: boolean | undefined;
  payload: any;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background p-3 border border-primary rounded-lg shadow-lg">
        <p className="font-medium text-title">{data.name}</p>
        <p className="text-btn-secondary font-semibold">{data.value}</p>
      </div>
    );
  }
  return null;
};
