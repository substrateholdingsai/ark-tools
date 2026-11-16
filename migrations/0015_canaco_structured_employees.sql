ALTER TABLE leads_ark_tools
  ADD COLUMN num_empleados INTEGER
  CHECK (num_empleados IS NULL OR num_empleados BETWEEN 1 AND 5000);
