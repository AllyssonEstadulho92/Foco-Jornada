interface PagePlaceholderProps {
  eyebrow: string
  title: string
  description: string
}

export function PagePlaceholder({ eyebrow, title, description }: PagePlaceholderProps) {
  return (
    <section className="pagePlaceholder" aria-labelledby={`page-${title}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1 id={`page-${title}`}>{title}</h1>
      <p>{description}</p>
      <div className="emptyState">
        <strong>Fundação em preparação</strong>
        <span>A lógica funcional deste módulo será adicionada na fase correspondente.</span>
      </div>
    </section>
  )
}
