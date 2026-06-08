import type { LegalDocumentContent, LegalListItem } from './legalDocumentTypes';

export type TermsListItem = LegalListItem;
export type TermsSection = LegalDocumentContent['sections'][number];
export type TermsContent = LegalDocumentContent;

export const termsOfService: Record<'en' | 'es', LegalDocumentContent> = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'June 6, 2026',
    intro: [
      'These Terms of Service ("Terms") govern your access to and use of the NextHire platform, websites, applications, and related services (collectively, the "Service") operated by NextHire ("NextHire," "we," "us," or "our").',
      'NextHire is a cloud-based recruitment and applicant tracking platform that helps organizations publish job openings, manage candidates, collaborate on hiring pipelines, and use automation and AI-assisted tools to streamline recruiting workflows.',
      'By creating an account, clicking "I agree," or otherwise accessing or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use the Service.',
      'If you use the Service on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms, and "you" refers to that entity.',
    ],
    tocTitle: 'Table of contents',
    sections: [
      {
        id: 'definitions',
        title: '1. Definitions',
        list: [
          '"Account" means the registered profile used to access the Service.',
          '"Organization" means the company, team, or workspace associated with your Account.',
          '"Authorized User" means an individual permitted by an Organization to access the Service under its Account.',
          '"Customer Data" means information submitted to or generated through the Service by you or your Authorized Users, including job postings, candidate profiles, resumes, notes, communications, and hiring records.',
          '"Subscription" means the paid or free plan selected for your Organization, including any trial period.',
          '"Third-Party Services" means external products, integrations, or platforms connected to or used with the Service.',
        ],
      },
      {
        id: 'eligibility',
        title: '2. Eligibility',
        paragraphs: [
          'You must be at least 18 years old and capable of entering into a binding contract to use the Service. The Service is intended for business and professional recruiting use.',
          'You may not use the Service if you have been previously suspended or removed, or if your use would violate applicable law or these Terms.',
        ],
      },
      {
        id: 'accounts',
        title: '3. Accounts, Organizations, and Security',
        paragraphs: [
          'To use most features of the Service, you must register for an Account and, where applicable, create or join an Organization. You agree to provide accurate, current, and complete information and to keep it updated.',
          'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your Account. You must notify us promptly at legal@nexthire.com if you suspect unauthorized access or a security incident.',
          'Organization administrators may invite Authorized Users, assign roles, and manage access. Each Organization is responsible for how its Authorized Users use the Service and for ensuring they comply with these Terms.',
        ],
      },
      {
        id: 'service',
        title: '4. Description of the Service',
        paragraphs: [
          'Subject to these Terms and your Subscription, NextHire grants you a limited, non-exclusive, non-transferable, revocable right to access and use the Service for your internal recruiting and hiring operations.',
          'The Service may include, without limitation:',
        ],
        list: [
          'Creating and managing job postings and public career pages',
          'Tracking candidates through customizable hiring pipelines',
          'Storing candidate profiles, resumes, evaluations, and team notes',
          'Collaborating with teammates and assigning recruiting tasks',
          'Using message templates and communication workflows',
          'Sourcing, screening, and automation features, including AI-assisted tools',
          'Analytics, reporting, and integrations with Third-Party Services',
        ],
        afterList: [
          'We may modify, improve, or discontinue features from time to time. Where a change materially reduces core functionality of a paid plan, we will use reasonable efforts to notify Organization administrators in advance.',
        ],
      },
      {
        id: 'subscriptions',
        title: '5. Subscriptions, Billing, and Free Trials',
        paragraphs: [
          'Certain features require a paid Subscription. Plan details, limits, and pricing are described on our pricing page or in an order form agreed with you.',
          'If you start a free trial, you may access applicable paid features for the trial period without charge unless otherwise stated. At the end of the trial, continued use of paid features requires an active paid Subscription.',
          'Paid Subscriptions renew automatically at the end of each billing cycle unless canceled before renewal. You authorize us and our payment processors to charge applicable fees, taxes, and overages to your selected payment method.',
          'Fees are non-refundable except where required by law or expressly stated in writing. Downgrades, cancellations, or failure to pay may result in loss of access to paid features, data export restrictions, or Account suspension.',
          'We may change prices or plan features for future billing periods by providing reasonable notice. Price changes do not apply retroactively to the current paid term unless required by law or agreed otherwise.',
        ],
      },
      {
        id: 'acceptable-use',
        title: '6. Acceptable Use',
        paragraphs: ['You agree not to, and not to permit others to:'],
        list: [
          'Use the Service for unlawful, fraudulent, deceptive, or discriminatory hiring practices',
          'Harass, threaten, defame, or violate the rights of candidates, employees, or third parties',
          'Upload malware, attempt unauthorized access, probe or scan systems, or interfere with the Service',
          'Reverse engineer, decompile, or attempt to extract source code except where prohibited restrictions are unenforceable by law',
          'Scrape, harvest, or bulk export data from the Service except through features we provide or with our written consent',
          'Resell, sublicense, or provide the Service to third parties except as expressly permitted for your Organization\'s recruiting operations',
          'Use the Service to send spam or unsolicited communications in violation of applicable anti-spam laws',
          'Misrepresent your identity, affiliation, or the nature of a job opportunity',
          'Collect or process sensitive personal data without a lawful basis and appropriate safeguards required by applicable privacy and employment laws',
        ],
      },
      {
        id: 'customer-data',
        title: '7. Customer Data and Candidate Information',
        paragraphs: [
          'You retain ownership of Customer Data. You grant NextHire a worldwide, limited license to host, process, transmit, display, and use Customer Data solely to provide, maintain, secure, and improve the Service, comply with law, and enforce these Terms.',
          'You are solely responsible for the accuracy, legality, and appropriateness of Customer Data and for obtaining all necessary notices, consents, and rights from candidates and other individuals whose information you submit to the Service.',
          'You represent that your collection and use of candidate and employee information through the Service complies with applicable data protection, employment, anti-discrimination, and background-check laws in every jurisdiction where you operate.',
          'NextHire does not provide legal, HR, or compliance advice. Features such as AI-assisted screening, scoring, or messaging are tools to support your process; you remain responsible for all hiring decisions and communications sent through the Service.',
        ],
      },
      {
        id: 'ai',
        title: '8. AI and Automated Features',
        paragraphs: [
          'Some features use artificial intelligence, machine learning, or rules-based automation to suggest content, rank candidates, draft messages, or perform workflow actions.',
          'AI-generated outputs may be inaccurate, incomplete, or biased. You must review outputs before relying on them, especially for decisions affecting employment opportunities.',
          'You may not use AI features to make solely automated decisions that produce legal or similarly significant effects on individuals unless you implement appropriate safeguards required by applicable law and inform affected individuals as required.',
        ],
      },
      {
        id: 'public-jobs',
        title: '9. Public Job Listings and Communications',
        paragraphs: [
          'If you publish jobs to public career pages or external channels, you are responsible for the content of those listings and for ensuring they are truthful, current, and compliant with applicable advertising and employment laws.',
          'When you send emails, messages, or notifications through the Service, you represent that you have a lawful basis to contact recipients and that your content complies with applicable communication laws.',
          'We may remove or disable public content that violates these Terms, applicable law, or creates security or reputational risk for NextHire.',
        ],
      },
      {
        id: 'integrations',
        title: '10. Third-Party Services and Integrations',
        paragraphs: [
          'The Service may integrate with or link to Third-Party Services such as email providers, messaging platforms, advertising networks, calendar tools, or payment processors. Your use of Third-Party Services is governed by their own terms and privacy policies.',
          'NextHire is not responsible for Third-Party Services, including their availability, security, pricing, or data practices. Enabling an integration may require you to share Customer Data with the third party.',
        ],
      },
      {
        id: 'privacy',
        title: '11. Privacy',
        paragraphs: [
          'Our Privacy Policy explains how we collect, use, and share personal information. By using the Service, you also agree to the Privacy Policy.',
          'If you process personal data of candidates or employees through the Service, you may be a data controller and NextHire may act as a data processor on your behalf. Additional data processing terms may apply where required by law.',
        ],
      },
      {
        id: 'ip',
        title: '12. Intellectual Property',
        paragraphs: [
          'NextHire and its licensors own all rights, title, and interest in the Service, including software, designs, trademarks, documentation, and all related intellectual property, except for Customer Data.',
          'You may not copy, modify, distribute, sell, or lease any part of the Service or included software except as expressly allowed in these Terms or with our prior written consent.',
          'If you provide feedback, suggestions, or ideas about the Service, you grant us a perpetual, irrevocable, royalty-free license to use them without restriction or compensation.',
        ],
      },
      {
        id: 'confidentiality',
        title: '13. Confidentiality',
        paragraphs: [
          'Each party may receive non-public information from the other. The receiving party will use reasonable care to protect such information and will use it only for purposes related to the Service, except as otherwise permitted by law or with consent.',
          'This obligation does not apply to information that is public through no fault of the receiving party, already known without restriction, independently developed, or rightfully received from a third party.',
        ],
      },
      {
        id: 'availability',
        title: '14. Service Availability and Support',
        paragraphs: [
          'We strive to keep the Service available and secure, but we do not guarantee uninterrupted or error-free operation. Maintenance, updates, network failures, and events beyond our reasonable control may cause temporary interruptions.',
          'Support levels depend on your Subscription. Unless otherwise agreed in writing, the Service is provided on a commercially reasonable efforts basis.',
        ],
      },
      {
        id: 'termination',
        title: '15. Suspension and Termination',
        paragraphs: [
          'You may stop using the Service at any time. Organization administrators may cancel a Subscription according to account settings or by contacting support.',
          'We may suspend or terminate access immediately if you materially breach these Terms, fail to pay fees, create legal or security risk, or if required by law. Where reasonable, we will provide notice and an opportunity to cure, except where immediate action is necessary.',
          'Upon termination, your right to access the Service ends. We may delete or deactivate Customer Data after a reasonable retention period, except where retention is required by law. You are responsible for exporting Customer Data before termination when export features are available.',
        ],
      },
      {
        id: 'disclaimers',
        title: '16. Disclaimers',
        paragraphs: [
          'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXTHIRE DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
          'NEXTHIRE DOES NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, THAT HIRING OUTCOMES WILL BE SUCCESSFUL, OR THAT DATA WILL BE ACCURATE OR COMPLETE. YOU USE THE SERVICE AT YOUR OWN RISK.',
        ],
      },
      {
        id: 'liability',
        title: '17. Limitation of Liability',
        paragraphs: [
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXTHIRE AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXTHIRE\'S TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS PAID BY YOU TO NEXTHIRE FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (USD $100).',
          'Some jurisdictions do not allow certain limitations, so some of the above may not apply to you. In such cases, NextHire\'s liability will be limited to the fullest extent permitted by applicable law.',
        ],
      },
      {
        id: 'indemnity',
        title: '18. Indemnification',
        paragraphs: [
          'You will defend, indemnify, and hold harmless NextHire and its affiliates, officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising out of or related to: (a) your Customer Data; (b) your use of the Service; (c) your violation of these Terms or applicable law; or (d) your hiring practices or communications with candidates and employees.',
        ],
      },
      {
        id: 'disputes',
        title: '19. Governing Law and Disputes',
        paragraphs: [
          'These Terms are governed by the laws applicable in the jurisdiction where NextHire is established, without regard to conflict-of-law principles, except where mandatory consumer protection laws in your country require otherwise.',
          'Before filing a formal claim, the parties agree to attempt to resolve disputes informally by contacting legal@nexthire.com. If a dispute is not resolved within thirty (30) days, either party may pursue remedies in the competent courts of NextHire\'s principal place of business, unless applicable law grants you the right to bring claims in your home jurisdiction.',
        ],
      },
      {
        id: 'general',
        title: '20. General Provisions',
        list: [
          'Entire agreement. These Terms, the Privacy Policy, and any order forms or supplemental terms constitute the entire agreement regarding the Service.',
          'Assignment. You may not assign these Terms without our consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.',
          'Severability. If any provision is unenforceable, the remaining provisions remain in effect.',
          'Waiver. Failure to enforce a provision is not a waiver of future enforcement.',
          'Force majeure. Neither party is liable for delays or failures caused by events beyond reasonable control.',
          'Notices. We may provide notices through the Service, email, or by posting updates on our website.',
        ],
      },
      {
        id: 'changes',
        title: '21. Changes to These Terms',
        paragraphs: [
          'We may update these Terms from time to time. If we make material changes, we will provide notice through the Service, by email, or by updating the "Last updated" date on this page before the changes take effect.',
          'Your continued use of the Service after the effective date of revised Terms constitutes acceptance. If you do not agree to the revised Terms, you must stop using the Service and cancel your Subscription, if applicable.',
        ],
      },
    ],
    contactTitle: '22. Contact',
    contactBody:
      'If you have questions about these Terms, contact us at legal@nexthire.com. For privacy-related requests, contact privacy@nexthire.com.',
    relatedLink: {
      prefix: 'Please also review our',
      href: '/privacy',
      label: 'Privacy Policy',
    },
  },
  es: {
    title: 'Términos de Servicio',
    lastUpdated: '6 de junio de 2026',
    intro: [
      'Estos Términos de Servicio ("Términos") regulan su acceso y uso de la plataforma NextHire, sitios web, aplicaciones y servicios relacionados (en conjunto, el "Servicio") operados por NextHire ("NextHire," "nosotros" o "nuestro").',
      'NextHire es una plataforma en la nube de reclutamiento y seguimiento de candidatos (ATS) que ayuda a las organizaciones a publicar vacantes, gestionar candidatos, colaborar en procesos de selección y utilizar herramientas de automatización e inteligencia artificial para optimizar el reclutamiento.',
      'Al crear una cuenta, hacer clic en "Acepto" o acceder o utilizar el Servicio de cualquier otra forma, usted confirma que ha leído, comprendido y aceptado quedar obligado por estos Términos y nuestra Política de Privacidad. Si no está de acuerdo, no podrá utilizar el Servicio.',
      'Si utiliza el Servicio en nombre de una empresa u otra entidad legal, usted declara que tiene autoridad para obligar a dicha entidad a estos Términos, y "usted" se referirá a dicha entidad.',
    ],
    tocTitle: 'Tabla de contenidos',
    sections: [
      {
        id: 'definitions',
        title: '1. Definiciones',
        list: [
          '"Cuenta" significa el perfil registrado utilizado para acceder al Servicio.',
          '"Organización" significa la empresa, equipo o espacio de trabajo asociado a su Cuenta.',
          '"Usuario Autorizado" significa la persona a quien la Organización permite acceder al Servicio bajo su Cuenta.',
          '"Datos del Cliente" significa la información enviada o generada a través del Servicio por usted o sus Usuarios Autorizados, incluidas vacantes, perfiles de candidatos, currículums, notas, comunicaciones y registros de contratación.',
          '"Suscripción" significa el plan de pago o gratuito seleccionado para su Organización, incluido cualquier periodo de prueba.',
          '"Servicios de Terceros" significa productos, integraciones o plataformas externas conectadas o utilizadas junto con el Servicio.',
        ],
      },
      {
        id: 'eligibility',
        title: '2. Elegibilidad',
        paragraphs: [
          'Debe tener al menos 18 años y capacidad legal para celebrar un contrato vinculante para utilizar el Servicio. El Servicio está destinado al uso profesional y empresarial del reclutamiento.',
          'No podrá utilizar el Servicio si previamente fue suspendido o dado de baja, o si su uso violaría la ley aplicable o estos Términos.',
        ],
      },
      {
        id: 'accounts',
        title: '3. Cuentas, Organizaciones y Seguridad',
        paragraphs: [
          'Para utilizar la mayoría de las funciones del Servicio, debe registrarse y, cuando corresponda, crear o unirse a una Organización. Usted se compromete a proporcionar información veraz, actual y completa, y a mantenerla actualizada.',
          'Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de toda la actividad que ocurra bajo su Cuenta. Debe notificarnos de inmediato a legal@nexthire.com si sospecha acceso no autorizado o un incidente de seguridad.',
          'Los administradores de la Organización pueden invitar Usuarios Autorizados, asignar roles y gestionar el acceso. Cada Organización es responsable del uso que hagan sus Usuarios Autorizados del Servicio y de garantizar que cumplan estos Términos.',
        ],
      },
      {
        id: 'service',
        title: '4. Descripción del Servicio',
        paragraphs: [
          'Sujeto a estos Términos y a su Suscripción, NextHire le otorga un derecho limitado, no exclusivo, intransferible y revocable de acceder y utilizar el Servicio para sus operaciones internas de reclutamiento y contratación.',
          'El Servicio puede incluir, entre otras cosas:',
        ],
        list: [
          'Creación y gestión de vacantes y páginas públicas de empleo',
          'Seguimiento de candidatos mediante pipelines de contratación personalizables',
          'Almacenamiento de perfiles, currículums, evaluaciones y notas del equipo',
          'Colaboración entre miembros del equipo y asignación de tareas de reclutamiento',
          'Plantillas de mensajes y flujos de comunicación',
          'Funciones de sourcing, screening y automatización, incluidas herramientas asistidas por IA',
          'Analítica, reportes e integraciones con Servicios de Terceros',
        ],
        afterList: [
          'Podemos modificar, mejorar o discontinuar funciones periódicamente. Cuando un cambio reduzca materialmente la funcionalidad principal de un plan de pago, haremos esfuerzos razonables para notificar a los administradores de la Organización con antelación.',
        ],
      },
      {
        id: 'subscriptions',
        title: '5. Suscripciones, Facturación y Pruebas Gratuitas',
        paragraphs: [
          'Ciertas funciones requieren una Suscripción de pago. Los detalles del plan, límites y precios se describen en nuestra página de precios o en un formulario de pedido acordado con usted.',
          'Si inicia una prueba gratuita, podrá acceder a las funciones de pago aplicables durante el periodo de prueba sin costo, salvo que se indique lo contrario. Al finalizar la prueba, el uso continuado de funciones de pago requiere una Suscripción activa.',
          'Las Suscripciones de pago se renuevan automáticamente al final de cada ciclo de facturación, salvo cancelación previa a la renovación. Usted nos autoriza, así como a nuestros procesadores de pago, a cargar las tarifas, impuestos y cargos por excedentes aplicables al método de pago seleccionado.',
          'Las tarifas no son reembolsables, salvo cuando la ley lo exija o se indique expresamente por escrito. Las bajas de plan, cancelaciones o falta de pago pueden resultar en pérdida de acceso a funciones de pago, restricciones de exportación de datos o suspensión de la Cuenta.',
          'Podemos modificar precios o características de los planes para periodos de facturación futuros mediante aviso razonable. Los cambios de precio no se aplican retroactivamente al periodo de pago vigente, salvo que la ley lo exija o se acuerde lo contrario.',
        ],
      },
      {
        id: 'acceptable-use',
        title: '6. Uso Aceptable',
        paragraphs: ['Usted se compromete a no hacer, ni permitir que otros hagan, lo siguiente:'],
        list: [
          'Utilizar el Servicio para prácticas de contratación ilícitas, fraudulentas, engañosas o discriminatorias',
          'Acosar, amenazar, difamar o vulnerar los derechos de candidatos, empleados o terceros',
          'Subir malware, intentar acceso no autorizado, sondear sistemas o interferir con el Servicio',
          'Realizar ingeniería inversa, descompilar o intentar extraer el código fuente, salvo cuando la ley prohíba dichas restricciones',
          'Extraer, recolectar o exportar datos masivamente del Servicio, excepto mediante las funciones que proporcionamos o con nuestro consentimiento escrito',
          'Revender, sublicenciar o prestar el Servicio a terceros, salvo lo expresamente permitido para las operaciones de reclutamiento de su Organización',
          'Utilizar el Servicio para enviar spam o comunicaciones no solicitadas en violación de las leyes anti-spam aplicables',
          'Falsificar su identidad, afiliación o la naturaleza de una oportunidad laboral',
          'Recopilar o procesar datos personales sensibles sin base legal y salvaguardas adecuadas exigidas por las leyes de privacidad y empleo aplicables',
        ],
      },
      {
        id: 'customer-data',
        title: '7. Datos del Cliente e Información de Candidatos',
        paragraphs: [
          'Usted conserva la titularidad de los Datos del Cliente. Usted otorga a NextHire una licencia mundial y limitada para alojar, procesar, transmitir, mostrar y utilizar los Datos del Cliente únicamente para proporcionar, mantener, proteger y mejorar el Servicio, cumplir con la ley y hacer cumplir estos Términos.',
          'Usted es el único responsable de la exactitud, legalidad y pertinencia de los Datos del Cliente, y de obtener todos los avisos, consentimientos y derechos necesarios de candidatos y demás personas cuya información envíe al Servicio.',
          'Usted declara que su recopilación y uso de información de candidatos y empleados a través del Servicio cumple con las leyes aplicables de protección de datos, empleo, antidiscriminación y verificación de antecedentes en cada jurisdicción donde opere.',
          'NextHire no proporciona asesoramiento legal, de recursos humanos ni de cumplimiento normativo. Funciones como screening, puntuación o mensajería asistidos por IA son herramientas de apoyo; usted sigue siendo responsable de todas las decisiones de contratación y comunicaciones enviadas a través del Servicio.',
        ],
      },
      {
        id: 'ai',
        title: '8. Funciones de IA y Automatización',
        paragraphs: [
          'Algunas funciones utilizan inteligencia artificial, aprendizaje automático o automatización basada en reglas para sugerir contenido, clasificar candidatos, redactar mensajes o ejecutar acciones de flujo de trabajo.',
          'Los resultados generados por IA pueden ser inexactos, incompletos o sesgados. Usted debe revisarlos antes de confiar en ellos, especialmente para decisiones que afecten oportunidades de empleo.',
          'No podrá utilizar funciones de IA para tomar decisiones exclusivamente automatizadas que produzcan efectos legales o significativamente similares sobre individuos, salvo que implemente las salvaguardas exigidas por la ley aplicable e informe a las personas afectadas según corresponda.',
        ],
      },
      {
        id: 'public-jobs',
        title: '9. Vacantes Públicas y Comunicaciones',
        paragraphs: [
          'Si publica vacantes en páginas de empleo públicas o canales externos, usted es responsable del contenido de dichas publicaciones y de garantizar que sean veraces, actuales y conformes con las leyes aplicables de publicidad y empleo.',
          'Cuando envíe correos, mensajes o notificaciones a través del Servicio, usted declara que tiene base legal para contactar a los destinatarios y que su contenido cumple con las leyes de comunicaciones aplicables.',
          'Podemos eliminar o deshabilitar contenido público que viole estos Términos, la ley aplicable o genere riesgos de seguridad o reputacionales para NextHire.',
        ],
      },
      {
        id: 'integrations',
        title: '10. Servicios de Terceros e Integraciones',
        paragraphs: [
          'El Servicio puede integrarse o enlazar con Servicios de Terceros, como proveedores de correo, plataformas de mensajería, redes publicitarias, calendarios o procesadores de pago. El uso de Servicios de Terceros se rige por sus propios términos y políticas de privacidad.',
          'NextHire no es responsable de los Servicios de Terceros, incluida su disponibilidad, seguridad, precios o prácticas de datos. Activar una integración puede requerir que comparta Datos del Cliente con el tercero.',
        ],
      },
      {
        id: 'privacy',
        title: '11. Privacidad',
        paragraphs: [
          'Nuestra Política de Privacidad explica cómo recopilamos, utilizamos y compartimos información personal. Al utilizar el Servicio, usted también acepta la Política de Privacidad.',
          'Si procesa datos personales de candidatos o empleados a través del Servicio, usted puede ser responsable del tratamiento (controlador) y NextHire puede actuar como encargado del tratamiento en su nombre. Pueden aplicarse términos adicionales de procesamiento de datos cuando la ley lo exija.',
        ],
      },
      {
        id: 'ip',
        title: '12. Propiedad Intelectual',
        paragraphs: [
          'NextHire y sus licenciantes son titulares de todos los derechos sobre el Servicio, incluidos software, diseños, marcas, documentación y demás propiedad intelectual relacionada, excepto los Datos del Cliente.',
          'No podrá copiar, modificar, distribuir, vender ni arrendar ninguna parte del Servicio o del software incluido, salvo lo expresamente permitido en estos Términos o con nuestro consentimiento previo por escrito.',
          'Si nos proporciona comentarios, sugerencias o ideas sobre el Servicio, nos otorga una licencia perpetua, irrevocable y libre de regalías para utilizarlos sin restricción ni compensación.',
        ],
      },
      {
        id: 'confidentiality',
        title: '13. Confidencialidad',
        paragraphs: [
          'Cada parte puede recibir información no pública de la otra. La parte receptora utilizará un cuidado razonable para proteger dicha información y la usará únicamente para fines relacionados con el Servicio, salvo que la ley lo permita o exista consentimiento.',
          'Esta obligación no aplica a información que sea pública sin culpa de la parte receptora, que ya conociera sin restricción, que haya desarrollado de forma independiente o que haya recibido legítimamente de un tercero.',
        ],
      },
      {
        id: 'availability',
        title: '14. Disponibilidad del Servicio y Soporte',
        paragraphs: [
          'Nos esforzamos por mantener el Servicio disponible y seguro, pero no garantizamos un funcionamiento ininterrumpido ni libre de errores. El mantenimiento, actualizaciones, fallos de red y eventos fuera de nuestro control razonable pueden causar interrupciones temporales.',
          'Los niveles de soporte dependen de su Suscripción. Salvo acuerdo escrito en contrario, el Servicio se proporciona sobre una base de esfuerzos comercialmente razonables.',
        ],
      },
      {
        id: 'termination',
        title: '15. Suspensión y Terminación',
        paragraphs: [
          'Puede dejar de utilizar el Servicio en cualquier momento. Los administradores de la Organización pueden cancelar una Suscripción desde la configuración de la cuenta o contactando a soporte.',
          'Podemos suspender o terminar el acceso de inmediato si usted incumple materialmente estos Términos, no paga las tarifas, genera riesgo legal o de seguridad, o si la ley lo exige. Cuando sea razonable, proporcionaremos aviso y oportunidad de subsanar, salvo que sea necesaria una acción inmediata.',
          'Tras la terminación, su derecho de acceso al Servicio finaliza. Podemos eliminar o desactivar los Datos del Cliente después de un periodo razonable de retención, salvo cuando la ley exija conservarlos. Usted es responsable de exportar los Datos del Cliente antes de la terminación cuando existan funciones de exportación.',
        ],
      },
      {
        id: 'disclaimers',
        title: '16. Exclusión de Garantías',
        paragraphs: [
          'EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD." EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, NEXTHIRE RECHAZA TODAS LAS GARANTÍAS, EXPRESAS, IMPLÍCITAS O LEGALES, INCLUIDAS LAS GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN PARTICULAR, TITULARIDAD Y NO INFRACCIÓN.',
          'NEXTHIRE NO GARANTIZA QUE EL SERVICIO SATISFAGA SUS REQUISITOS, QUE LOS RESULTADOS DE CONTRATACIÓN SEAN EXITOSOS NI QUE LOS DATOS SEAN EXACTOS O COMPLETOS. USTED UTILIZA EL SERVICIO BAJO SU PROPIO RIESGO.',
        ],
      },
      {
        id: 'liability',
        title: '17. Limitación de Responsabilidad',
        paragraphs: [
          'EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, NEXTHIRE Y SUS AFILIADAS, DIRECTIVOS, EMPLEADOS, AGENTES Y PROVEEDORES NO SERÁN RESPONSABLES DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENCIALES, EJEMPLARES O PUNITIVOS, NI DE PÉRDIDA DE BENEFICIOS, INGRESOS, DATOS, REPUTACIÓN O INTERRUPCIÓN DEL NEGOCIO, AUN CUANDO SE HAYA ADVERTIDO DE LA POSIBILIDAD DE DICHOS DAÑOS.',
          'EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, LA RESPONSABILIDAD TOTAL DE NEXTHIRE POR TODAS LAS RECLAMACIONES DERIVADAS DEL SERVICIO O DE ESTOS TÉRMINOS NO EXCEDERÁ EL MAYOR ENTRE (A) LOS IMPORTES PAGADOS POR USTED A NEXTHIRE POR EL SERVICIO EN LOS DOCE (12) MESES ANTERIORES AL HECHO QUE ORIGINE LA RECLAMACIÓN, O (B) CIEN DÓLARES ESTADOUNIDENSES (USD $100).',
          'Algunas jurisdicciones no permiten ciertas limitaciones, por lo que parte de lo anterior puede no aplicarse. En tales casos, la responsabilidad de NextHire se limitará en la mayor medida permitida por la ley aplicable.',
        ],
      },
      {
        id: 'indemnity',
        title: '18. Indemnización',
        paragraphs: [
          'Usted defenderá, indemnizará y mantendrá indemne a NextHire y sus afiliadas, directivos, empleados y agentes frente a reclamaciones, daños, pérdidas, responsabilidades, costos y gastos (incluidos honorarios razonables de abogados) derivados de o relacionados con: (a) sus Datos del Cliente; (b) su uso del Servicio; (c) su incumplimiento de estos Términos o de la ley aplicable; o (d) sus prácticas de contratación o comunicaciones con candidatos y empleados.',
        ],
      },
      {
        id: 'disputes',
        title: '19. Ley Aplicable y Disputas',
        paragraphs: [
          'Estos Términos se rigen por las leyes aplicables en la jurisdicción donde NextHire esté establecida, sin tener en cuenta principios de conflicto de leyes, salvo que las leyes imperativas de protección al consumidor de su país exijan lo contrario.',
          'Antes de presentar una reclamación formal, las partes acuerdan intentar resolver las disputas de forma informal contactando a legal@nexthire.com. Si una disputa no se resuelve en treinta (30) días, cualquiera de las partes podrá acudir a los tribunales competentes del domicilio principal de NextHire, salvo que la ley aplicable le otorgue el derecho de interponer reclamaciones en su jurisdicción de residencia.',
        ],
      },
      {
        id: 'general',
        title: '20. Disposiciones Generales',
        list: [
          'Acuerdo completo. Estos Términos, la Política de Privacidad y cualquier formulario de pedido o términos complementarios constituyen el acuerdo íntegro respecto del Servicio.',
          'Cesión. Usted no podrá ceder estos Términos sin nuestro consentimiento. Nosotros podremos cederlos en relación con una fusión, adquisición o venta de activos.',
          'Divisibilidad. Si alguna disposición resulta inaplicable, las restantes seguirán vigentes.',
          'Renuncia. La falta de exigencia de cumplimiento de una disposición no constituye renuncia a exigirla en el futuro.',
          'Fuerza mayor. Ninguna parte será responsable por retrasos o incumplimientos causados por eventos fuera de su control razonable.',
          'Notificaciones. Podemos enviar avisos a través del Servicio, por correo electrónico o publicando actualizaciones en nuestro sitio web.',
        ],
      },
      {
        id: 'changes',
        title: '21. Cambios a Estos Términos',
        paragraphs: [
          'Podemos actualizar estos Términos periódicamente. Si realizamos cambios materiales, proporcionaremos aviso a través del Servicio, por correo electrónico o actualizando la fecha de "Última actualización" en esta página antes de que entren en vigor.',
          'Su uso continuado del Servicio después de la fecha efectiva de los Términos revisados constituye aceptación. Si no está de acuerdo con los Términos revisados, debe dejar de utilizar el Servicio y cancelar su Suscripción, si corresponde.',
        ],
      },
    ],
    contactTitle: '22. Contacto',
    contactBody:
      'Si tiene preguntas sobre estos Términos, contáctenos en legal@nexthire.com. Para solicitudes relacionadas con privacidad, escriba a privacy@nexthire.com.',
    relatedLink: {
      prefix: 'Consulte también nuestra',
      href: '/privacy',
      label: 'Política de Privacidad',
    },
  },
};

export function getTermsContent(language: string): LegalDocumentContent {
  return language.startsWith('es') ? termsOfService.es : termsOfService.en;
}
