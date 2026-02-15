# HEALTHQUEUE SYSTEM - CAPSTONE PAPER

## CONTENTS

APPROVAL SHEET	ii
ACKNOWLEDGEMENT	iii
DEDICATION	iv
ABSTRACT	v
CONTENTS	vi
LIST OF TABLES	viii
LIST OF FIGURES	ix

Chapter I	INTRODUCTION	1
	Project Context	2
	Purpose and Description	3
	Objectives of the Project	5
	Scope and Limitations	6
	Definition of Terms	7

Chapter II	REVIEW OF RELATED LITERATURES AND SYSTEMS	9
	Existing Queue Management Practices	9
	Challenges with Traditional Manual Queue System	10
	System Requirements Identification	11
	Development of Web-based Queue Management System	13
	Implementation of Healthcare Queue Systems	14

Chapter III	DESIGN AND METHODOLOGY	17
	Development Model	17
	Rapid Application Development (RAD) Methodology	17
	Requirements Planning Phase	19
	User Design Phase	20
	Construction Phase	21
	Cutover Phase	22

Chapter IV	RESULTS AND DISCUSSION	24
	Section 1. Identifying Challenges in Existing Manual Queue 
	           Management Practices for the Development of 
	           the HealthQueue System	24
	Section 2. Designing and Developing the Web-based System	28
	Section 3. Evaluating the Acceptability of the System	48

Chapter V	CONCLUSIONS AND RECOMMENDATIONS	56
	Conclusions	56
	Recommendations	57

WORKS CITED	59

Appendix A	LETTERS OF REQUEST	61
Appendix B	DATA GATHERING RESULTS – INTERVIEW	64
Appendix C	REQUIREMENTS CATALOG	66
Appendix D	USE CASE SPECIFICATIONS	69
Appendix E	QUALITY EVALUATION	77
Appendix F	USER MANUAL	83
Appendix G	EDITING CERTIFICATION	99
Appendix H	PLAGIARISM CLEARANCE	100

CURRICULUM VITAE	102

---

## LIST OF TABLES

No	Title	Page
1	Development Tools and Technologies Used	22
2	Patient Registration Fields	25
3	Queue Status Types	26
4	User Roles and Permissions	27
5	Department Categories	28
6	File Types and Classifications	29
7	Database Tables Overview	30
8	Average Score for Functional Suitability	48
9	Average Score for Performance Efficiency	49
10	Average Score for Compatibility	50
11	Average Score for Usability	51
12	Average Score for Reliability	52
13	Average Score for Security	53
14	Average Score for Maintainability	54
15	Average Score for Portability	55

---

## LIST OF FIGURES

No	Title	Page
1	RAD Methodology Diagram	18
2	System Architecture	24
3	System Flowchart	28
4	Admin Flowchart	30
5	Doctor Flowchart	31
6	Patient Queue Flow	32
7	Login Page	33
8	Dashboard Main Page	34
9	Patient Registration Form	35
10	Patient Profiles List	36
11	Queue Management Interface	37
12	Queue Display Screen	38
13	Analytics Dashboard	39
14	File Management Page	40
15	Settings Configuration	41
16	Staff Management	42
17	Audit Logs View	43
18	Real-time Queue Updates	44
19	Patient Card Details	45
20	Priority Queue Assignment	46
21	Recent Patients Widget	47

---

## ABSTRACT

The HealthQueue Patient Queue Management System was developed to solve the problems of traditional manual queue management in healthcare facilities. Many clinics and hospitals still use paper-based systems and manual tracking, which cause long patient wait times and poor patient experience. This capstone project aims to modernize the patient queue process by creating a secure and efficient digital system for managing patient flow in healthcare facilities. Using the Rapid Application Development (RAD) methodology, the system was built with important security features such as Role-Based Access Control (RBAC), audit logging for tracking user actions, real-time queue updates, and analytics dashboard for monitoring performance. The system also follows healthcare data privacy standards to protect patient information. HealthQueue improves clinic operations by providing real-time patient tracking, managing queues across different departments, generating helpful reports through analytics, and supporting multiple users at the same time. The system has different access levels for doctors, nurses, and administrative staff, with each role having specific permissions based on their job requirements. Overall, HealthQueue reduces patient waiting time and improves the quality of healthcare service delivery.

**Keywords:** patient queue management, healthcare technology, RBAC, RAD methodology, real-time system

---

## Chapter I
## INTRODUCTION

In any healthcare facility, managing patient flow efficiently is crucial for delivering quality care and maintaining patient satisfaction. Among healthcare facilities, the most common method for managing patient queues is manual tracking, where staff members write patient information on paper forms, call out names from waiting lists, and manually update patient statuses throughout the day. The term "queue" comes from the Latin word "cauda," meaning tail, referring to the line of people waiting for service (Hall, 2013).

With manual queue management, reception staff record patient arrivals on paper logbooks or basic spreadsheets. Nurses and doctors rely on verbal communication or handwritten notes to track which patient should be seen next and in which room. However, having staff manage queues manually is time-consuming and can lead to mistakes, such as calling the wrong patient, losing track of waiting times, or creating confusion when multiple departments are involved. According to Ahmad et al. (2020), poor queue management in hospitals can significantly increase patient waiting times and reduce overall hospital efficiency. Furthermore, Hassan et al. (2022) found that ineffective queue management systems directly correlate with decreased patient satisfaction and increased frustration among healthcare staff.

To overcome these challenges, we developed a web-based patient queue management system called HealthQueue. HealthQueue provides superior accuracy, effectiveness, and convenience over manual tracking methods and eliminates the chance for errors in patient flow management. The system was developed using Rapid Application Development (RAD) methodology, which allowed for quick prototyping and iterative improvements based on user feedback (Beynon-Davies et al., 1999). The system has important security features like Role-Based Access Control (RBAC), audit logging, and data encryption to ensure patient information is protected and only authorized staff can access sensitive medical records. Using HealthQueue, healthcare facilities can monitor patient queues in real-time, track wait times automatically, and generate reports for performance analysis, resulting in faster service and better-organized patient care.

Modernizing queue management systems like HealthQueue can significantly improve healthcare delivery by reducing patient wait times and improving operational efficiency. Safdar et al. (2020) demonstrated that implementing an optimized queue management system can improve patient flow in healthcare facilities without appointment systems. Moreover, Bidari et al. (2021) found that digital queue management systems significantly increase patient satisfaction in emergency departments by providing transparent waiting time information and reducing perceived wait times. According to Nguyen et al. (2022), health information systems play a crucial role in addressing patient flow issues in healthcare settings, with recent studies showing increased adoption of digital solutions. Additionally, implementing web-based healthcare technologies can result in a more transparent, efficient, and patient-centered care system, ultimately enhancing the quality of healthcare services for all patients and streamlining clinic operations for medical professionals (Marbella et al., 2024).

---

## REFERENCES

Ahmad, J., Iqbal, J., Ahmad, I., Khan, Z. A., Tiwana, M. I., & Alyas, T. (2020). A simulation based study for managing hospital resources by reducing patient waiting time. *IEEE Access, 8*, 154997-155013.

Beynon-Davies, P., Carne, C., Mackay, H., & Tudhope, D. (1999). Rapid application development (RAD): An empirical review. *European Journal of Information Systems, 8*(3), 211-223.

Bidari, A., Jafarnejad, S., Farsi, D., Zare, M. A., & Abbasi, S. (2021). Effect of queue management system on patient satisfaction in emergency department: A randomized controlled trial. *Archives of Academic Emergency Medicine, 9*(1), e59.

Hall, R. (2013). *Patient flow: Reducing delay in healthcare delivery* (2nd ed.). Springer.

Hassan, H. A., Ibrahim, S., & Badran, F. M. M. (2022). Queue management system and its relation with patient satisfaction of outpatient clinics. *Egyptian Journal of Health Care, 13*(2), 1476-1489.

Marbella, H. N., Akbar, I. A., & Setiawan, B. (2024). Design and development of a web-based patient management information system. *Procedia Computer Science, 234*, 415-422.

Nguyen, Q., Wybrow, M., Burstein, F., Taylor, D., & Enticott, J. (2022). Understanding the impacts of health information systems on patient flow management: A systematic review across several decades of research. *PLoS ONE, 17*(9), e0274493.

Safdar, K. A., Emrouznejad, A., & Dey, P. K. (2020). An optimized queue management system to improve patient flow in the absence of appointment system. *International Journal of Health Care Quality Assurance, 34*(1), 30-44.

---

*Document Version: 1.0*  
*Date: February 15, 2026*  
*Status: Abstract for Capstone Documentation*
