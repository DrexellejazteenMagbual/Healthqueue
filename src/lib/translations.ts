export type Language = 'en' | 'tl';

export interface Translations {
  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  
  // Navigation
  dashboard: string;
  patientProfiles: string;
  queueManagement: string;
  analytics: string;
  fileManagement: string;
  queueDisplay: string;
  auditLogs: string;
  settings: string;
  logout: string;
  
  // Dashboard
  totalPatients: string;
  queuedPatients: string;
  servedToday: string;
  averageWaitTime: string;
  currentQueue: string;
  recentPatients: string;
  queueOverview: string;
  
  // Patient Profiles
  addPatient: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  male: string;
  female: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  riskLevel: string;
  high: string;
  medium: string;
  low: string;
  patientDetails: string;
  
  // Queue Management
  addToQueue: string;
  selectPatient: string;
  currentQueueTitle: string;
  waiting: string;
  called: string;
  serving: string;
  completed: string;
  callPatient: string;
  startServing: string;
  completeService: string;
  removeFromQueue: string;
  priorityOverride: string;
  
  // Settings
  settingsTitle: string;
  settingsDescription: string;
  notifications: string;
  queueUpdates: string;
  newPatients: string;
  systemAlerts: string;
  displaySettings: string;
  autoRefresh: string;
  language: string;
  english: string;
  tagalog: string;
  
  // Staff Management
  staffManagement: string;
  staffManagementDescription: string;
  addStaff: string;
  addNewStaff: string;
  staffAccounts: string;
  noStaffAccounts: string;
  fullName: string;
  password: string;
  role: string;
  status: string;
  createdDate: string;
  actions: string;
  
  // Audit Logs
  auditLogsTitle: string;
  auditLogsDescription: string;
  totalEvents: string;
  deniedAccess: string;
  loginEvents: string;
  dataModifications: string;
  exportToCsv: string;
  
  // File Management
  fileManagementTitle: string;
  uploadFile: string;
  downloadFile: string;
  deleteFile: string;
  
  // Common Messages
  saveChanges: string;
  saveSuccess: string;
  deleteConfirm: string;
  accessRestricted: string;
  noData: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading',
    
    // Navigation
    dashboard: 'Dashboard',
    patientProfiles: 'Patient Profiles',
    queueManagement: 'Queue Management',
    analytics: 'Analytics',
    fileManagement: 'File Management',
    queueDisplay: 'Queue Display',
    auditLogs: 'Audit Logs',
    settings: 'Settings',
    logout: 'Logout',
    
    // Dashboard
    totalPatients: 'Total Patients',
    queuedPatients: 'Queued Patients',
    servedToday: 'Served Today',
    averageWaitTime: 'Average Wait Time',
    currentQueue: 'Current Queue',
    recentPatients: 'Recent Patients',
    queueOverview: 'Queue Overview',
    
    // Patient Profiles
    addPatient: 'Add Patient',
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    medicalHistory: 'Medical History',
    riskLevel: 'Risk Level',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    patientDetails: 'Patient Details',
    
    // Queue Management
    addToQueue: 'Add to Queue',
    selectPatient: 'Select Patient',
    currentQueueTitle: 'Current Queue',
    waiting: 'Waiting',
    called: 'Called',
    serving: 'Serving',
    completed: 'Completed',
    callPatient: 'Call Patient',
    startServing: 'Start Serving',
    completeService: 'Complete Service',
    removeFromQueue: 'Remove from Queue',
    priorityOverride: 'Priority Override',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDescription: 'Configure system preferences and options',
    notifications: 'Notifications',
    queueUpdates: 'Queue Updates',
    newPatients: 'New Patients',
    systemAlerts: 'System Alerts',
    displaySettings: 'Display Settings',
    autoRefresh: 'Auto Refresh',
    language: 'Language',
    english: 'English',
    tagalog: 'Tagalog',
    
    // Staff Management
    staffManagement: 'Staff Management',
    staffManagementDescription: 'Manage staff accounts and permissions',
    addStaff: 'Add Staff',
    addNewStaff: 'Add New Staff Member',
    staffAccounts: 'Staff Accounts',
    noStaffAccounts: 'No staff accounts found',
    fullName: 'Full Name',
    password: 'Password',
    role: 'Role',
    status: 'Status',
    createdDate: 'Created Date',
    actions: 'Actions',
    
    // Audit Logs
    auditLogsTitle: 'Audit Logs',
    auditLogsDescription: 'Security event monitoring and compliance tracking',
    totalEvents: 'Total Events',
    deniedAccess: 'Denied Access',
    loginEvents: 'Login Events',
    dataModifications: 'Data Modifications',
    exportToCsv: 'Export to CSV',
    
    // File Management
    fileManagementTitle: 'File Management',
    uploadFile: 'Upload File',
    downloadFile: 'Download',
    deleteFile: 'Delete',
    
    // Common Messages
    saveChanges: 'Save Changes',
    saveSuccess: 'Settings saved successfully!',
    deleteConfirm: 'Are you sure you want to delete this?',
    accessRestricted: 'Access Restricted',
    noData: 'No data available',
  },
  tl: {
    // Common
    save: 'I-save',
    cancel: 'Kanselahin',
    delete: 'Tanggalin',
    edit: 'I-edit',
    add: 'Magdagdag',
    search: 'Maghanap',
    loading: 'Naglo-load',
    
    // Navigation
    dashboard: 'Dashboard',
    patientProfiles: 'Mga Propayl ng Pasyente',
    queueManagement: 'Pamamahala ng Pila',
    analytics: 'Analytics',
    fileManagement: 'Pamamahala ng File',
    queueDisplay: 'Display ng Pila',
    auditLogs: 'Audit Logs',
    settings: 'Mga Setting',
    logout: 'Mag-logout',
    
    // Dashboard
    totalPatients: 'Kabuuang Pasyente',
    queuedPatients: 'Nakapila',
    servedToday: 'Naserve Ngayong Araw',
    averageWaitTime: 'Average na Oras ng Paghihintay',
    currentQueue: 'Kasalukuyang Pila',
    recentPatients: 'Kamakailang Pasyente',
    queueOverview: 'Pangkalahatang-tanaw ng Pila',
    
    // Patient Profiles
    addPatient: 'Magdagdag ng Pasyente',
    firstName: 'Pangalan',
    lastName: 'Apelyido',
    dateOfBirth: 'Petsa ng Kapanganakan',
    gender: 'Kasarian',
    male: 'Lalaki',
    female: 'Babae',
    phone: 'Telepono',
    email: 'Email',
    address: 'Tirahan',
    medicalHistory: 'Medikal na Kasaysayan',
    riskLevel: 'Antas ng Panganib',
    high: 'Mataas',
    medium: 'Katamtaman',
    low: 'Mababa',
    patientDetails: 'Detalye ng Pasyente',
    
    // Queue Management
    addToQueue: 'Idagdag sa Pila',
    selectPatient: 'Pumili ng Pasyente',
    currentQueueTitle: 'Kasalukuyang Pila',
    waiting: 'Naghihintay',
    called: 'Tinawag',
    serving: 'Siniserve',
    completed: 'Tapos Na',
    callPatient: 'Tawagin ang Pasyente',
    startServing: 'Simulan ang Serbisyo',
    completeService: 'Tapusin ang Serbisyo',
    removeFromQueue: 'Alisin sa Pila',
    priorityOverride: 'Priority Override',
    
    // Settings
    settingsTitle: 'Mga Setting',
    settingsDescription: 'I-configure ang mga kagustuhan at pagpipilian ng sistema',
    notifications: 'Mga Notipikasyon',
    queueUpdates: 'Mga Update ng Pila',
    newPatients: 'Mga Bagong Pasyente',
    systemAlerts: 'Mga Alerto ng Sistema',
    displaySettings: 'Mga Setting ng Display',
    autoRefresh: 'Auto Refresh',
    language: 'Wika',
    english: 'Ingles',
    tagalog: 'Tagalog',
    
    // Staff Management
    staffManagement: 'Pamamahala ng Staff',
    staffManagementDescription: 'Pamahalaan ang mga account at pahintulot ng staff',
    addStaff: 'Magdagdag ng Staff',
    addNewStaff: 'Magdagdag ng Bagong Staff',
    staffAccounts: 'Mga Account ng Staff',
    noStaffAccounts: 'Walang nahanap na staff account',
    fullName: 'Buong Pangalan',
    password: 'Password',
    role: 'Tungkulin',
    status: 'Katayuan',
    createdDate: 'Petsa ng Paggawa',
    actions: 'Mga Aksyon',
    
    // Audit Logs
    auditLogsTitle: 'Audit Logs',
    auditLogsDescription: 'Pagsubaybay sa seguridad at pagsunod sa regulasyon',
    totalEvents: 'Kabuuang Kaganapan',
    deniedAccess: 'Tinanggihang Access',
    loginEvents: 'Mga Login',
    dataModifications: 'Mga Pagbabago sa Data',
    exportToCsv: 'I-export sa CSV',
    
    // File Management
    fileManagementTitle: 'Pamamahala ng File',
    uploadFile: 'Mag-upload ng File',
    downloadFile: 'I-download',
    deleteFile: 'Tanggalin',
    
    // Common Messages
    saveChanges: 'I-save ang mga Pagbabago',
    saveSuccess: 'Matagumpay na na-save ang mga setting!',
    deleteConfirm: 'Sigurado ka bang gusto mong tanggalin ito?',
    accessRestricted: 'Limitadong Access',
    noData: 'Walang available na data',
  },
};

export const useTranslation = () => {
  const getLanguage = (): Language => {
    const saved = localStorage.getItem('language');
    return (saved === 'tl' || saved === 'en') ? saved : 'en';
  };

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    window.dispatchEvent(new Event('languageChange'));
  };

  return {
    language: getLanguage(),
    setLanguage,
    t: translations[getLanguage()],
  };
};
