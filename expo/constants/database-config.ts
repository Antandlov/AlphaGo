export const DATABASE_CONFIG = {
  ENABLE_PRODUCT_DATABASE: false,
  ENABLE_INGREDIENT_DATABASE: false,
  
  SCHEDULED_UPDATE_TIME: '00:00',
  UPDATE_INTERVAL_HOURS: 24,
  
  MAX_CACHE_AGE_DAYS: 30,
  
  STORAGE_KEYS: {
    INGREDIENT_DB: 'alphago_ingredient_database',
    PRODUCT_DB: 'alphago_product_database',
    LAST_UPDATE: 'alphago_last_database_update',
    UPDATE_LOG: 'alphago_database_update_log',
  },
  
  AI_FALLBACK_ENABLED: true,
} as const;
