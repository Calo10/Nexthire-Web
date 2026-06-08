import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LegalDocumentContent, LegalListItem } from '../../content/legalDocumentTypes';

function renderListItem(item: LegalListItem, index: number) {
  if (typeof item === 'string') {
    return <li key={index}>{item}</li>;
  }

  return (
    <li key={index}>
      {item.text}
      {item.subItems && item.subItems.length > 0 && (
        <ul className="list-disc pl-6 mt-2 space-y-1">
          {item.subItems.map((subItem, subIndex) => (
            <li key={subIndex}>{subItem}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

type LegalDocumentPageProps = {
  content: LegalDocumentContent;
};

export default function LegalDocumentPage({ content }: LegalDocumentPageProps) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language.startsWith('es');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-dark-text mb-4">{content.title}</h1>
        <p className="text-sm text-gray-600">
          {isSpanish ? 'Última actualización: ' : 'Last updated: '}
          {content.lastUpdated}
        </p>
      </header>

      <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
        <section className="space-y-4">
          {content.intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {content.relatedLink && (
            <p>
              {content.relatedLink.prefix}{' '}
              <Link
                to={content.relatedLink.href}
                className="text-primary hover:text-purple-700 font-medium"
              >
                {content.relatedLink.label}
              </Link>
              .
            </p>
          )}
        </section>

        <nav
          aria-label={content.tocTitle}
          className="rounded-xl border border-gray-200 bg-gray-50 p-6 not-prose"
        >
          <h2 className="text-lg font-semibold text-dark-text mb-4">{content.tocTitle}</h2>
          <ol className="grid gap-2 sm:grid-cols-2 text-sm">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-primary hover:text-purple-700 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#contact" className="text-primary hover:text-purple-700 hover:underline">
                {content.contactTitle}
              </a>
            </li>
          </ol>
        </nav>

        {content.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-dark-text mb-4">{section.title}</h2>

            {section.paragraphs?.map((paragraph, index) => (
              <p key={index} className={index > 0 ? 'mt-4' : undefined}>
                {paragraph}
              </p>
            ))}

            {section.list && section.list.length > 0 && (
              <ul className="list-disc pl-6 mt-4 space-y-2">
                {section.list.map((item, index) => renderListItem(item, index))}
              </ul>
            )}

            {section.afterList?.map((paragraph, index) => (
              <p key={index} className="mt-4">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section id="contact" className="scroll-mt-24 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-dark-text mb-4">{content.contactTitle}</h2>
          <p>{content.contactBody}</p>
        </section>
      </div>
    </div>
  );
}
