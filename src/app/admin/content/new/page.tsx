import { NewCustomPageForm } from './NewCustomPageForm'

export const metadata = {
  title: 'Create Custom Page | Admin',
}

export default function NewCustomPagePage() {
  return (
    <div className="space-y-6">
      <NewCustomPageForm />
    </div>
  )
}
