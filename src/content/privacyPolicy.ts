import type { LegalDocumentContent } from './legalDocumentTypes';

export const privacyPolicy: Record<'en' | 'es', LegalDocumentContent> = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'June 6, 2026',
    intro: [
      'This Privacy Policy ("Policy") describes how NextHire ("NextHire," "we," "us," or "our") collects, uses, discloses, and protects personal information when you visit our websites, create an account, use our recruitment platform, or otherwise interact with our products and services (collectively, the "Service").',
      'NextHire provides a cloud-based applicant tracking and recruiting platform. Depending on how you interact with the Service, we may process personal information as a data controller (for example, when you register for an account or contact us) or as a data processor on behalf of our business customers (for example, when an employer uploads candidate information to the Service).',
      'By using the Service, you acknowledge that you have read this Policy. If you do not agree with our practices, please do not use the Service.',
    ],
    tocTitle: 'Table of contents',
    relatedLink: {
      prefix: 'Please also review our',
      href: '/terms',
      label: 'Terms of Service',
    },
    sections: [
      {
        id: 'scope',
        title: '1. Scope and Roles',
        paragraphs: [
          'This Policy applies to personal information processed through the Service. It does not apply to third-party websites, applications, or services that may be linked or integrated with NextHire, which are governed by their own privacy policies.',
          'When an Organization uses NextHire to manage recruiting activities, that Organization typically determines the purposes and means of processing candidate and employee information and acts as the data controller. NextHire processes such information on the Organization\'s instructions to provide the Service.',
          'If you are a candidate applying to a job posted by one of our customers, please note that the hiring Organization is primarily responsible for the personal information you submit as part of an application. You should also review that Organization\'s privacy notice, where provided.',
        ],
      },
      {
        id: 'information-collected',
        title: '2. Information We Collect',
        paragraphs: ['We may collect the following categories of information:'],
        list: [
          {
            text: 'Account and profile information',
            subItems: [
              'Name, email address, phone number, job title, and organization details',
              'Login credentials, authentication tokens, and account preferences',
              'Team membership, roles, and permissions within an Organization',
            ],
          },
          {
            text: 'Recruiting and Customer Data',
            subItems: [
              'Job postings, descriptions, and public career page content',
              'Candidate profiles, resumes, cover letters, application responses, and evaluations',
              'Interview notes, pipeline status, tags, ratings, and hiring decisions',
              'Communications sent or received through the Service, including email and messaging content',
            ],
          },
          {
            text: 'Payment and billing information',
            subItems: [
              'Subscription plan, billing contact details, and transaction history',
              'Payment card or bank details processed by our payment providers (we do not store full payment card numbers on our servers)',
            ],
          },
          {
            text: 'Usage and device information',
            subItems: [
              'IP address, browser type, operating system, device identifiers, and language settings',
              'Log data, feature usage, clickstream data, crash reports, and performance metrics',
              'Date and time of access, pages viewed, and actions taken within the Service',
            ],
          },
          {
            text: 'Communications and support',
            subItems: [
              'Information you provide when contacting support, submitting feedback, or participating in surveys',
              'Records of support requests and our responses',
            ],
          },
          {
            text: 'Information from third parties',
            subItems: [
              'Identity or single sign-on providers, if you choose to authenticate through them',
              'Integration partners such as email, calendar, messaging, advertising, or sourcing tools enabled by your Organization',
              'Publicly available professional information where permitted by your Organization\'s configuration',
            ],
          },
        ],
        afterList: [
          'We may also create aggregated or de-identified information that does not reasonably identify an individual and use it for analytics, product improvement, and business purposes.',
        ],
      },
      {
        id: 'how-we-collect',
        title: '3. How We Collect Information',
        list: [
          'Directly from you when you register, configure your account, publish jobs, communicate with candidates, or contact us',
          'Automatically through cookies, pixels, server logs, and similar technologies when you use the Service',
          'From Authorized Users within your Organization who upload or enter candidate and recruiting data',
          'From candidates and applicants who submit information through public job pages or application forms',
          'From third-party integrations enabled by you or your Organization',
        ],
      },
      {
        id: 'how-we-use',
        title: '4. How We Use Information',
        paragraphs: ['We use personal information to:'],
        list: [
          'Provide, operate, maintain, and secure the Service',
          'Create and manage accounts, Organizations, and user access',
          'Enable job posting, candidate tracking, collaboration, messaging, and workflow automation',
          'Process subscriptions, payments, invoices, and account-related communications',
          'Provide customer support and respond to inquiries',
          'Send service-related notices, including security alerts, updates, and administrative messages',
          'Monitor, analyze, and improve the Service, including developing new features and fixing errors',
          'Detect, prevent, and investigate fraud, abuse, security incidents, and violations of our Terms',
          'Comply with legal obligations and enforce our agreements',
          'With your consent or at your Organization\'s direction, where required or appropriate',
        ],
      },
      {
        id: 'legal-bases',
        title: '5. Legal Bases for Processing',
        paragraphs: [
          'Where applicable data protection laws require a legal basis, we rely on one or more of the following:',
        ],
        list: [
          'Performance of a contract — to provide the Service and fulfill our agreement with you or your Organization',
          'Legitimate interests — to secure, improve, and operate the Service, prevent abuse, and support our business, balanced against your rights',
          'Consent — where required for certain cookies, marketing communications, or optional features',
          'Legal obligation — to comply with applicable laws, regulations, court orders, or lawful requests',
          'Protection of vital interests — in rare cases where necessary to protect someone\'s safety',
        ],
        afterList: [
          'Organizations using NextHire are responsible for establishing and documenting their own legal bases for processing candidate and employee data.',
        ],
      },
      {
        id: 'ai-processing',
        title: '6. AI and Automated Processing',
        paragraphs: [
          'Some Service features use artificial intelligence, machine learning, or automated rules to assist with tasks such as message drafting, candidate ranking, workflow suggestions, or data extraction from resumes.',
          'We may process relevant input data to provide these features. Outputs are generated algorithmically and may require human review. We do not use Customer Data to train public-facing third-party AI models unless explicitly disclosed and permitted by your Organization\'s settings or agreement.',
          'Organizations remain responsible for reviewing automated outputs and ensuring their recruiting practices comply with applicable employment and anti-discrimination laws.',
        ],
      },
      {
        id: 'sharing',
        title: '7. How We Share Information',
        paragraphs: [
          'We do not sell personal information. We may share information in the following circumstances:',
        ],
        list: [
          {
            text: 'Service providers',
            subItems: [
              'Cloud hosting, infrastructure, analytics, email delivery, customer support, payment processing, and security vendors who process data on our behalf under contractual safeguards',
            ],
          },
          {
            text: 'At your Organization\'s direction',
            subItems: [
              'With teammates, hiring managers, and other Authorized Users within the same Organization',
              'Through integrations, public job pages, or communication channels configured by your Organization',
            ],
          },
          {
            text: 'Business transfers',
            subItems: [
              'In connection with a merger, acquisition, financing, reorganization, or sale of assets, subject to appropriate protections',
            ],
          },
          {
            text: 'Legal and safety',
            subItems: [
              'When required by law, regulation, legal process, or governmental request',
              'To protect the rights, property, or safety of NextHire, our users, candidates, or others',
              'To investigate potential violations of our Terms or Policy',
            ],
          },
          {
            text: 'With consent',
            subItems: ['Where you or your Organization has given permission for a specific disclosure'],
          },
        ],
      },
      {
        id: 'international',
        title: '8. International Data Transfers',
        paragraphs: [
          'NextHire may process and store information in countries other than the country where you or your Organization is located. These countries may have data protection laws that differ from those in your jurisdiction.',
          'When we transfer personal information internationally, we implement appropriate safeguards such as standard contractual clauses, data processing agreements, or other mechanisms required by applicable law.',
        ],
      },
      {
        id: 'retention',
        title: '9. Data Retention',
        paragraphs: [
          'We retain personal information for as long as necessary to provide the Service, fulfill the purposes described in this Policy, comply with legal obligations, resolve disputes, and enforce our agreements.',
          'Retention periods may vary depending on the type of data, your Subscription status, Organization settings, and legal requirements. When an account is closed, we may delete or anonymize data after a reasonable period, unless retention is required by law or legitimate business needs such as backup recovery or dispute resolution.',
          'Organizations may export Customer Data before account closure where export features are available.',
        ],
      },
      {
        id: 'security',
        title: '10. Data Security',
        paragraphs: [
          'We implement technical and organizational measures designed to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure. These measures may include encryption in transit, access controls, authentication requirements, logging, and regular security reviews.',
          'No method of transmission or storage is completely secure. You are responsible for safeguarding your account credentials and configuring appropriate access controls within your Organization.',
          'If we become aware of a data breach affecting personal information, we will notify affected parties and regulators as required by applicable law.',
        ],
      },
      {
        id: 'your-rights',
        title: '11. Your Privacy Rights',
        paragraphs: [
          'Depending on your location and applicable law, you may have some or all of the following rights:',
        ],
        list: [
          'Access — request confirmation of whether we process your personal information and obtain a copy',
          'Correction — request correction of inaccurate or incomplete personal information',
          'Deletion — request deletion of personal information, subject to legal exceptions',
          'Restriction — request limitation of certain processing activities',
          'Objection — object to processing based on legitimate interests or for direct marketing',
          'Portability — receive personal information you provided in a structured, commonly used format where technically feasible',
          'Withdraw consent — where processing is based on consent, withdraw it at any time without affecting prior lawful processing',
          'Complaint — lodge a complaint with a supervisory authority in your jurisdiction',
        ],
        afterList: [
          'To exercise rights relating to information we control directly (such as your account profile), contact us at privacy@nexthire.com. We may need to verify your identity before responding.',
          'If you are a candidate and your information was submitted to an Organization using NextHire, please contact that Organization first. We will assist the Organization in responding where we act as processor.',
          'We will respond to valid requests within the timeframe required by applicable law.',
        ],
      },
      {
        id: 'candidate-notice',
        title: '12. Notice for Candidates and Applicants',
        paragraphs: [
          'When you apply for a job through a NextHire-powered career page or application form, the hiring Organization receives your application and determines how your information is used, shared, and retained.',
          'NextHire processes application data to host, transmit, and display it to authorized users of that Organization and to provide related Service features such as screening workflows or communications configured by the Organization.',
          'Questions about the status of an application, hiring decisions, or deletion of your application data should generally be directed to the employer that posted the job.',
        ],
      },
      {
        id: 'cookies',
        title: '13. Cookies and Similar Technologies',
        paragraphs: [
          'We use cookies, local storage, pixels, and similar technologies to operate the Service, remember preferences, authenticate users, analyze usage, and improve performance.',
        ],
        list: [
          {
            text: 'Types of technologies we may use',
            subItems: [
              'Essential cookies — required for login, security, and core functionality',
              'Functional cookies — remember settings such as language preference',
              'Analytics cookies — help us understand how the Service is used',
            ],
          },
        ],
        afterList: [
          'You can control cookies through your browser settings. Disabling essential cookies may affect Service functionality. Where required by law, we will obtain consent before using non-essential cookies.',
        ],
      },
      {
        id: 'marketing',
        title: '14. Marketing Communications',
        paragraphs: [
          'We may send you service-related communications that are necessary for your account or Subscription. With your consent or where permitted by law, we may also send product updates or marketing messages.',
          'You can opt out of promotional emails by using the unsubscribe link in the message or by contacting privacy@nexthire.com. Even if you opt out of marketing, we may still send transactional or service-related notices.',
        ],
      },
      {
        id: 'children',
        title: '15. Children\'s Privacy',
        paragraphs: [
          'The Service is not directed to individuals under 18 years of age, and we do not knowingly collect personal information from children. If you believe a child has provided personal information to us, please contact privacy@nexthire.com and we will take appropriate steps to delete it.',
        ],
      },
      {
        id: 'third-party',
        title: '16. Third-Party Links and Integrations',
        paragraphs: [
          'The Service may contain links to third-party websites or enable integrations with external tools. We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before providing personal information.',
          'When your Organization enables an integration, data shared with that third party is subject to the third party\'s terms and privacy practices.',
        ],
      },
      {
        id: 'california',
        title: '17. Additional Disclosures for Certain Regions',
        paragraphs: [
          'Residents of certain jurisdictions may have additional rights under local privacy laws, such as the California Consumer Privacy Act (CCPA/CPRA), GDPR, or LGPD.',
        ],
        list: [
          'We do not sell or share personal information for cross-context behavioral advertising as defined under applicable U.S. state privacy laws.',
          'We process sensitive personal information only as necessary to provide the Service or as permitted by law.',
          'EU/EEA, UK, and similar jurisdictions: you may contact us to exercise GDPR rights or ask questions about our role as controller or processor.',
          'Brazil and Latin America: you may have rights under local data protection laws, including confirmation, access, correction, anonymization, and deletion in certain cases.',
        ],
      },
      {
        id: 'changes',
        title: '18. Changes to This Policy',
        paragraphs: [
          'We may update this Policy from time to time. If we make material changes, we will provide notice through the Service, by email, or by updating the "Last updated" date on this page before the changes take effect.',
          'Your continued use of the Service after the effective date of an updated Policy constitutes acknowledgment of the changes, unless applicable law requires a different form of consent.',
        ],
      },
    ],
    contactTitle: '19. Contact Us',
    contactBody:
      'If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us at privacy@nexthire.com. For legal or contractual inquiries, you may also contact legal@nexthire.com.',
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: '6 de junio de 2026',
    intro: [
      'Esta Política de Privacidad ("Política") describe cómo NextHire ("NextHire," "nosotros" o "nuestro") recopila, utiliza, divulga y protege información personal cuando usted visita nuestros sitios web, crea una cuenta, utiliza nuestra plataforma de reclutamiento o interactúa de cualquier otra forma con nuestros productos y servicios (en conjunto, el "Servicio").',
      'NextHire ofrece una plataforma en la nube de seguimiento de candidatos y reclutamiento. Según cómo interactúe con el Servicio, podemos tratar información personal como responsable del tratamiento (por ejemplo, cuando usted se registra o nos contacta) o como encargado del tratamiento en nombre de nuestros clientes empresariales (por ejemplo, cuando un empleador carga información de candidatos en el Servicio).',
      'Al utilizar el Servicio, usted reconoce que ha leído esta Política. Si no está de acuerdo con nuestras prácticas, no utilice el Servicio.',
    ],
    tocTitle: 'Tabla de contenidos',
    relatedLink: {
      prefix: 'Consulte también nuestros',
      href: '/terms',
      label: 'Términos de Servicio',
    },
    sections: [
      {
        id: 'scope',
        title: '1. Alcance y Roles',
        paragraphs: [
          'Esta Política aplica a la información personal tratada a través del Servicio. No aplica a sitios web, aplicaciones o servicios de terceros que puedan estar vinculados o integrados con NextHire, los cuales se rigen por sus propias políticas de privacidad.',
          'Cuando una Organización utiliza NextHire para gestionar actividades de reclutamiento, dicha Organización suele determinar los fines y medios del tratamiento de información de candidatos y empleados y actúa como responsable del tratamiento. NextHire trata dicha información siguiendo las instrucciones de la Organización para prestar el Servicio.',
          'Si usted es candidato y postula a una vacante publicada por uno de nuestros clientes, tenga en cuenta que la Organización contratante es principalmente responsable de la información personal que usted envía como parte de su solicitud. También debe revisar el aviso de privacidad de dicha Organización, cuando esté disponible.',
        ],
      },
      {
        id: 'information-collected',
        title: '2. Información que Recopilamos',
        paragraphs: ['Podemos recopilar las siguientes categorías de información:'],
        list: [
          {
            text: 'Información de cuenta y perfil',
            subItems: [
              'Nombre, correo electrónico, teléfono, cargo y datos de la organización',
              'Credenciales de acceso, tokens de autenticación y preferencias de cuenta',
              'Membresía en equipos, roles y permisos dentro de una Organización',
            ],
          },
          {
            text: 'Datos de reclutamiento y del cliente',
            subItems: [
              'Vacantes, descripciones y contenido de páginas públicas de empleo',
              'Perfiles de candidatos, currículums, cartas de presentación, respuestas de aplicación y evaluaciones',
              'Notas de entrevistas, estado en el pipeline, etiquetas, calificaciones y decisiones de contratación',
              'Comunicaciones enviadas o recibidas a través del Servicio, incluidos correos y mensajes',
            ],
          },
          {
            text: 'Información de pago y facturación',
            subItems: [
              'Plan de suscripción, datos de contacto de facturación e historial de transacciones',
              'Datos de tarjeta o cuenta bancaria procesados por proveedores de pago (no almacenamos números completos de tarjeta en nuestros servidores)',
            ],
          },
          {
            text: 'Información de uso y dispositivo',
            subItems: [
              'Dirección IP, tipo de navegador, sistema operativo, identificadores de dispositivo y configuración de idioma',
              'Registros, uso de funciones, datos de navegación, informes de errores y métricas de rendimiento',
              'Fecha y hora de acceso, páginas visitadas y acciones realizadas en el Servicio',
            ],
          },
          {
            text: 'Comunicaciones y soporte',
            subItems: [
              'Información que proporciona al contactar soporte, enviar comentarios o participar en encuestas',
              'Registros de solicitudes de soporte y nuestras respuestas',
            ],
          },
          {
            text: 'Información de terceros',
            subItems: [
              'Proveedores de identidad o inicio de sesión único, si elige autenticarse a través de ellos',
              'Socios de integración como correo, calendario, mensajería, publicidad o herramientas de sourcing habilitadas por su Organización',
              'Información profesional disponible públicamente, cuando lo permita la configuración de su Organización',
            ],
          },
        ],
        afterList: [
          'También podemos crear información agregada o desidentificada que no identifique razonablemente a una persona y utilizarla para analítica, mejora del producto y fines comerciales.',
        ],
      },
      {
        id: 'how-we-collect',
        title: '3. Cómo Recopilamos la Información',
        list: [
          'Directamente de usted cuando se registra, configura su cuenta, publica vacantes, se comunica con candidatos o nos contacta',
          'Automáticamente mediante cookies, píxeles, registros de servidor y tecnologías similares cuando utiliza el Servicio',
          'De Usuarios Autorizados dentro de su Organización que cargan o ingresan datos de candidatos y reclutamiento',
          'De candidatos y postulantes que envían información a través de páginas públicas de empleo o formularios de aplicación',
          'De integraciones de terceros habilitadas por usted o su Organización',
        ],
      },
      {
        id: 'how-we-use',
        title: '4. Cómo Utilizamos la Información',
        paragraphs: ['Utilizamos información personal para:'],
        list: [
          'Proporcionar, operar, mantener y proteger el Servicio',
          'Crear y gestionar cuentas, Organizaciones y acceso de usuarios',
          'Habilitar publicación de vacantes, seguimiento de candidatos, colaboración, mensajería y automatización de flujos',
          'Procesar suscripciones, pagos, facturas y comunicaciones relacionadas con la cuenta',
          'Brindar soporte al cliente y responder consultas',
          'Enviar avisos relacionados con el servicio, incluidas alertas de seguridad, actualizaciones y mensajes administrativos',
          'Monitorear, analizar y mejorar el Servicio, incluido el desarrollo de nuevas funciones y corrección de errores',
          'Detectar, prevenir e investigar fraude, abuso, incidentes de seguridad e infracciones de nuestros Términos',
          'Cumplir obligaciones legales y hacer valer nuestros acuerdos',
          'Con su consentimiento o según las instrucciones de su Organización, cuando sea necesario o pertinente',
        ],
      },
      {
        id: 'legal-bases',
        title: '5. Bases Legales del Tratamiento',
        paragraphs: [
          'Cuando las leyes de protección de datos aplicables exijan una base legal, nos basamos en una o más de las siguientes:',
        ],
        list: [
          'Ejecución de un contrato — para prestar el Servicio y cumplir nuestro acuerdo con usted o su Organización',
          'Intereses legítimos — para proteger, mejorar y operar el Servicio, prevenir abusos y sostener nuestro negocio, equilibrados con sus derechos',
          'Consentimiento — cuando sea necesario para ciertas cookies, comunicaciones de marketing o funciones opcionales',
          'Obligación legal — para cumplir leyes, regulaciones, órdenes judiciales o solicitudes legítimas',
          'Protección de intereses vitales — en casos excepcionales cuando sea necesario proteger la seguridad de alguien',
        ],
        afterList: [
          'Las Organizaciones que utilizan NextHire son responsables de establecer y documentar sus propias bases legales para tratar datos de candidatos y empleados.',
        ],
      },
      {
        id: 'ai-processing',
        title: '6. IA y Tratamiento Automatizado',
        paragraphs: [
          'Algunas funciones del Servicio utilizan inteligencia artificial, aprendizaje automático o reglas automatizadas para asistir en tareas como redacción de mensajes, clasificación de candidatos, sugerencias de flujo de trabajo o extracción de datos de currículums.',
          'Podemos tratar datos de entrada relevantes para proporcionar estas funciones. Los resultados se generan algorítmicamente y pueden requerir revisión humana. No utilizamos Datos del Cliente para entrenar modelos de IA públicos de terceros, salvo que se indique expresamente y lo permitan la configuración o el acuerdo de su Organización.',
          'Las Organizaciones siguen siendo responsables de revisar los resultados automatizados y garantizar que sus prácticas de contratación cumplan las leyes aplicables de empleo y antidiscriminación.',
        ],
      },
      {
        id: 'sharing',
        title: '7. Cómo Compartimos la Información',
        paragraphs: [
          'No vendemos información personal. Podemos compartir información en las siguientes circunstancias:',
        ],
        list: [
          {
            text: 'Proveedores de servicios',
            subItems: [
              'Hosting en la nube, infraestructura, analítica, envío de correo, soporte al cliente, procesamiento de pagos y proveedores de seguridad que tratan datos en nuestro nombre bajo salvaguardas contractuales',
            ],
          },
          {
            text: 'Según las instrucciones de su Organización',
            subItems: [
              'Con compañeros de equipo, responsables de contratación y otros Usuarios Autorizados de la misma Organización',
              'Mediante integraciones, páginas públicas de empleo o canales de comunicación configurados por su Organización',
            ],
          },
          {
            text: 'Transferencias empresariales',
            subItems: [
              'En relación con una fusión, adquisición, financiamiento, reorganización o venta de activos, sujeto a protecciones adecuadas',
            ],
          },
          {
            text: 'Legal y seguridad',
            subItems: [
              'Cuando lo exija la ley, regulación, proceso legal o solicitud gubernamental',
              'Para proteger los derechos, bienes o seguridad de NextHire, nuestros usuarios, candidatos u otros',
              'Para investigar posibles infracciones de nuestros Términos o esta Política',
            ],
          },
          {
            text: 'Con consentimiento',
            subItems: ['Cuando usted o su Organización hayan autorizado una divulgación específica'],
          },
        ],
      },
      {
        id: 'international',
        title: '8. Transferencias Internacionales de Datos',
        paragraphs: [
          'NextHire puede tratar y almacenar información en países distintos al país donde usted o su Organización se encuentran. Estos países pueden tener leyes de protección de datos diferentes a las de su jurisdicción.',
          'Cuando transferimos información personal internacionalmente, implementamos salvaguardas adecuadas como cláusulas contractuales tipo, acuerdos de tratamiento de datos u otros mecanismos exigidos por la ley aplicable.',
        ],
      },
      {
        id: 'retention',
        title: '9. Conservación de Datos',
        paragraphs: [
          'Conservamos información personal el tiempo necesario para prestar el Servicio, cumplir los fines descritos en esta Política, satisfacer obligaciones legales, resolver disputas y hacer valer nuestros acuerdos.',
          'Los periodos de conservación pueden variar según el tipo de dato, el estado de su Suscripción, la configuración de la Organización y los requisitos legales. Cuando se cierra una cuenta, podemos eliminar o anonimizar los datos tras un periodo razonable, salvo que la ley o necesidades comerciales legítimas — como recuperación de respaldos o resolución de disputas — exijan conservarlos.',
          'Las Organizaciones pueden exportar Datos del Cliente antes del cierre de la cuenta cuando existan funciones de exportación.',
        ],
      },
      {
        id: 'security',
        title: '10. Seguridad de los Datos',
        paragraphs: [
          'Implementamos medidas técnicas y organizativas diseñadas para proteger la información personal contra acceso no autorizado, pérdida, uso indebido, alteración o divulgación. Estas medidas pueden incluir cifrado en tránsito, controles de acceso, requisitos de autenticación, registros y revisiones periódicas de seguridad.',
          'Ningún método de transmisión o almacenamiento es completamente seguro. Usted es responsable de proteger sus credenciales de acceso y configurar controles de acceso apropiados dentro de su Organización.',
          'Si tenemos conocimiento de una violación de datos que afecte información personal, notificaremos a las partes afectadas y a las autoridades según lo exija la ley aplicable.',
        ],
      },
      {
        id: 'your-rights',
        title: '11. Sus Derechos de Privacidad',
        paragraphs: [
          'Según su ubicación y la ley aplicable, usted puede tener algunos o todos los siguientes derechos:',
        ],
        list: [
          'Acceso — solicitar confirmación de si tratamos su información personal y obtener una copia',
          'Rectificación — solicitar la corrección de información personal inexacta o incompleta',
          'Supresión — solicitar la eliminación de información personal, sujeto a excepciones legales',
          'Limitación — solicitar la restricción de ciertas actividades de tratamiento',
          'Oposición — oponerse al tratamiento basado en intereses legítimos o con fines de marketing directo',
          'Portabilidad — recibir la información personal que proporcionó en un formato estructurado y de uso común, cuando sea técnicamente viable',
          'Retirar el consentimiento — cuando el tratamiento se base en consentimiento, retirarlo en cualquier momento sin afectar tratamientos previos lícitos',
          'Reclamación — presentar una queja ante una autoridad de supervisión en su jurisdicción',
        ],
        afterList: [
          'Para ejercer derechos relacionados con información que controlamos directamente (como el perfil de su cuenta), contáctenos en privacy@nexthire.com. Podemos necesitar verificar su identidad antes de responder.',
          'Si usted es candidato y su información fue enviada a una Organización que utiliza NextHire, contacte primero a dicha Organización. Le asistiremos en la respuesta cuando actuemos como encargado del tratamiento.',
          'Responderemos a solicitudes válidas dentro del plazo exigido por la ley aplicable.',
        ],
      },
      {
        id: 'candidate-notice',
        title: '12. Aviso para Candidatos y Postulantes',
        paragraphs: [
          'Cuando usted postula a una vacante a través de una página de empleo o formulario impulsado por NextHire, la Organización contratante recibe su solicitud y determina cómo se utiliza, comparte y conserva su información.',
          'NextHire trata los datos de la solicitud para alojarlos, transmitirlos y mostrarlos a usuarios autorizados de esa Organización, y para proporcionar funciones relacionadas del Servicio como flujos de screening o comunicaciones configuradas por la Organización.',
          'Las preguntas sobre el estado de una solicitud, decisiones de contratación o eliminación de datos de su aplicación deben dirigirse generalmente al empleador que publicó la vacante.',
        ],
      },
      {
        id: 'cookies',
        title: '13. Cookies y Tecnologías Similares',
        paragraphs: [
          'Utilizamos cookies, almacenamiento local, píxeles y tecnologías similares para operar el Servicio, recordar preferencias, autenticar usuarios, analizar el uso y mejorar el rendimiento.',
        ],
        list: [
          {
            text: 'Tipos de tecnologías que podemos utilizar',
            subItems: [
              'Cookies esenciales — necesarias para inicio de sesión, seguridad y funcionalidad principal',
              'Cookies funcionales — recuerdan configuraciones como el idioma preferido',
              'Cookies analíticas — nos ayudan a entender cómo se utiliza el Servicio',
            ],
          },
        ],
        afterList: [
          'Puede controlar las cookies desde la configuración de su navegador. Deshabilitar cookies esenciales puede afectar la funcionalidad del Servicio. Cuando la ley lo exija, obtendremos consentimiento antes de usar cookies no esenciales.',
        ],
      },
      {
        id: 'marketing',
        title: '14. Comunicaciones de Marketing',
        paragraphs: [
          'Podemos enviarle comunicaciones relacionadas con el servicio que son necesarias para su cuenta o Suscripción. Con su consentimiento o cuando la ley lo permita, también podemos enviar actualizaciones de producto o mensajes de marketing.',
          'Puede darse de baja de correos promocionales mediante el enlace de cancelación en el mensaje o contactando a privacy@nexthire.com. Aunque se dé de baja del marketing, podremos seguir enviando avisos transaccionales o relacionados con el servicio.',
        ],
      },
      {
        id: 'children',
        title: '15. Privacidad de Menores',
        paragraphs: [
          'El Servicio no está dirigido a menores de 18 años y no recopilamos intencionalmente información personal de menores. Si cree que un menor nos ha proporcionado información personal, contacte a privacy@nexthire.com y tomaremos las medidas apropiadas para eliminarla.',
        ],
      },
      {
        id: 'third-party',
        title: '16. Enlaces e Integraciones de Terceros',
        paragraphs: [
          'El Servicio puede contener enlaces a sitios web de terceros o habilitar integraciones con herramientas externas. No somos responsables de las prácticas de privacidad de esos terceros. Le recomendamos revisar sus políticas de privacidad antes de proporcionar información personal.',
          'Cuando su Organización habilita una integración, los datos compartidos con ese tercero están sujetos a los términos y prácticas de privacidad del tercero.',
        ],
      },
      {
        id: 'california',
        title: '17. Divulgaciones Adicionales para Ciertas Regiones',
        paragraphs: [
          'Los residentes de ciertas jurisdicciones pueden tener derechos adicionales bajo leyes locales de privacidad, como la CCPA/CPRA de California, el GDPR o la LGPD.',
        ],
        list: [
          'No vendemos ni compartimos información personal para publicidad conductual entre contextos según se define en las leyes estatales de privacidad aplicables en EE.UU.',
          'Tratamos información personal sensible solo cuando es necesario para prestar el Servicio o cuando la ley lo permita.',
          'UE/EEE, Reino Unido y jurisdicciones similares: puede contactarnos para ejercer derechos del GDPR o consultar sobre nuestro rol como responsable o encargado del tratamiento.',
          'Brasil y América Latina: puede tener derechos bajo leyes locales de protección de datos, incluidos confirmación, acceso, rectificación, anonimización y supresión en ciertos casos.',
        ],
      },
      {
        id: 'changes',
        title: '18. Cambios a Esta Política',
        paragraphs: [
          'Podemos actualizar esta Política periódicamente. Si realizamos cambios materiales, proporcionaremos aviso a través del Servicio, por correo electrónico o actualizando la fecha de "Última actualización" en esta página antes de que entren en vigor.',
          'Su uso continuado del Servicio después de la fecha efectiva de una Política actualizada constituye reconocimiento de los cambios, salvo que la ley aplicable exija una forma distinta de consentimiento.',
        ],
      },
    ],
    contactTitle: '19. Contáctenos',
    contactBody:
      'Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos de privacidad, contáctenos en privacy@nexthire.com. Para consultas legales o contractuales, también puede escribir a legal@nexthire.com.',
  },
};

export function getPrivacyContent(language: string): LegalDocumentContent {
  return language.startsWith('es') ? privacyPolicy.es : privacyPolicy.en;
}
