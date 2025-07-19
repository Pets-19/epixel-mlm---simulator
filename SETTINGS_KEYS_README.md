# Settings Keys Management System

This document describes the new settings keys management system that allows direct editing of individual configuration values using unique identifiers.

## Overview

The settings keys system provides a way to directly update individual configuration values without having to edit entire settings objects. Each configuration key has a unique identifier in the format `settings_name.key_name`.

## Database Schema

### New Tables and Views

1. **settings_keys** - Stores individual key-value pairs
   - `id` - Primary key
   - `setting_id` - Foreign key to settings table
   - `key_name` - The name of the configuration key
   - `key_value` - The current value
   - `value_type` - Data type (string, number, boolean, json)
   - `is_encrypted` - Whether the value is encrypted
   - `is_required` - Whether the key is required
   - `description` - Optional description
   - `created_at`, `updated_at` - Timestamps

2. **settings_keys_view** - View for easy access to setting keys with identifiers
   - Includes the unique `key_identifier` field
   - Joins with settings table for additional context

### Database Functions

1. **generate_setting_key_identifier(setting_name, key_name)** - Generates unique identifiers
2. **update_setting_key(setting_name, key_name, new_value)** - Updates individual keys
3. **sync_settings_keys()** - Syncs config_data with settings_keys table

## API Endpoints

### Get Setting Keys
```
GET /api/settings/keys
Query Parameters:
- setting_name (optional) - Filter by setting name
- category (optional) - Filter by category
- type (optional) - Filter by setting type
```

### Get Setting Key by Identifier
```
GET /api/settings/keys/by-identifier?identifier=setting_name.key_name
```

### Update Setting Key by Identifier
```
PUT /api/settings/keys/update-by-identifier
Body:
{
  "key_identifier": "setting_name.key_name",
  "value": "new_value"
}
```

### Update Setting Key by Names
```
PUT /api/settings/keys/update-by-names
Body:
{
  "setting_name": "setting_name",
  "key_name": "key_name",
  "value": "new_value"
}
```

## Frontend Components

### SettingKeyEditor Component

A new React component that provides a user interface for editing individual setting keys.

**Features:**
- Lists all setting keys with their unique identifiers
- Shows value types, required status, and encryption status
- Inline editing of key values
- Detailed view of individual keys
- Filtering by setting name, category, and type

**Usage:**
```tsx
<SettingKeyEditor
  settingName="optional_setting_name"
  category="optional_category"
  settingType="optional_type"
  onClose={() => setShowEditor(false)}
/>
```

## Key Identifiers

Each setting key has a unique identifier in the format:
```
{setting_name}.{key_name}
```

**Examples:**
- `smtp_config.smtp_host`
- `twilio_config.account_sid`
- `stripe_config.publishable_key`

## Value Types

The system supports the following value types:
- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `json` - JSON objects or arrays

## Security Features

- **Encryption Support** - Keys can be marked as encrypted
- **Required Validation** - Keys can be marked as required
- **Type Validation** - Values are validated against their declared type

## Migration

To set up the new system:

1. Run the database migration:
   ```sql
   -- Execute the contents of database/migration_settings_keys.sql
   ```

2. The migration will:
   - Create the settings_keys table
   - Create the settings_keys_view
   - Add database functions
   - Set up triggers for automatic synchronization

## Usage Examples

### Direct API Usage

```bash
# Get all SMTP configuration keys
curl "http://localhost:3000/api/settings/keys?setting_name=smtp_config"

# Update SMTP host
curl -X PUT "http://localhost:3000/api/settings/keys/update-by-identifier" \
  -H "Content-Type: application/json" \
  -d '{"key_identifier": "smtp_config.smtp_host", "value": "smtp.gmail.com"}'

# Update by setting and key names
curl -X PUT "http://localhost:3000/api/settings/keys/update-by-names" \
  -H "Content-Type: application/json" \
  -d '{"setting_name": "smtp_config", "key_name": "smtp_port", "value": "587"}'
```

### Frontend Integration

The settings page now includes an "Edit Keys" button that opens the SettingKeyEditor component, allowing users to:

1. View all setting keys with their identifiers
2. Edit individual key values inline
3. See key metadata (type, required status, etc.)
4. Filter keys by various criteria

## Benefits

1. **Granular Control** - Update individual configuration values without affecting others
2. **Unique Identification** - Each key has a globally unique identifier
3. **Type Safety** - Values are validated against their declared types
4. **Audit Trail** - Changes are tracked with timestamps
5. **User-Friendly Interface** - Intuitive UI for managing keys
6. **Backward Compatibility** - Existing settings functionality remains unchanged

## Future Enhancements

Potential improvements for the future:
- Bulk key updates
- Key value validation rules
- Key dependency management
- Change history and rollback
- Key templates and presets
- API rate limiting for key updates 