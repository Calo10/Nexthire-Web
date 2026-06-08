import { useTranslation } from 'react-i18next';
import LegalDocumentPage from '../components/legal/LegalDocumentPage';
import { getTermsContent } from '../content/termsOfService';

export default function Terms() {
  const { i18n } = useTranslation();
  const content = getTermsContent(i18n.language);

  return <LegalDocumentPage content={content} />;
}
