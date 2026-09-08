function StatCard({
  title,
  value,
  icon,
  description,
  variant = "blue",
}) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">
          {icon}
        </div>

        <span className="stat-card-title">
          {title}
        </span>
      </div>

      <div className="stat-card-value">
        {value}
      </div>

      {description && (
        <p className="stat-card-description">
          {description}
        </p>
      )}
    </div>
  );
}

export default StatCard;