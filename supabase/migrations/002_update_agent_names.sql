-- Update agent names to new identity system
UPDATE agents SET name = 'VEX' WHERE role = 'validator';
UPDATE agents SET name = 'ARC' WHERE role = 'architect';
UPDATE agents SET name = 'SCAN' WHERE role = 'analyst';
UPDATE agents SET name = 'FLUX' WHERE role = 'reviewer';
UPDATE agents SET name = 'SYNC' WHERE role = 'consensus';
UPDATE agents SET name = 'SAGE' WHERE role = 'oracle';

-- Also update validators table names
UPDATE validators SET name = 'VEX' WHERE pubkey LIKE '%Va1idator%';
UPDATE validators SET name = 'ARC' WHERE pubkey LIKE '%Architect%';
UPDATE validators SET name = 'SCAN' WHERE pubkey LIKE '%Ana1yst%';
UPDATE validators SET name = 'FLUX' WHERE pubkey LIKE '%Reviewer%';
UPDATE validators SET name = 'SYNC' WHERE pubkey LIKE '%Consensus%';
UPDATE validators SET name = 'SAGE' WHERE pubkey LIKE '%0rac1e%';
