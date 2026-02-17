-- Add unique index to prevent duplicate registrations by public URL.
CREATE UNIQUE INDEX `Agent_publicUrl_key` ON `Agent`(`publicUrl`);
