-- Supabase Schema for PDF AI Assistant
-- Run this in the Supabase SQL Editor to set up your database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Documents table
create table if not exists documents (
    id uuid primary key default uuid_generate_v4(),
    filename text not null,
    file_size integer not null,
    page_count integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes table
create table if not exists notes (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references documents(id) on delete cascade,
    title text not null default 'Untitled Note',
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards table
create table if not exists flashcards (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references documents(id) on delete cascade,
    question text not null,
    answer text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for better query performance
create index if not exists idx_notes_document_id on notes(document_id);
create index if not exists idx_flashcards_document_id on flashcards(document_id);
create index if not exists idx_documents_created_at on documents(created_at desc);

-- Row Level Security (optional but recommended)
-- Enable RLS on all tables
alter table documents enable row level security;
alter table notes enable row level security;
alter table flashcards enable row level security;

-- For development, allow all operations (you should add proper auth policies in production)
create policy "Allow all operations on documents" on documents for all using (true);
create policy "Allow all operations on notes" on notes for all using (true);
create policy "Allow all operations on flashcards" on flashcards for all using (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on notes
create trigger update_notes_updated_at
    before update on notes
    for each row
    execute function update_updated_at_column();

