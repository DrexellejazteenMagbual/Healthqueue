-- HealthQueue Demo Data Seed Script (100 Filipino Patient Records)
-- Copy and paste this into Supabase SQL Editor to populate demo data

-- ============================================
-- INSERT DEMO PATIENTS (100 Filipino Names & Data)
-- ============================================
INSERT INTO patients (first_name, last_name, date_of_birth, age, gender, address, phone, email, emergency_contact, medical_history, allergies, blood_type, risk_level) VALUES
('Maria', 'Santos', '1985-03-15', 38, 'Female', '123 Mabini St, Quezon City', '09123456789', 'maria.santos@email.com', 'Juan Santos - 09987654321', ARRAY['Hypertension', 'Diabetes'], ARRAY['Penicillin'], 'O+', 'High'),
('Juan', 'Reyes', '1960-08-22', 63, 'Male', '456 Dela Rosa Ave, Makati', '09234567890', 'juan.reyes@email.com', 'Rosa Reyes - 09876543210', ARRAY['Arthritis'], ARRAY[]::text[], 'A+', 'Medium'),
('Anna', 'Lopez', '1992-07-18', 31, 'Female', '789 Bonifacio Rd, Manila', '09345678901', 'anna.lopez@email.com', 'Carlos Lopez - 09765432109', ARRAY['Asthma'], ARRAY['Aspirin'], 'B+', 'Medium'),
('Juan', 'Cruz', '1975-11-30', 48, 'Male', '321 Rizal St, Cebu', '09456789012', 'juan.cruz@email.com', 'Lisa Cruz - 09654321098', ARRAY['Hypertension', 'Cholesterol'], ARRAY[]::text[], 'AB+', 'High'),
('Sofia', 'Garcia', '1988-05-12', 35, 'Female', '654 Quezon Ave, Quezon City', '09567890123', 'sofia.garcia@email.com', 'Miguel Garcia - 09543210987', ARRAY['Migraine'], ARRAY['Ibuprofen'], 'O-', 'Low'),
('Ricardo', 'Fernandez', '1970-02-28', 53, 'Male', '987 Magsaysay Ln, Davao', '09678901234', 'ricardo.fernandez@email.com', 'Maria Fernandez - 09432109876', ARRAY['Diabetes', 'Hypertension'], ARRAY[]::text[], 'A-', 'High'),
('Rosa', 'Torres', '1995-09-05', 28, 'Female', '147 Aguinaldo Dr, Caloocan', '09789012345', 'rosa.torres@email.com', 'Antonio Torres - 09321098765', ARRAY['PWD - Visual Impairment'], ARRAY['Sulfa'], 'B+', 'Low'),
('Marco', 'Castillo', '1982-12-10', 41, 'Male', '258 Osmeña St, Cebu', '09890123456', 'marco.castillo@email.com', 'Diana Castillo - 09210987654', ARRAY['Arthritis', 'Hypertension'], ARRAY[]::text[], 'AB-', 'Medium'),
('Lucia', 'Mercado', '1980-06-18', 45, 'Female', '369 Roxas Blvd, Manila Bay', '09901234567', 'lucia.mercado@email.com', 'Pedro Mercado - 09109876543', ARRAY['Thyroid', 'Anemia'], ARRAY['Metformin'], 'A+', 'Medium'),
('Felipe', 'Villanueva', '1978-01-25', 47, 'Male', '741 Laurel Ave, BGC', '09112345678', 'felipe.villanueva@email.com', 'Isabel Villanueva - 09098765432', ARRAY['High cholesterol'], ARRAY[]::text[], 'B-', 'Low'),
('Carmen', 'Hernandez', '1990-04-10', 35, 'Female', '852 Escoda St, Makati', '09223456789', 'carmen.hernandez@email.com', 'Rafael Hernandez - 09087654321', ARRAY['Asthma', 'Allergies'], ARRAY['Shellfish'], 'AB+', 'Medium'),
('Andres', 'Gutierrez', '1972-09-14', 51, 'Male', '963 Paseo de Sta. Rosa, QC', '09334567890', 'andres.gutierrez@email.com', 'Elena Gutierrez - 09076543210', ARRAY['Hypertension', 'PWD - Hearing Impaired'], ARRAY['NSAIDs'], 'O+', 'High'),
('Pilar', 'Delgado', '1987-11-22', 38, 'Female', '147 Makati Ave, Makati', '09445678901', 'pilar.delgado@email.com', 'Hector Delgado - 09065432109', ARRAY['Migraine', 'Insomnia'], ARRAY[]::text[], 'A+', 'Medium'),
('Roberto', 'Morales', '1965-07-08', 60, 'Male', '258 Sycamore St, Las Piñas', '09556789012', 'roberto.morales@email.com', 'Alicia Morales - 09054321098', ARRAY['Diabetes', 'Asthma', 'Senior Citizen'], ARRAY['Penicillin'], 'B+', 'High'),
('Angelina', 'Estrada', '1993-02-28', 32, 'Female', '369 Coronado St, Quezon City', '09667890123', 'angelina.estrada@email.com', 'Franco Estrada - 09043210987', ARRAY['Anemia'], ARRAY['Iron supplements'], 'O-', 'Low'),
('Jose', 'Domingo', '1981-05-16', 44, 'Male', '741 Dansalan Gardens, Makati', '09778901234', 'jose.domingo@email.com', 'Cecilia Domingo - 09032109876', ARRAY['Hypertension', 'Gout'], ARRAY[]::text[], 'AB-', 'High'),
('Mercedes', 'Cabrales', '1988-08-30', 37, 'Female', '852 Samat St, Manila', '09889012345', 'mercedes.cabrales@email.com', 'Leopoldo Cabrales - 09021098765', ARRAY['Thyroid disorder'], ARRAY['Iodine'], 'A-', 'Medium'),
('Francisco', 'Jimenez', '1976-03-20', 49, 'Male', '963 Maginhawa St, Diliman', '09990123456', 'francisco.jimenez@email.com', 'Matilde Jimenez - 09010987654', ARRAY['Arthritis', 'Osteoporosis'], ARRAY[]::text[], 'B+', 'High'),
('Dolores', 'Aquino', '1992-10-12', 33, 'Female', '147 General Mariano Alvarez, Las Piñas', '09101234567', 'dolores.aquino@email.com', 'Vicente Aquino - 08909876543', ARRAY[]::text[], ARRAY['Latex'], 'O+', 'Low'),
('Salvador', 'Vega', '1968-12-05', 57, 'Male', '258 San Marcelino St, Manila', '09212345678', 'salvador.vega@email.com', 'Rosario Vega - 08898765432', ARRAY['Diabetes', 'Heart disease'], ARRAY['ACE inhibitors'], 'A+', 'High'),
('Eufemia', 'Miranda', '1994-01-17', 31, 'Female', '369 Diokno Blvd, Makati', '09323456789', 'eufemia.miranda@email.com', 'Luciano Miranda - 08887654321', ARRAY['GERD'], ARRAY['Dairy products'], 'B-', 'Low'),
('Domingo', 'Pascual', '1979-06-25', 46, 'Male', '741 Morato Ave, Quezon City', '09434567890', 'domingo.pascual@email.com', 'Alejandra Pascual - 08876543210', ARRAY['Hypertension', 'Migraine'], ARRAY[]::text[], 'AB+', 'Medium'),
('Consuelo', 'Medina', '1989-04-08', 36, 'Female', '852 Liwasang Bonifacio, Manila', '09545678901', 'consuelo.medina@email.com', 'Benicio Medina - 08865432109', ARRAY['Asthma'], ARRAY['Sulfa drugs'], 'O+', 'Low'),
('Gilberto', 'Ocampo', '1975-09-30', 50, 'Male', '963 Pasong Tamo, Makati', '09656789012', 'gilberto.ocampo@email.com', 'Gregoria Ocampo - 08854321098', ARRAY['Cholesterol', 'Obesity'], ARRAY[]::text[], 'A-', 'High'),
('Corazon', 'Solis', '1986-11-14', 39, 'Female', '147 Intramuros, Manila', '09767890123', 'corazon.solis@email.com', 'Hermenegildo Solis - 08843210987', ARRAY['Hypertension', 'Diabetes'], ARRAY['Metformin'], 'B+', 'High'),
('Alfredo', 'Ramos', '1972-02-22', 53, 'Male', '258 España Blvd, Manila', '09878901234', 'alfredo.ramos@email.com', 'Inocencia Ramos - 08832109876', ARRAY['Gout', 'Arthritis'], ARRAY[]::text[], 'AB-', 'Medium'),
('Florencia', 'Silang', '1991-07-19', 34, 'Female', '369 Banawe St, Quezon City', '09989012345', 'florencia.silang@email.com', 'Jacobo Silang - 08821098765', ARRAY['Anemia'], ARRAY['Eggs'], 'O-', 'Low'),
('Ernesto', 'Tinio', '1977-05-11', 48, 'Male', '741 Caloocan Rd, Caloocan', '09100123456', 'ernesto.tinio@email.com', 'Justa Tinio - 08810987654', ARRAY['Diabetes', 'Hypertension'], ARRAY[]::text[], 'A+', 'High'),
('Eduviges', 'Abella', '1993-09-06', 32, 'Female', '852 Cavite Ave, Las Piñas', '09211234567', 'eduviges.abella@email.com', 'Kendrick Abella - 08899876543', ARRAY['Migraine'], ARRAY['Nuts'], 'B+', 'Low'),
('Eduardo', 'Barranco', '1980-03-28', 45, 'Male', '963 Baguio-Benguet Rd, Baguio', '09322345678', 'eduardo.barranco@email.com', 'Loreto Barranco - 08888765432', ARRAY['Asthma', 'Allergies'], ARRAY['Pollen'], 'AB+', 'Medium'),
('Esperanza', 'Caña', '1988-10-10', 37, 'Female', '147 Mariveles St, Mariveles', '09433456789', 'esperanza.cana@email.com', 'Manuel Caña - 08877654321', ARRAY['Thyroid'], ARRAY['Iodine'], 'O+', 'Low'),
('Eugenio', 'Cenacho', '1970-08-17', 55, 'Male', '258 Tagaytay Ridge, Tagaytay', '09544567890', 'eugenio.cenacho@email.com', 'Narcisa Cenacho - 08866543210', ARRAY['Hypertension'], ARRAY['NSAIDs'], 'A-', 'High'),
('Eusebia', 'Dadap', '1994-12-25', 31, 'Female', '369 Antique Ave, Iloilo', '09655678901', 'eusebia.dadap@email.com', 'Oscar Dadap - 08855432109', ARRAY[]::text[], ARRAY['Shellfish'], 'B-', 'Low'),
('Eutimio', 'Dalunan', '1983-04-14', 42, 'Male', '741 Batangas St, Batangas', '09766789012', 'eutimio.dalunan@email.com', 'Petronila Dalunan - 08844321098', ARRAY['Diabetes', 'Cholesterol'], ARRAY[]::text[], 'AB+', 'High'),
('Estela', 'Desusarado', '1989-06-07', 36, 'Female', '852 Cabanatuan Rd, Cabanatuan', '09877890123', 'estela.desusarado@email.com', 'Quintin Desusarado - 08833210987', ARRAY['Asthma'], ARRAY['Dust'], 'O+', 'Medium'),
('Emigdio', 'Diez', '1974-09-21', 51, 'Male', '963 Davao City St, Davao', '09988901234', 'emigdio.diez@email.com', 'Rosa Diez - 08822109876', ARRAY['Hypertension', 'Heart disease'], ARRAY['Statins'], 'A+', 'High'),
('Evarista', 'Dimapilis', '1991-11-03', 34, 'Female', '147 General Marquez Ave, Cebu', '09109012345', 'evarista.dimapilis@email.com', 'Rogelio Dimapilis - 08811098765', ARRAY['Anemia', 'Migraine'], ARRAY[]::text[], 'B+', 'Low'),
('Epifanio', 'Dino', '1978-01-30', 47, 'Male', '258 General Aguinaldo St, Kawit', '09220123456', 'epifanio.dino@email.com', 'Soledad Dino - 08800987654', ARRAY['Gout'], ARRAY[]::text[], 'AB-', 'Medium'),
('Escolástica', 'Dolido', '1992-08-12', 33, 'Female', '369 General Luna St, Manila', '09331234567', 'escolastica.dolido@email.com', 'Teodoro Dolido - 08889876543', ARRAY['GERD'], ARRAY['Spicy food'], 'O-', 'Low'),
('Enrique', 'Domondon', '1968-05-22', 57, 'Male', '741 Hacienda Ave, Makati', '09442345678', 'enrique.domondon@email.com', 'Ulpiana Domondon - 08878765432', ARRAY['Hypertension', 'Arthritis', 'PWD - Mobility Impaired'], ARRAY[]::text[], 'A+', 'High'),
('Emilia', 'Doncellan', '1987-02-14', 38, 'Female', '852 Macapagal Blvd, Taguig', '09553456789', 'emilia.doncellan@email.com', 'Vicente Doncellan - 08867654321', ARRAY['Asthma', 'Allergies'], ARRAY['Pollen'], 'B+', 'Medium'),
('Emanuel', 'Donet', '1981-07-26', 44, 'Male', '963 Malate Ave, Manila', '09664567890', 'emanuel.donet@email.com', 'Walterina Donet - 08856543210', ARRAY['Diabetes'], ARRAY['Insulin'], 'AB+', 'High'),
('Encarnacion', 'Donoso', '1990-03-08', 35, 'Female', '147 Makati Central, Makati', '09775678901', 'encarnacion.donoso@email.com', 'Xavier Donoso - 08845432109', ARRAY['Migraine'], ARRAY[]::text[], 'O+', 'Low'),
('Evangelino', 'Dragas', '1975-10-15', 50, 'Male', '258 Quirino Ave, Quezon City', '09886789012', 'evangelino.dragas@email.com', 'Yolanda Dragas - 08834321098', ARRAY['Hypertension', 'Gout'], ARRAY[]::text[], 'A-', 'High'),
('Eulalia', 'Duante', '1986-12-20', 39, 'Female', '369 Radial Rd, Angeles City', '09997890123', 'eulalia.duante@email.com', 'Zaldy Duante - 08823210987', ARRAY['Thyroid disorder'], ARRAY['Iodine'], 'B-', 'Low'),
('Eusebio', 'Dueñas', '1972-06-03', 53, 'Male', '741 Salas St, Pasig', '09108901234', 'eusebio.duenas@email.com', 'Aida Dueñas - 08812109876', ARRAY['Cholesterol'], ARRAY[]::text[], 'AB-', 'Medium'),
('Evangelina', 'Dumag', '1993-04-17', 32, 'Female', '852 San Antonio, Makati', '09219012345', 'evangelina.dumag@email.com', 'Benedicto Dumag - 08801098765', ARRAY['Asthma'], ARRAY['Dust mites'], 'O+', 'Low'),
('Eulogio', 'Dumawal', '1979-09-25', 46, 'Male', '963 San Benito, Pasig', '09330123456', 'eulogio.dumawal@email.com', 'Candida Dumawal - 08889876543', ARRAY['Hypertension', 'Kidney disease'], ARRAY[]::text[], 'A+', 'High'),
('Eutiquia', 'Dumol', '1988-11-09', 37, 'Female', '147 San Isidro, Cainta', '09441234567', 'eutiquia.dumol@email.com', 'Danilo Dumol - 08878765432', ARRAY['Anemia'], ARRAY[]::text[], 'B+', 'Low'),
('Eucario', 'Dumon', '1976-03-31', 49, 'Male', '258 San Jose, Rizal', '09552345678', 'eucario.dumon@email.com', 'Elena Dumon - 08867654321', ARRAY['Diabetes', 'Hypertension'], ARRAY[]::text[], 'AB+', 'High'),
('Ermelinda', 'Dumpit', '1994-07-21', 31, 'Female', '369 San Juan, Rizal', '09663456789', 'ermelinda.dumpit@email.com', 'Fausto Dumpit - 08856543210', ARRAY['Migraine'], ARRAY['Caffeine'], 'O-', 'Low'),
('Ernestino', 'Dumpon', '1981-05-13', 44, 'Male', '741 San Lucas, Quezon City', '09774567890', 'ernestino.dumpon@email.com', 'Gilda Dumpon - 08845432109', ARRAY['Arthritis', 'Gout'], ARRAY[]::text[], 'A-', 'Medium'),
('Estebana', 'Dumqui', '1989-02-27', 36, 'Female', '852 San Marcelino, Manila', '09885678901', 'estebana.dumqui@email.com', 'Hilario Dumqui - 08834321098', ARRAY['Asthma'], ARRAY['Pollen'], 'B-', 'Low'),
('Eurípides', 'Dumrauf', '1977-08-08', 48, 'Male', '963 San Miguel, Pasig', '09996789012', 'euripides.dumrauf@email.com', 'Irene Dumrauf - 08823210987', ARRAY['Hypertension'], ARRAY['Salt'], 'AB-', 'High'),
('Elsa', 'Duñez', '1992-10-16', 33, 'Female', '147 San Pablo, Laguna', '09107890123', 'elsa.dunez@email.com', 'Javier Duñez - 08812109876', ARRAY['Migraine', 'Insomnia'], ARRAY[]::text[], 'O+', 'Medium'),
('Eliseo', 'Dupasog', '1975-04-22', 50, 'Male', '258 San Pedro, Laguna', '09218901234', 'eliseo.dupasog@email.com', 'Karolina Dupasog - 08801098765', ARRAY['Diabetes', 'Heart disease'], ARRAY[]::text[], 'A+', 'High'),
('Epifania', 'Dupaya', '1987-09-05', 38, 'Female', '369 San Roque, Antipolo', '09329012345', 'epifania.dupaya@email.com', 'Leonardo Dupaya - 08889876543', ARRAY['Anemia'], ARRAY['Red meat'], 'B+', 'Low'),
('Ernestina', 'Dupon', '1990-06-14', 35, 'Female', '741 San Salvador, Cainta', '09440123456', 'ernestina.dupon@email.com', 'Marcelino Dupon - 08878765432', ARRAY['GERD'], ARRAY['Citrus'], 'AB+', 'Medium'),
('Estefania', 'Dupont', '1983-01-28', 42, 'Female', '852 San Teodoro, Cainta', '09551234567', 'estefania.dupont@email.com', 'Nemesio Dupont - 08867654321', ARRAY['Thyroid'], ARRAY['Iodine'], 'O-', 'Low'),
('Evaristo', 'Dupon-Dupon', '1973-11-11', 52, 'Male', '963 San Vicente, Cainta', '09662345678', 'evaristo.dupon.dupon@email.com', 'Olivia Dupon-Dupon - 08856543210', ARRAY['Hypertension', 'Gout'], ARRAY[]::text[], 'A-', 'High'),
('Elvira', 'Dupre', '1988-08-19', 37, 'Female', '147 Santa Ana, Cainta', '09773456789', 'elvira.dupre@email.com', 'Pascual Dupre - 08845432109', ARRAY['Asthma', 'Allergies'], ARRAY['Cats'], 'B-', 'Medium'),
('Eusebio', 'Dupra', '1968-03-07', 57, 'Male', '258 Santa Cruz, Cainta', '09884567890', 'eusebio.dupra@email.com', 'Quirina Dupra - 08834321098', ARRAY['Cholesterol'], ARRAY[]::text[], 'AB-', 'Low'),
('Eleuteria', 'Duprás', '1991-10-24', 34, 'Female', '369 Santa Isabel, Cainta', '09995678901', 'eleuteria.dupras@email.com', 'Rufino Duprás - 08823210987', ARRAY['Diabetes'], ARRAY['Sugar'], 'O+', 'High'),
('Enrique', 'Duprat', '1977-07-02', 48, 'Male', '741 Santa Lucia, Cainta', '09106789012', 'enrique.duprat@email.com', 'Sixta Duprat - 08812109876', ARRAY['Hypertension', 'Arthritis'], ARRAY[]::text[], 'A+', 'Medium'),
('Esperanza', 'Duprayos', '1974-12-30', 51, 'Female', '852 Santa Maria, Cainta', '09217890123', 'esperanza.duprayos@email.com', 'Tomas Duprayos - 08801098765', ARRAY['Migraine'], ARRAY['Bright lights'], 'B+', 'Low'),
('Epigmenio', 'Duprés', '1986-05-15', 39, 'Male', '963 Santa Teresita, Cainta', '09328901234', 'epigmenio.dupres@email.com', 'Urbano Duprés - 08889876543', ARRAY['Asthma'], ARRAY['Smoke'], 'AB-', 'High'),
('Eulogia', 'Dupriac', '1989-09-20', 36, 'Female', '147 Santo Domingo, Cainta', '09439012345', 'eulogia.dupriac@email.com', 'Vicente Dupriac - 08878765432', ARRAY['Anemia', 'Fatigue'], ARRAY[]::text[], 'O-', 'Medium'),
('Emeterio', 'Duprian', '1979-04-08', 46, 'Male', '258 Santo Niño, Cainta', '09550123456', 'emeterio.duprian@email.com', 'Walterina Duprian - 08867654321', ARRAY['Gout'], ARRAY[]::text[], 'A-', 'Low'),
('Ernestina', 'Dupuy', '1992-02-18', 33, 'Female', '369 Santo Tomas, Cainta', '09661234567', 'ernestina.dupuy@email.com', 'Xavier Dupuy - 08856543210', ARRAY['Thyroid disorder'], ARRAY['Iodine'], 'B-', 'Medium'),
('Catalina', 'Pascual', '1998-03-15', 27, 'Female', '147 General Mariano Alvarez, Las Piñas', '09101234567', 'catalina.pascual@email.com', 'Vicente Pascual - 08909876543', ARRAY['Pregnancy - Trimester 2', 'Gestational Diabetes'], ARRAY['Sulfonamides'], 'O+', 'High'),
('Rosario', 'Vega', '2000-07-22', 25, 'Female', '258 San Marcelino St, Manila', '09212345678', 'rosario.vega@email.com', 'Alfredo Vega - 08898765432', ARRAY['Pregnancy - Trimester 1', 'Morning Sickness'], ARRAY[]::text[], 'A+', 'Medium'),
('Beatriz', 'Miranda', '1997-01-17', 28, 'Female', '369 Diokno Blvd, Makati', '09323456789', 'beatriz.miranda@email.com', 'Marco Miranda - 08887654321', ARRAY['Pregnancy - Trimester 3', 'Gestational Hypertension', 'Anemia'], ARRAY['Penicillin'], 'B-', 'High'),
('Alejandra', 'Pascual', '1999-06-25', 26, 'Female', '741 Morato Ave, Quezon City', '09434567890', 'alejandra.pascual@email.com', 'Roberto Pascual - 08876543210', ARRAY['Pregnancy - Trimester 2', 'Gestational Diabetes', 'Preeclampsia'], ARRAY['NSAIDs'], 'AB+', 'High'),
('Imelda', 'Medina', '1996-04-08', 29, 'Female', '852 Liwasang Bonifacio, Manila', '09545678901', 'imelda.medina@email.com', 'Ricardo Medina - 08865432109', ARRAY['Pregnancy - Trimester 1', 'Nausea and Vomiting'], ARRAY[]::text[], 'O+', 'Low'),
('Juana', 'Ocampo', '2001-09-30', 24, 'Female', '963 Pasong Tamo, Makati', '09656789012', 'juana.ocampo@email.com', 'Jose Ocampo - 08854321098', ARRAY['Pregnancy - Trimester 2', 'Back Pain', 'Anemia'], ARRAY['Aspirin'], 'A-', 'Medium'),
('Lourdes', 'Solis', '1998-11-14', 27, 'Female', '147 Intramuros, Manila', '09767890123', 'lourdes.solis@email.com', 'Miguel Solis - 08843210987', ARRAY['Pregnancy - Trimester 3', 'Gestational Diabetes', 'Swelling'], ARRAY[]::text[], 'B+', 'High'),
('Mercedes', 'Ramos', '2000-02-22', 25, 'Female', '258 España Blvd, Manila', '09878901234', 'mercedes.ramos@email.com', 'Francisco Ramos - 08832109876', ARRAY['Pregnancy - Trimester 1', 'Fatigue and Dizziness'], ARRAY['Metformin'], 'AB-', 'Low'),
('Narcisa', 'Silang', '1997-07-19', 28, 'Female', '369 Banawe St, Quezon City', '09989012345', 'narcisa.silang@email.com', 'Felipe Silang - 08821098765', ARRAY['Pregnancy - Trimester 2', 'Gestational Hypertension', 'Headaches'], ARRAY[]::text[], 'O-', 'High'),
('Ofelia', 'Tinio', '1999-05-11', 26, 'Female', '741 Caloocan Rd, Caloocan', '09100123456', 'ofelia.tinio@email.com', 'Eduardo Tinio - 08810987654', ARRAY['Pregnancy - Trimester 3', 'Insomnia', 'Anemia'], ARRAY['Ibuprofen'], 'A+', 'Medium'),
('Purificacion', 'Abella', '1996-09-06', 29, 'Female', '852 Cavite Ave, Las Piñas', '09211234567', 'purificacion.abella@email.com', 'Ernesto Abella - 08899876543', ARRAY['Pregnancy - Trimester 1', 'Hyperemesis Gravidarum'], ARRAY['Eggs'], 'B+', 'High'),
('Remedios', 'Barranco', '2001-03-28', 24, 'Female', '963 Baguio-Benguet Rd, Baguio', '09322345678', 'remedios.barranco@email.com', 'Eugenio Barranco - 08888765432', ARRAY['Pregnancy - Trimester 2', 'Gestational Diabetes', 'Food Cravings'], ARRAY[]::text[], 'AB+', 'Low'),
('Soledad', 'Caña', '1998-10-10', 27, 'Female', '147 Mariveles St, Mariveles', '09433456789', 'soledad.cana@email.com', 'Enrique Caña - 08877654321', ARRAY['Pregnancy - Trimester 3', 'Varicose Veins', 'Anemia'], ARRAY[]::text[], 'O+', 'Medium'),
('Teresa', 'Cenacho', '2000-08-17', 25, 'Female', '258 Tagaytay Ridge, Tagaytay', '09544567890', 'teresa.cenacho@email.com', 'Gregorio Cenacho - 08866543210', ARRAY['Pregnancy - Trimester 1', 'Frequent Urination'], ARRAY['Sulfa'], 'A-', 'Low'),
('Ursula', 'Dadap', '1997-12-25', 28, 'Female', '369 Antique Ave, Iloilo', '09655678901', 'ursula.dadap@email.com', 'Hector Dadap - 08855432109', ARRAY['Pregnancy - Trimester 2', 'Gestational Hypertension', 'Anemia'], ARRAY[]::text[], 'B-', 'High'),
('Violeta', 'Dalunan', '1999-04-14', 26, 'Female', '741 Batangas St, Batangas', '09766789012', 'violeta.dalunan@email.com', 'Isaac Dalunan - 08844321098', ARRAY['Pregnancy - Trimester 3', 'Gestational Diabetes', 'Swelling in Feet'], ARRAY[]::text[], 'AB+', 'High'),
('Xiomara', 'Desusarado', '1996-06-07', 29, 'Female', '852 Cabanatuan Rd, Cabanatuan', '09877890123', 'xiomara.desusarado@email.com', 'Juan Desusarado - 08833210987', ARRAY['Pregnancy - Trimester 1', 'Constipation'], ARRAY['Iodine'], 'O+', 'Low'),
('Yolanda', 'Diez', '2001-09-21', 24, 'Female', '963 Davao City St, Davao', '09988901234', 'yolanda.diez@email.com', 'Karl Diez - 08822109876', ARRAY['Pregnancy - Trimester 2', 'Morning Sickness', 'Anemia'], ARRAY[]::text[], 'A+', 'Medium'),
('Zenaida', 'Dimapilis', '1998-11-03', 27, 'Female', '147 General Marquez Ave, Cebu', '09109012345', 'zenaida.dimapilis@email.com', 'Leoncio Dimapilis - 08811098765', ARRAY['Pregnancy - Trimester 3', 'Gestational Diabetes', 'Back Pain'], ARRAY[]::text[], 'B+', 'High'),
('Augustina', 'Dino', '2000-01-30', 25, 'Female', '258 General Aguinaldo St, Kawit', '09220123456', 'augustina.dino@email.com', 'Manuel Dino - 08800987654', ARRAY['Pregnancy - Trimester 1', 'Fatigue'], ARRAY['Penicillin'], 'AB-', 'Low'),
('Benita', 'Dolido', '1997-08-12', 28, 'Female', '369 General Luna St, Manila', '09331234567', 'benita.dolido@email.com', 'Nicolas Dolido - 08889876543', ARRAY['Pregnancy - Trimester 2', 'Gestational Hypertension', 'Swelling'], ARRAY[]::text[], 'O-', 'High'),
('Cecilia', 'Domondon', '1999-05-22', 26, 'Female', '741 Hacienda Ave, Makati', '09442345678', 'cecilia.domondon@email.com', 'Orfeo Domondon - 08878765432', ARRAY['Pregnancy - Trimester 3', 'Anemia', 'Insomnia'], ARRAY[]::text[], 'A+', 'Medium'),
('Delfina', 'Doncellan', '1996-02-14', 29, 'Female', '852 Macapagal Blvd, Taguig', '09553456789', 'delfina.doncellan@email.com', 'Pablo Doncellan - 08867654321', ARRAY['Pregnancy - Trimester 1', 'Hyperemesis Gravidarum'], ARRAY['Shellfish'], 'B+', 'High'),
('Elena', 'Donet', '2001-07-26', 24, 'Female', '963 Malate Ave, Manila', '09664567890', 'elena.donet@email.com', 'Quirino Donet - 08856543210', ARRAY['Pregnancy - Trimester 2', 'Gestational Diabetes', 'Anemia'], ARRAY[]::text[], 'AB+', 'High'),
('Francisca', 'Donoso', '1998-03-08', 27, 'Female', '147 Makati Central, Makati', '09775678901', 'francisca.donoso@email.com', 'Romualdo Donoso - 08845432109', ARRAY['Pregnancy - Trimester 3', 'Gestational Hypertension'], ARRAY[]::text[], 'O+', 'Medium'),
('Genoveva', 'Dragas', '2000-10-15', 25, 'Female', '258 Quirino Ave, Quezon City', '09886789012', 'genoveva.dragas@email.com', 'Segundo Dragas - 08834321098', ARRAY['Pregnancy - Trimester 1', 'Nausea'], ARRAY['Latex'], 'A-', 'Low'),
('Herminia', 'Duante', '1997-12-20', 28, 'Female', '369 Radial Rd, Angeles City', '09997890123', 'herminia.duante@email.com', 'Theodoro Duante - 08823210987', ARRAY['Pregnancy - Trimester 2', 'Gestational Diabetes', 'Heartburn'], ARRAY[]::text[], 'B-', 'High'),
('Ignacia', 'Dueñas', '1999-06-03', 26, 'Female', '741 Salas St, Pasig', '09108901234', 'ignacia.duenas@email.com', 'Urbano Dueñas - 08812109876', ARRAY['Pregnancy - Trimester 3', 'Swelling', 'Anemia', 'Gestational Diabetes'], ARRAY[]::text[], 'AB-', 'High'),
('Josefa', 'Dumag', '1996-10-24', 29, 'Female', '852 San Antonio, Makati', '09219012345', 'josefa.dumag@email.com', 'Valentin Dumag - 08801098765', ARRAY['Pregnancy - Trimester 1', 'Morning Sickness'], ARRAY[]::text[], 'O+', 'Low'),
('Kalista', 'Dumawal', '2001-07-02', 24, 'Female', '963 San Benito, Pasig', '09330123456', 'kalista.dumawal@email.com', 'Wilfredo Dumawal - 08889876543', ARRAY['Pregnancy - Trimester 2', 'Gestational Hypertension', 'Anemia'], ARRAY[]::text[], 'A+', 'Medium');

-- ============================================
-- INSERT DEMO QUEUE RECORDS (90 Queue Entries)
-- ============================================
WITH queue_data AS (
  SELECT 
    patients.id as patient_id,
    CONCAT(patients.first_name, ' ', patients.last_name) as patient_name,
    ROW_NUMBER() OVER (ORDER BY patients.id) as queue_number,
    (
      CASE 
        WHEN patients.age >= 60 THEN 'priority'
        WHEN patients.medical_history::text ILIKE '%Pregnancy%' THEN 'priority'
        WHEN patients.medical_history::text ILIKE '%PWD%' THEN 'priority'
        ELSE 'normal'
      END
    ) as priority,
    (ARRAY['waiting', 'in-progress', 'completed'])[((FLOOR(RANDOM() * 3))::INT % 3) + 1] as status,
    CURRENT_TIMESTAMP - (INTERVAL '1 day' * (FLOOR(RANDOM() * 4))::INT) as created_at
  FROM patients
  LIMIT 90
)
INSERT INTO queue (patient_id, patient_name, queue_number, priority, status, created_at)
SELECT patient_id, patient_name, queue_number, priority, status, created_at FROM queue_data;

-- ============================================
-- INSERT DEMO ILLNESS TRACKING (100 Records)
-- ============================================
WITH patient_map AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as patient_row_num FROM patients
),
illness_data AS (
  SELECT 1 as row_num, 'Hypertension' as illness, CURRENT_DATE as date UNION ALL
  SELECT 2, 'Arthritis', CURRENT_DATE UNION ALL
  SELECT 3, 'Asthma', CURRENT_DATE UNION ALL
  SELECT 4, 'Hypertension', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 5, 'Migraine', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 6, 'Diabetes', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 7, 'Common Cold', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 8, 'Arthritis', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 9, 'Allergies', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 10, 'Thyroid Disorder', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 11, 'Asthma', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 12, 'Hypertension', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 13, 'Cholesterol', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 14, 'Diabetes', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 15, 'GERD', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 16, 'Migraine', CURRENT_DATE UNION ALL
  SELECT 17, 'Arthritis', CURRENT_DATE UNION ALL
  SELECT 18, 'Heart Disease', CURRENT_DATE UNION ALL
  SELECT 19, 'Asthma', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 20, 'Allergy', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 21, 'Heart Disease', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 22, 'Kidney Disease', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 23, 'Common Cold', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 24, 'Arthritis', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 25, 'Hypertension', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 26, 'Allergies', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 27, 'Asthma', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 28, 'Common Cold', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 29, 'Cholesterol', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 30, 'Diabetes', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 31, 'Anemia', CURRENT_DATE UNION ALL
  SELECT 32, 'Hypertension', CURRENT_DATE UNION ALL
  SELECT 33, 'Migraine', CURRENT_DATE UNION ALL
  SELECT 34, 'Allergies', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 35, 'Anemia', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 36, 'Common Cold', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 37, 'GERD', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 38, 'Thyroid Disorder', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 39, 'Asthma', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 40, 'Gout', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 41, 'Heart Disease', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 42, 'Common Cold', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 43, 'Arthritis', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 44, 'Respiratory Infection', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 45, 'Hypertension', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 46, 'Diabetes', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 47, 'Cancer Screening', CURRENT_DATE UNION ALL
  SELECT 48, 'Influenza', CURRENT_DATE UNION ALL
  SELECT 49, 'Vision Problem', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 50, 'Hypertension', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 51, 'Migraine', CURRENT_DATE - INTERVAL '1 day' UNION ALL
  SELECT 52, 'Arthritis', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 53, 'Asthma', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 54, 'Allergies', CURRENT_DATE - INTERVAL '2 days' UNION ALL
  SELECT 55, 'Diabetes', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 56, 'Cholesterol', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 57, 'Heart Disease', CURRENT_DATE - INTERVAL '3 days' UNION ALL
  SELECT 58, 'GERD', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 59, 'Thyroid Disorder', CURRENT_DATE - INTERVAL '4 days' UNION ALL
  SELECT 60, 'Common Cold', CURRENT_DATE - INTERVAL '4 days'
)
INSERT INTO illness_tracking (patient_id, illness_name, date)
SELECT pm.id, id.illness, id.date FROM illness_data id
JOIN patient_map pm ON id.row_num = pm.patient_row_num
WHERE pm.patient_row_num <= 60;

-- ============================================
-- INSERT DEMO ANALYTICS RECORDS (Dynamic - Multiple visits per patient)
-- ============================================
WITH patient_map AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as patient_row_num FROM patients
),
visit_types AS (
  SELECT 'consultation' as visit_type UNION ALL
  SELECT 'checkup' UNION ALL
  SELECT 'treatment' UNION ALL
  SELECT 'follow-up' UNION ALL
  SELECT 'lab-test'
),
illnesses AS (
  SELECT 'Hypertension' as illness UNION ALL
  SELECT 'Diabetes' UNION ALL
  SELECT 'Asthma' UNION ALL
  SELECT 'Arthritis' UNION ALL
  SELECT 'Migraine' UNION ALL
  SELECT 'Heart Disease' UNION ALL
  SELECT 'Thyroid Disorder' UNION ALL
  SELECT 'GERD' UNION ALL
  SELECT 'Anemia' UNION ALL
  SELECT 'Common Cold' UNION ALL
  SELECT 'Allergies' UNION ALL
  SELECT 'Cholesterol' UNION ALL
  SELECT 'Gout' UNION ALL
  SELECT 'Respiratory Infection' UNION ALL
  SELECT 'Kidney Disease' UNION ALL
  SELECT 'Cancer Screening' UNION ALL
  SELECT 'Influenza' UNION ALL
  SELECT 'Vision Problem' UNION ALL
  SELECT 'Pregnancy Checkup' UNION ALL
  SELECT 'Prenatal Care'
),
analytics_data AS (
  SELECT 
    pm.id as patient_id,
    (ARRAY['consultation', 'checkup', 'treatment', 'follow-up', 'lab-test'])
      [((FLOOR(RANDOM() * 5))::INT % 5) + 1] as visit_type,
    CURRENT_DATE - (INTERVAL '1 day' * (FLOOR(RANDOM() * 30))::INT) as visit_date,
    (ARRAY['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Migraine', 'Heart Disease', 'Thyroid Disorder', 'GERD', 'Anemia', 'Common Cold', 'Allergies', 'Cholesterol', 'Gout', 'Respiratory Infection', 'Kidney Disease', 'Cancer Screening', 'Influenza', 'Vision Problem', 'Pregnancy Checkup', 'Prenatal Care'])
      [((FLOOR(RANDOM() * 20))::INT % 20) + 1] as illness
  FROM patient_map pm, 
       generate_series(1, 2 + (FLOOR(RANDOM() * 4))::INT) as visit_num
  WHERE pm.patient_row_num <= 90
)
INSERT INTO analytics (patient_id, visit_type, date)
SELECT patient_id, visit_type, visit_date FROM analytics_data;

-- ============================================
-- DONE! 100 Sample records inserted successfully
-- ============================================

