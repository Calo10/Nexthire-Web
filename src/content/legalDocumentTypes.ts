export type LegalListItem = string | { text: string; subItems?: string[] };

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: LegalListItem[];
  afterList?: string[];
};

export type LegalDocumentContent = {
  title: string;
  lastUpdated: string;
  intro: string[];
  tocTitle: string;
  sections: LegalSection[];
  contactTitle: string;
  contactBody: string;
  relatedLink?: {
    href: string;
    label: string;
    prefix: string;
  };
};
