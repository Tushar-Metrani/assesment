// Highlights any value the model marked as unclear.
export function Val({ text }) {
  return <span className={/unclear/i.test(text) ? "unclear" : undefined}>{text}</span>;
}

const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v));

export default function SummarySection({ title, rows }) {
  const filled = rows.filter(([, v]) => hasValue(v));
  return (
    <div className="sum-section">
      <h3>{title}</h3>
      {filled.length === 0 ? (
        <div className="muted">Not stated</div>
      ) : (
        filled.map(([label, value]) => (
          <div className="row" key={label}>
            <span className="label">{label}</span>
            {Array.isArray(value) ? (
              <ul>{value.map((x, i) => <li key={i}><Val text={x} /></li>)}</ul>
            ) : (
              <Val text={value} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
