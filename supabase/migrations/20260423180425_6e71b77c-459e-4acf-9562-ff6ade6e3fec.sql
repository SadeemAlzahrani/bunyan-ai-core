
-- Create contracts storage bucket (private)
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- Allow authenticated users to read files in the contracts bucket
create policy "Authenticated users can read contracts"
on storage.objects for select
to authenticated
using (bucket_id = 'contracts');

-- Allow authenticated users to upload to the contracts bucket
create policy "Authenticated users can upload contracts"
on storage.objects for insert
to authenticated
with check (bucket_id = 'contracts');

-- Allow authenticated users to delete contracts they need to manage
create policy "Authenticated users can delete contracts"
on storage.objects for delete
to authenticated
using (bucket_id = 'contracts');
