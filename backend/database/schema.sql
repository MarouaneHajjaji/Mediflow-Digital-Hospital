CREATE DATABASE IF NOT EXISTS mediflow_hospital
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mediflow_hospital;

CREATE TABLE IF NOT EXISTS doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  profile_picture VARCHAR(255) NULL,
  email VARCHAR(190) NULL,
  department VARCHAR(120) NULL,
  availability VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash CHAR(64) NOT NULL,
  password_salt VARCHAR(120) NOT NULL,
  role ENUM('admin', 'doctor') NOT NULL DEFAULT 'doctor',
  doctor_id INT UNSIGNED NULL,
  display_name VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_users_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  gender ENUM('M', 'F') NOT NULL,
  blood_type VARCHAR(5) NOT NULL,
  last_visit DATE NOT NULL,
  status ENUM('Stable', 'Critical', 'Recovering') NOT NULL DEFAULT 'Stable',
  room VARCHAR(30) NULL,
  entry_date DATE NULL,
  exit_date DATE NULL,
  birth_date DATE NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  status_description TEXT NULL,
  medical_history TEXT NULL,
  department VARCHAR(120) NULL,
  medication VARCHAR(120) NULL,
  dosage VARCHAR(60) NULL,
  frequency VARCHAR(60) NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_department_archived ON patients (department, is_archived);
CREATE INDEX idx_patients_status_archived ON patients (status, is_archived);

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type VARCHAR(100) NOT NULL,
  status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
);

CREATE INDEX idx_appointments_date_status ON appointments (appointment_date, status);
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, appointment_date);

CREATE TABLE IF NOT EXISTS imaging_studies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  exam_type VARCHAR(150) NOT NULL,
  exam_date DATE NOT NULL,
  doctor VARCHAR(150) NOT NULL,
  status ENUM('Available', 'Processing') NOT NULL DEFAULT 'Available',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 100,
  image_data_url LONGTEXT NULL,
  report TEXT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_imaging_studies_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_imaging_patient_date ON imaging_studies (patient_id, exam_date);
CREATE INDEX idx_imaging_archived_status ON imaging_studies (is_archived, status);

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  invoice_date DATE NOT NULL,
  status ENUM('Paid', 'Unpaid', 'Pending') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

INSERT INTO doctors (name, specialty, age, profile_picture, email, department, availability)
SELECT * FROM (
  SELECT 'Dr. Hassan El Idrissi', 'Cardiologie', 46, 'https://i.pravatar.cc/150?u=dr-hassan', 'hassan.elidrissi@mediflow.com', 'Pole coeur et vaisseaux', 'Lun-Jeu 08:00-16:00'
  UNION ALL
  SELECT 'Dr. Sara Bennani', 'Pediatrie', 39, 'https://i.pravatar.cc/150?u=dr-sara', 'sara.bennani@mediflow.com', 'Pole mere-enfant', 'Lun-Ven 09:00-17:00'
  UNION ALL
  SELECT 'Dr. Yasmine Alaoui', 'Radiologie', 42, 'https://i.pravatar.cc/150?u=dr-yasmine', 'yasmine.alaoui@mediflow.com', 'Centre d imagerie', 'Lun-Sam 08:00-15:00'
  UNION ALL
  SELECT 'Dr. Mehdi Chafik', 'Neurologie', 44, 'https://i.pravatar.cc/150?u=dr-mehdi', 'mehdi.chafik@mediflow.com', 'Pole neuro-sciences', 'Mar-Sam 08:30-16:30'
  UNION ALL
  SELECT 'Dr. Karim Tazi', 'Medecine Interne', 48, 'https://i.pravatar.cc/150?u=dr-karim', 'karim.tazi@mediflow.com', 'Service de medecine interne', 'Lun-Ven 08:00-18:00'
  UNION ALL
  SELECT 'Dr. Amal Lahlou', 'Gynecologie-Obstetrique', 37, 'https://i.pravatar.cc/150?u=dr-amal', 'amal.lahlou@mediflow.com', 'Maternite et gynecologie', 'Lun-Ven 09:00-17:30'
  UNION ALL
  SELECT 'Dr. Rachid Mansouri', 'Chirurgie Generale', 50, 'https://i.pravatar.cc/150?u=dr-rachid', 'rachid.mansouri@mediflow.com', 'Bloc chirurgical', 'Lun-Jeu 07:30-15:30'
  UNION ALL
  SELECT 'Dr. Leila El Amrani', 'Biologie Medicale', 41, 'https://i.pravatar.cc/150?u=dr-leila', 'leila.elamrani@mediflow.com', 'Laboratoire central', 'Lun-Sam 07:00-14:00'
  UNION ALL
  SELECT 'Dr. Nabil Ait Haddou', 'Reanimation', 45, 'https://i.pravatar.cc/150?u=dr-nabil', 'nabil.aithaddou@mediflow.com', 'Soins intensifs', '24h / garde tournante'
  UNION ALL
  SELECT 'Dr. Ines Berrada', 'Oncologie', 38, 'https://i.pravatar.cc/150?u=dr-ines', 'ines.berrada@mediflow.com', 'Pole cancerologie', 'Lun-Ven 09:00-16:00'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);

INSERT INTO auth_users (email, password_hash, password_salt, role, doctor_id, display_name)
SELECT * FROM (
  SELECT 'admin@mediflow.com', '1f852c9425693f31df40d2fff95b80035ff07f6837d2530eb07e166b4762d272', 'admin-salt-mediflow-2026', 'admin', NULL, 'Administrateur MediFlow'
  UNION ALL
  SELECT 'hassan.elidrissi@mediflow.com', '9649f7994e67c582c920a188e6c8d100a7d48ef6cc0de824d643c69a079ed50f', 'hassan-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Hassan El Idrissi' LIMIT 1), 'Dr. Hassan El Idrissi'
  UNION ALL
  SELECT 'sara.bennani@mediflow.com', '3fa1ce408b1624e8c21471bb0b9ed3f2c7a1e30073b0195dfb4872aeeac5e97a', 'sara-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Sara Bennani' LIMIT 1), 'Dr. Sara Bennani'
  UNION ALL
  SELECT 'yasmine.alaoui@mediflow.com', 'ec1aaa9198d10ab886cc59510e443f064fb52a85764d3a07eaaaa1b9962ac219', 'yasmine-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Yasmine Alaoui' LIMIT 1), 'Dr. Yasmine Alaoui'
  UNION ALL
  SELECT 'mehdi.chafik@mediflow.com', '771324d299d05228d8431c2fe14b42f4ce80d94bd3dd4aa4975348d08e712556', 'mehdi-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Mehdi Chafik' LIMIT 1), 'Dr. Mehdi Chafik'
  UNION ALL
  SELECT 'karim.tazi@mediflow.com', '14c55b0da83c0be0d2afbcb9d63193b28c60d08efa63b02cfe4b006b43d39e34', 'karim-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Karim Tazi' LIMIT 1), 'Dr. Karim Tazi'
  UNION ALL
  SELECT 'amal.lahlou@mediflow.com', '5543fb76e983215b8214d841e6236b3e1cc1c26df72713a17067f915e8556cb0', 'amal-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Amal Lahlou' LIMIT 1), 'Dr. Amal Lahlou'
  UNION ALL
  SELECT 'rachid.mansouri@mediflow.com', 'fe1ddaccd52d22a9064ce29d04e24907e68111e816f7cd53c805ec05cf4ef59f', 'rachid-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Rachid Mansouri' LIMIT 1), 'Dr. Rachid Mansouri'
  UNION ALL
  SELECT 'leila.elamrani@mediflow.com', '2063ab52fa6fa9a9de05a23721ed4c5bf8b019927f86d912b1ada745fa231001', 'leila-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Leila El Amrani' LIMIT 1), 'Dr. Leila El Amrani'
  UNION ALL
  SELECT 'nabil.aithaddou@mediflow.com', 'df7eefdc4624416ef84c2f03efcaecca29dcf5fb65958c09f13276d14b724c41', 'nabil-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Nabil Ait Haddou' LIMIT 1), 'Dr. Nabil Ait Haddou'
  UNION ALL
  SELECT 'ines.berrada@mediflow.com', '4238eb97b257963ec5e4b1ab3e83cfb0eca592ded8853ade75317004e0808058', 'ines-salt-mediflow-2026', 'doctor', (SELECT id FROM doctors WHERE name = 'Dr. Ines Berrada' LIMIT 1), 'Dr. Ines Berrada'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM auth_users LIMIT 1);

INSERT INTO patients (
  patient_code, name, age, gender, blood_type, last_visit, status, room, entry_date, birth_date,
  phone, email, address, status_description, medical_history, department, medication, dosage, frequency, is_archived
)
SELECT * FROM (
  SELECT 'PAT-2001', 'Ahmed Alaoui', 47, 'M', 'A+', '2026-05-12', 'Critical', 'CAR-05', '2026-05-11', '1979-04-18', '0612456789', 'ahmed.alaoui@patient.mediflow.ma', 'Quartier Maarif, Casablanca', 'Dyspnee a l effort avec tension instable sous surveillance continue.', 'Hypertension arterielle depuis 8 ans, antecedent de tachycardie supraventriculaire.', 'Cardiologie', 'Bisoprolol', '5 mg', '1 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2002', 'Youssef Benali', 34, 'M', 'O+', '2026-05-10', 'Stable', 'MI-11', '2026-05-10', '1992-09-03', '0621346798', 'youssef.benali@patient.mediflow.ma', 'Hay Riad, Rabat', 'Bilan metabolique stable apres adaptation du regime alimentaire.', 'Surcharge ponderale moderee, hyperglycemie intermittente, pas d antecedent chirurgical.', 'Medecine Interne', 'Metformine', '850 mg', '2 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2003', 'Fatima Zahra Idrissi', 56, 'F', 'B+', '2026-05-08', 'Recovering', 'NEU-12', '2026-05-07', '1970-01-21', '0632567812', 'fatima.idrissi@patient.mediflow.ma', 'Ville Nouvelle, Fes', 'Regresssion des vertiges et bonne recuperation neurologique.', 'Migraines chroniques avec episode recent de vertiges centraux investigue par IRM.', 'Neurologie', 'Betahistine', '16 mg', '3 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2004', 'Salma El Fassi', 29, 'F', 'AB+', '2026-05-11', 'Stable', 'GYN-04', '2026-05-11', '1997-12-14', '0643678123', 'salma.elfassi@patient.mediflow.ma', 'Agdal, Rabat', 'Suivi gynecologique de routine sans anomalie clinique immediate.', 'SOPK equilibre, suivi gynecologique annuel regulier.', 'Gynecologie-Obstetrique', 'Acide folique', '5 mg', '1 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2005', 'Omar Tazi', 63, 'M', 'A-', '2026-05-15', 'Critical', 'REA-02', '2026-05-15', '1963-06-09', '0654781234', 'omar.tazi@patient.mediflow.ma', 'Gueliz, Marrakech', 'Insuffisance respiratoire aigue stabilisee sous oxygene haut debit.', 'BPCO severe, antecedent de sepsis pulmonaire, plusieurs hospitalisations recentes.', 'Reanimation', 'Piperacilline/Tazobactam', '4 g', 'Toutes les 8 heures', 0
  UNION ALL
  SELECT 'PAT-2006', 'Khadija Amrani', 41, 'F', 'O-', '2026-05-09', 'Recovering', 'BIO-03', '2026-05-09', '1985-03-27', '0665892345', 'khadija.amrani@patient.mediflow.ma', 'Quartier Al Qods, Oujda', 'Parametres inflammatoires en baisse avec etat general satisfaisant.', 'Infection urinaire compliquee avec syndrome inflammatoire en voie de regression.', 'Biologie Medicale', 'Cefixime', '400 mg', '1 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2007', 'Zakaria Bennani', 18, 'M', 'B-', '2026-05-06', 'Stable', 'CHG-18', '2026-05-05', '2008-11-30', '0676912456', 'zakaria.bennani@patient.mediflow.ma', 'Tanger Centre, Tanger', 'Sortie proche apres evolution post operatoire favorable.', 'Appendicite aigue operee sans complication, cicatrisation en cours.', 'Chirurgie Generale', 'Paracetamol', '1 g', '3 fois / jour', 0
  UNION ALL
  SELECT 'PAT-2008', 'Lina Chraibi', 37, 'F', 'AB-', '2026-05-13', 'Recovering', 'ONC-07', '2026-05-13', '1989-02-08', '0687123567', 'lina.chraibi@patient.mediflow.ma', 'Californie, Casablanca', 'Bonne tolerance du protocole avec fatigue moderee post cure.', 'Cancer du sein traite par chimiotherapie, bilan intermediaire encourageant.', 'Oncologie', 'Ondansetron', '8 mg', 'Si besoin', 0
  UNION ALL
  SELECT 'PAT-2009', 'Ayoub Ait Lahcen', 12, 'M', 'O+', '2026-05-14', 'Stable', 'PED-09', '2026-05-14', '2014-08-17', '0698234678', 'ayoub.aitlahcen@patient.mediflow.ma', 'Beni Mellal Centre, Beni Mellal', 'Amelioration clinique apres syndrome viral febrile.', 'Asthme intermittent leger et episode infectieux ORL recent.', 'Pediatrie', 'Salbutamol', '2 bouffees', 'Si crise', 0
  UNION ALL
  SELECT 'PAT-2010', 'Imane Berrada', 32, 'F', 'A+', '2026-05-07', 'Stable', 'RAD-06', '2026-05-07', '1994-05-02', '0609345781', 'imane.berrada@patient.mediflow.ma', 'Sidi Maarouf, Casablanca', 'Controle d imagerie rassurant avec poursuite du suivi ambulatoire.', 'Douleurs thoraciques atypiques explorees par imagerie sans lesion evolutive.', 'Radiologie', 'Ibuprofene', '400 mg', '2 fois / jour', 0
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM patients LIMIT 1);

INSERT INTO appointments (
  patient_id, doctor_id, appointment_date, appointment_time, type, status, reminder_sent, notes
)
SELECT * FROM (
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2001' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Hassan El Idrissi' LIMIT 1), '2026-05-16', '09:00:00', 'Urgence', 'Scheduled', 0, 'Controle hemodynamique et ECG.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2002' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Karim Tazi' LIMIT 1), '2026-05-16', '10:30:00', 'Consultation', 'Scheduled', 0, 'Bilan trimestriel.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2003' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Mehdi Chafik' LIMIT 1), '2026-05-16', '11:15:00', 'Suivi', 'Completed', 1, 'Evaluation post IRM.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2004' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Amal Lahlou' LIMIT 1), '2026-05-17', '08:45:00', 'Check-up', 'Scheduled', 0, 'Suivi gynecologique annuel.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2005' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Nabil Ait Haddou' LIMIT 1), '2026-05-16', '14:00:00', 'Urgence', 'Scheduled', 0, 'Reevaluation respiratoire en soins intensifs.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2006' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Leila El Amrani' LIMIT 1), '2026-05-18', '07:30:00', 'Suivi', 'Completed', 1, 'Interpretation biologique complete.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2007' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Rachid Mansouri' LIMIT 1), '2026-05-17', '12:00:00', 'Consultation', 'Scheduled', 0, 'Controle de cicatrice.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2008' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Ines Berrada' LIMIT 1), '2026-05-19', '10:00:00', 'Suivi', 'Scheduled', 1, 'Preparation du prochain cycle.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2009' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Sara Bennani' LIMIT 1), '2026-05-16', '15:15:00', 'Consultation', 'Scheduled', 0, 'Controle pediatrique post infection.'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2010' LIMIT 1), (SELECT id FROM doctors WHERE name = 'Dr. Yasmine Alaoui' LIMIT 1), '2026-05-20', '09:45:00', 'Check-up', 'Completed', 1, 'Lecture definitive du scanner.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM appointments LIMIT 1);

INSERT INTO invoices (patient_id, amount, invoice_date, status)
SELECT * FROM (
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2001' LIMIT 1), 4200.00, '2026-05-12', 'Paid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2002' LIMIT 1), 1850.00, '2026-05-10', 'Pending'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2003' LIMIT 1), 3650.00, '2026-05-08', 'Paid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2004' LIMIT 1), 2100.00, '2026-05-11', 'Pending'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2005' LIMIT 1), 9800.00, '2026-05-15', 'Unpaid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2006' LIMIT 1), 2450.00, '2026-05-09', 'Paid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2007' LIMIT 1), 5300.00, '2026-05-06', 'Paid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2008' LIMIT 1), 7600.00, '2026-05-13', 'Pending'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2009' LIMIT 1), 950.00, '2026-05-14', 'Paid'
  UNION ALL
  SELECT (SELECT id FROM patients WHERE patient_code = 'PAT-2010' LIMIT 1), 1600.00, '2026-05-07', 'Paid'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM invoices LIMIT 1);
