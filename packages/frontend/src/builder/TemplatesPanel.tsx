import { useMemo, useState } from "react";
import { SECTION_LABELS } from "./sectionDefaults";
import { pageTemplates, sectionTemplates } from "./templates";

interface TemplatesPanelProps {
  onApplyPageTemplate: (templateId: string) => boolean;
  onInsertSectionTemplate: (templateId: string) => boolean;
}

export function TemplatesPanel({ onApplyPageTemplate, onInsertSectionTemplate }: TemplatesPanelProps) {
  const [selectedPageTemplateId, setSelectedPageTemplateId] = useState(pageTemplates[0]?.id ?? "");
  const [selectedSectionTemplateId, setSelectedSectionTemplateId] = useState(sectionTemplates[0]?.id ?? "");

  const selectedPageTemplate = useMemo(
    () => pageTemplates.find((template) => template.id === selectedPageTemplateId),
    [selectedPageTemplateId],
  );
  const selectedSectionTemplate = useMemo(
    () => sectionTemplates.find((template) => template.id === selectedSectionTemplateId),
    [selectedSectionTemplateId],
  );

  return (
    <div className="templates-panel">
      <label>
        Full page template
        <select value={selectedPageTemplateId} onChange={(event) => setSelectedPageTemplateId(event.target.value)}>
          {pageTemplates.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
      </label>
      {selectedPageTemplate ? (
        <div className="template-preview">
          <strong>{selectedPageTemplate.name}</strong>
          <p>{selectedPageTemplate.description}</p>
          <span>{selectedPageTemplate.category}</span>
          <ol>
            {selectedPageTemplate.sections.map((section, index) => (
              <li key={`${selectedPageTemplate.id}-${index}`}>{SECTION_LABELS[section.type]}</li>
            ))}
          </ol>
          <button type="button" className="button" onClick={() => onApplyPageTemplate(selectedPageTemplate.id)}>
            Replace page
          </button>
        </div>
      ) : null}

      <label>
        Section template
        <select value={selectedSectionTemplateId} onChange={(event) => setSelectedSectionTemplateId(event.target.value)}>
          {sectionTemplates.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
      </label>
      {selectedSectionTemplate ? (
        <div className="template-preview">
          <strong>{selectedSectionTemplate.name}</strong>
          <p>{selectedSectionTemplate.description}</p>
          <span>{selectedSectionTemplate.category}</span>
          <ol>
            <li>{SECTION_LABELS[selectedSectionTemplate.section.type]}</li>
          </ol>
          <button type="button" className="button" onClick={() => onInsertSectionTemplate(selectedSectionTemplate.id)}>
            Insert section
          </button>
        </div>
      ) : null}
    </div>
  );
}
