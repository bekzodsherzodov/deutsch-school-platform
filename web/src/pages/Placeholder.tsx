import { Card, EmptyState, PageHeader } from '../components/ui'

export default function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon="clipboard" title="Bu bo‘lim tez orada ulanadi"
          text="Dizayn tayyor. Ma’lumotlar eski panelidan bosqichma-bosqich ko‘chiriladi." />
      </Card>
    </div>
  )
}
