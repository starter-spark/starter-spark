import { createClient } from '@/lib/supabase/server'
import { GenerateLicensesForm } from './GenerateLicensesForm'

export const metadata = {
  title: 'Generate Licenses | Admin',
}

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name')
    .order('name')

  return data ?? []
}

export default async function GenerateLicensesPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Generate Licenses
        </h1>
        <p className="text-slate-600">Create new license codes for products</p>
      </div>
      <GenerateLicensesForm products={products} />
    </div>
  )
}
