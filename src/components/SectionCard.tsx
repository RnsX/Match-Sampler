import * as Separator from '@radix-ui/react-separator'
import type { PropsWithChildren, ReactNode } from 'react'

interface SectionCardProps extends PropsWithChildren {
  title: string
  eyebrow: string
  description: string
  actions?: ReactNode
}

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
}: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <p className="section-card__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-card__description">{description}</p>
        </div>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </div>
      <Separator.Root className="section-card__separator" decorative />
      {children}
    </section>
  )
}
