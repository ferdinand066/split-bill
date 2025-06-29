# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be set up

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## 3. Set Up Environment Variables

1. Create a `.env` file in your project root
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Create Database Tables

Run these SQL commands in your Supabase SQL editor:

### Bills Table
```sql
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bill Subjects Table
```sql
CREATE TABLE bill_subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bill Information Headers Table
```sql
CREATE TABLE bill_information_headers (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  paid_by_id INTEGER REFERENCES bill_subjects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bill Information Details Table
```sql
CREATE TABLE bill_information_details (
  id SERIAL PRIMARY KEY,
  header_id INTEGER REFERENCES bill_information_headers(id) ON DELETE CASCADE,
  charged_user_id INTEGER REFERENCES bill_subjects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Create Indexes for Better Performance
```sql
CREATE INDEX idx_bills_slug ON bills(slug);
CREATE INDEX idx_bill_subjects_bill_id ON bill_subjects(bill_id);
CREATE INDEX idx_bill_information_headers_bill_id ON bill_information_headers(bill_id);
CREATE INDEX idx_bill_information_details_header_id ON bill_information_details(header_id);
```

### Enable Row Level Security (Optional)
```sql
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_information_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_information_details ENABLE ROW LEVEL SECURITY;
```

## 5. Test Your Connection

1. Start your development server: `npm run dev`
2. Try creating a new bill with participants
3. Check if the data appears in your Supabase dashboard

## Features Implemented

- ✅ Create new bills with name and participants
- ✅ View bill details with participants and bill items
- ✅ Display bill information headers with amounts
- ✅ TanStack Query for efficient data fetching
- ✅ Zod validation for form inputs
- ✅ shadcn/ui components for consistent UI
- ✅ TypeScript support with proper types

## Data Flow

1. **Create Bill** (`/create`):
   - Insert into `bills` table with name and generated slug
   - Insert into `bill_subjects` table for each participant

2. **Show Bill** (`/:slug`):
   - Fetch bill by slug
   - Fetch bill subjects (participants)
   - Fetch bill information headers (items with amounts)
   - Display all information in a clean interface

## Next Steps

- Add bill information header creation (add items to bill)
- Implement bill information details (split items between participants)
- Add bill editing functionality
- Add user authentication
- Add real-time updates with Supabase subscriptions 