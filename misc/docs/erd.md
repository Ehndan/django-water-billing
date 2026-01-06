# Barangay Mahayahay Automated Water Billing System — ERD

Entity list and key relationships captured from `billing/models.py`.

## Entities & Key Fields
- **User** (`AbstractUser` + `user_type`, `contact_number`)
- **Consumer** (`consumer_id` PK, name parts, `contact_number`, `address`, `meter_number` unique, `account_status`, timestamps)
- **MeterReading** (`reading_id` PK, FK `consumer`, `reading_date`, `previous_reading`, `current_reading`, calculated `consumption`, `created_by`/`last_modified_by` User, timestamps) — unique per (`consumer`, `reading_date`)
- **Bill** (`bill_id` PK, FK `consumer`, OneToOne `meter_reading` (nullable), `billing_period`, computed `amount`, `due_date`, `status`, `created_by`/`last_modified_by` User, timestamps) — unique per (`consumer`, `billing_period`)
- **Notification** (`id` PK auto, FK `bill`, `notification_type`, `message`, `sent_at`, `sent_successfully`)

## Mermaid ER Diagram
```mermaid
erDiagram
    User {
        string username
        string user_type
        string contact_number
    }
    Consumer {
        int consumer_id PK
        string first_name
        string middle_initial
        string last_name
        string contact_number
        text address
        string meter_number UNIQUE
        string account_status
    }
    MeterReading {
        int reading_id PK
        date reading_date
        decimal previous_reading
        decimal current_reading
        decimal consumption
    }
    Bill {
        int bill_id PK
        date billing_period
        decimal amount
        date due_date
        string status
    }
    Notification {
        int id PK
        string notification_type
        text message
        datetime sent_at
        bool sent_successfully
    }

    Consumer ||--o{ MeterReading : has
    Consumer ||--o{ Bill : billed_for
    MeterReading ||--o| Bill : generates
    Bill ||--o{ Notification : triggers

    User ||--o{ MeterReading : created_by
    User ||--o{ MeterReading : modified_by
    User ||--o{ Bill : created_by
    User ||--o{ Bill : modified_by
```

## Business Rules & Constraints
- A consumer can have many meter readings; one reading per consumer per date (`unique_consumer_reading_date`).
- A consumer can have many bills; one bill per consumer per billing period (`unique_consumer_billing_period`).
- Each bill references at most one meter reading (nullable); each meter reading can generate at most one bill (OneToOne).
- Notifications belong to a single bill; a bill can have multiple notifications (bill, reminder, disconnection).
- Billing amount auto-computes from `MeterReading.consumption` (₱100 base for ≤10 m³; +₱10 per 0.1 m³ over 10 m³).
- User links are optional on readings/bills (`SET_NULL`); supports tracking creator and last modifier.

## Suggested Slides (if presenting ERD)
1. High-level entity overview (5 boxes: User, Consumer, MeterReading, Bill, Notification)
2. Flow: Consumer → MeterReading → Bill → Notification
3. Constraints callouts: unique reading per date per consumer; unique bill per period per consumer; OneToOne reading↔bill; optional user audit trail
