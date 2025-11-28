import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "StarterSpark Robotics terms of service.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-mono text-4xl font-bold text-slate-900 mb-8">
            Terms of Service
          </h1>

          <div className="bg-white rounded border border-slate-200 p-8">
            <p className="text-slate-500 font-mono text-sm">
              PLACEHOLDER: Terms of service content will be added here. This page will outline the terms and conditions for using StarterSpark Robotics products and services.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
