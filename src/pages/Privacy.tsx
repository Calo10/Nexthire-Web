import { useTranslation } from 'react-i18next';
import LegalDocumentPage from '../components/legal/LegalDocumentPage';
import { getPrivacyContent } from '../content/privacyPolicy';

export default function Privacy() {
  const { i18n } = useTranslation();
  const content = getPrivacyContent(i18n.language);

  return <LegalDocumentPage content={content} />;
}
