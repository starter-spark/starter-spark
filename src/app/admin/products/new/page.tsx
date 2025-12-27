import { NewProductForm } from './NewProductForm'

export const metadata = {
  title: 'New Product | Admin',
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          New Product
        </h1>
        <p className="text-slate-600">Create a new product in your catalog</p>
      </div>
      <NewProductForm />
    </div>
  )
}
