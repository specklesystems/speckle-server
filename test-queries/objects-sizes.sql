SELECT id, "streamId", "speckleType", "createdAt"::date, pg_column_size(data) / 1024 /1024 || 'MB' AS size, data
	FROM objects
	ORDER BY size DESC LIMIT 20;
