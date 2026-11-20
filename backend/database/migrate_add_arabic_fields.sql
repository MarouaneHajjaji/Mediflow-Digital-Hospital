USE mediflow_hospital;

ALTER TABLE doctors
  ADD COLUMN email VARCHAR(190) NULL AFTER profile_picture,
  ADD COLUMN department VARCHAR(120) NULL AFTER email,
  ADD COLUMN availability VARCHAR(120) NULL AFTER department;

ALTER TABLE patients
  ADD COLUMN email VARCHAR(190) NULL AFTER phone,
  ADD COLUMN medical_history TEXT NULL AFTER status_description;
