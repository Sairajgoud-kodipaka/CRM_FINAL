# CRM Import Fields Guide

## CSV Fields to Import

Based on your CSV file `feedbackmain_shivaranjni_cleaned (3).csv`, here are the fields that will be imported into the CRM:

### Direct Field Mappings

| CSV Column Name | CRM Field Name | Data Type | Description |
|----------------|----------------|-----------|-------------|
| `first_name` | `first_name` | String (50) | Customer's first name |
| `last_name` | `last_name` | String (50) | Customer's last name |
| `phone` | `phone` | String (20) | Phone number (with or without +91) |
| `city` | `city` | String (50) | City name |
| `state` | `state` | String (50) | State name |
| `assigned_to` | `assigned_to` | Foreign Key (User) | Sales person username (e.g., "Kamal Baraiya", "Jinal Parekh") |
| `catchment_area` | `catchment_area` | String (100) | Area/locality (e.g., "Shyamal Satellite", "THALTEJ") |
| `lead_source` | `lead_source` | String (50) | Source of lead (e.g., "Z Regular", "Z Potential", "EXHIBITION") |
| `reason_for_visit` | `reason_for_visit` | String (100) | Reason for customer visit (e.g., "Close") |
| `product_type` | `product_type` | String (100) | Product category (e.g., "22ct Gold", "Diamond", "Villandi") |
| `product_interest` | `product_interest` | String | Product interests (e.g., "SET - HALF", "MANIMALA, TOPS") |
| `created_at` | `created_at` | DateTime | Date of record creation (format: DD-MM-YYYY) |

### Special Handling

1. **`assigned_to`**: The system will look up the user by username. If found, assigns the customer to that user. If not found, the field will be left empty.

2. **`product_interest`**: This field can contain comma-separated values (e.g., "MANIMALA, TOPS"). The system stores this as a text field.

3. **`product_type`**: Can contain multiple values separated by commas (e.g., "22ct Gold, Gold, Villandi"). Stored as text.

4. **`created_at`**: Date format should be **DD-MM-YYYY** (e.g., `28-08-2025`). 
   - **IMPORTANT**: Dates must be plain text without quotes (no `'28-08-2025` or `"28-08-2025"`)
   - Format: `DD-MM-YYYY` (day-month-year with dashes)
   - Examples: `28-08-2025`, `04-11-2025`, `31-12-2024`
   - The system will parse this into a proper DateTime.

## Customer Table Structure in CRM

The customer data is stored in the `clients_client` table with the following structure:

### Core Customer Fields

```sql
-- Basic Information
id                  INTEGER (Primary Key, Auto-increment)
first_name          VARCHAR(50) - Customer's first name
last_name           VARCHAR(50) - Customer's last name
email               VARCHAR(254) - Email address (optional)
phone               VARCHAR(20) - Phone number
customer_type       VARCHAR(30) - 'individual', 'corporate', or 'wholesale'
status              VARCHAR(20) - 'vvip', 'vip', or 'general'

-- Address Information
address             TEXT - Full address
city                VARCHAR(50) - City name
state               VARCHAR(50) - State name
country             VARCHAR(50) - Country (defaults to 'India' if not specified)
postal_code         VARCHAR(10) - Postal/ZIP code
pincode             VARCHAR(10) - PIN code

-- Personal Information
date_of_birth       DATE - Date of birth
anniversary_date    DATE - Anniversary date
age_of_end_user     VARCHAR(30) - Age range
community           VARCHAR(50) - Community/religion
mother_tongue       VARCHAR(50) - Mother tongue language

-- Lead & Assignment
lead_source         VARCHAR(50) - Source of lead
assigned_to_id      INTEGER (Foreign Key -> User) - Assigned sales person
created_by_id       INTEGER (Foreign Key -> User) - User who created record
sales_person        VARCHAR(100) - Sales person name (text field)
sales_person_id     INTEGER (Foreign Key -> User) - Sales person user ID

-- Visit & Follow-up
reason_for_visit    VARCHAR(100) - Reason for visit
catchment_area      VARCHAR(100) - Area/locality
next_follow_up      DATE - Next follow-up date
next_follow_up_time VARCHAR(10) - Follow-up time (HH:MM format)

-- Product Preferences
preferred_metal     VARCHAR(30) - Preferred metal type
preferred_stone    VARCHAR(30) - Preferred stone type
ring_size          VARCHAR(10) - Ring size
budget_range       VARCHAR(30) - Budget range
product_type       VARCHAR(100) - Product category
style              VARCHAR(100) - Style preference
material_type      VARCHAR(100) - Material type
material_weight    DECIMAL(10,3) - Material weight
material_value     DECIMAL(12,2) - Material value
material_unit      VARCHAR(10) - Unit (default: 'g')
product_subtype    VARCHAR(100) - Product subtype
gold_range         VARCHAR(100) - Gold range
diamond_range      VARCHAR(100) - Diamond range
customer_preferences TEXT - Customer preferences
design_selected    VARCHAR(100) - Selected design
wants_more_discount VARCHAR(100) - Discount preference
checking_other_jewellers VARCHAR(100) - Competition check
let_him_visit      VARCHAR(100) - Visit permission
design_number      VARCHAR(100) - Design number

-- Additional Fields
saving_scheme       VARCHAR(30) - Saving scheme
notes              TEXT - General notes
summary_notes      TEXT - Summary notes
customer_status    VARCHAR(50) - Customer status
add_to_pipeline    BOOLEAN - Add to sales pipeline

-- Import/Transaction Fields
sr_no              VARCHAR(50) - Reference ID from import
area               VARCHAR(100) - Locality/neighborhood
client_category    VARCHAR(50) - Customer category (Z Regular, Z Privilege, etc.)
preferred_flag     BOOLEAN - Preferred/VIP flag
attended_by        VARCHAR(100) - Sales representative who served
item_category      VARCHAR(50) - Item category (22ct Gold, Diamond, etc.)
item_name          VARCHAR(100) - Product name (CHAIN, RING, etc.)
visit_date         DATE - Date of customer visit/transaction

-- Relationships
tenant_id          INTEGER (Foreign Key -> Tenant) - Multi-tenant support
store_id           INTEGER (Foreign Key -> Store) - Store assignment
tags               Many-to-Many -> CustomerTag - Customer tags

-- Timestamps
created_at         TIMESTAMP - Record creation time
updated_at         TIMESTAMP - Last update time

-- Soft Delete
is_deleted         BOOLEAN - Soft delete flag
deleted_at         TIMESTAMP - Deletion timestamp
```

## Sample Customer Record Structure

After import, a customer record would look like this:

```json
{
  "id": 123,
  "first_name": "Krishna",
  "last_name": "Patel",
  "phone": "+919687074784",
  "city": "Himmatnagar",
  "state": "Gujarat",
  "assigned_to": {
    "id": 5,
    "username": "kamal.baraiya",
    "first_name": "Kamal",
    "last_name": "Baraiya"
  },
  "catchment_area": null,
  "lead_source": "Z Regular",
  "reason_for_visit": "Close",
  "product_type": "22ct Gold",
  "product_interest": "MANIMALA, TOPS",
  "status": "general",
  "customer_type": "individual",
  "created_at": "2025-08-28T00:00:00Z",
  "updated_at": "2025-08-28T00:00:00Z",
  "is_deleted": false
}
```

## Important Notes

1. **Phone Number Format**: The system accepts phone numbers with or without country code (+91). It will store them as-is.

2. **Assigned To**: The `assigned_to` field in CSV should contain the username or full name of the sales person. The system will try to match it to an existing user.

3. **Product Interest**: This is stored as a text field. For structured product interests, the system uses a separate `customer_interests` relationship table.

4. **Date Format**: The CSV uses DD-MM-YYYY format. The system will parse this correctly.

5. **Empty Fields**: Empty fields in CSV (like empty `catchment_area`) will be stored as `NULL` in the database.

6. **Duplicate Handling**: The system can handle duplicate phone numbers or emails within the same tenant, but it's recommended to deduplicate before import.

## Fields NOT in Your CSV (Optional for Future)

These fields exist in the CRM but are not in your current CSV:
- `email` - Email address
- `address` - Full address
- `postal_code` / `pincode` - Postal code
- `date_of_birth` - Date of birth
- `anniversary_date` - Anniversary date
- `preferred_metal` - Preferred metal (can be derived from `product_type`)
- `preferred_stone` - Preferred stone
- `budget_range` - Budget range
- `notes` - General notes
- `next_follow_up` - Next follow-up date
- `community` - Community/religion
- `mother_tongue` - Mother tongue

These can be added to future CSV imports or manually updated in the CRM after import.

