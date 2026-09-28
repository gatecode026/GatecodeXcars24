const Field = ({ label, error, children }) => (
  <label className="field-wrap">
    <span>{label}</span>
    {children}
    {error && <small className="error-text">{error}</small>}
  </label>
);

export default Field;
