SELECT
  category,
  file_size::int,
  local::boolean
FROM
  (
    SELECT
      'media_attachments' AS category,
      SUM(COALESCE(media_attachments.file_file_size, 0) + COALESCE(media_attachments.thumbnail_file_size, 0)) AS file_size,
      accounts.domain IS NULL AS local
    FROM media_attachments
    LEFT JOIN accounts ON media_attachments.account_id = accounts.id
    GROUP BY local
    UNION ALL
    SELECT
      'custom_emojis' AS category,
      SUM(image_file_size) AS file_size,
      domain IS NULL AS local
    FROM custom_emojis
    GROUP BY local
    UNION ALL
    SELECT
      'avatars' AS category,
      SUM(avatar_file_size) AS file_size,
      domain IS NULL AS local
    FROM accounts
    GROUP BY local
    UNION ALL
    SELECT
      'headers' AS category,
      SUM(header_file_size) AS file_size,
      domain IS NULL AS local
    FROM accounts
    GROUP BY local
    UNION ALL
    SELECT
      'preview_cards' AS category,
      SUM(image_file_size) as file_size,
      true AS local
    FROM preview_cards
    UNION ALL
    SELECT
      'backups' AS category,
      SUM(dump_file_size) as file_size,
      true AS local
    FROM backups
    UNION ALL
    SELECT
      'imports' AS category,
      SUM(data_file_size) as file_size,
      true AS local
    FROM imports
    UNION ALL
    SELECT
      'settings' AS category,
      SUM(file_file_size) as file_size,
      true AS local
    FROM site_uploads
  ) AS t0
