import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Database, Zap, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import LogoIcon from '@/components/logo-icon';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 text-indigo-600">
                <LogoIcon className="w-full h-full" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Synthetic Test Data
              <br />
              <span className="text-indigo-600">Without the Risk</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Stop exposing sensitive production data in testing environments. 
              Generate realistic, compliant synthetic data in seconds.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/solutions">
                <Button size="lg" variant="outline">
                  View Solutions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why MockData?
            </h2>
            <p className="text-lg text-gray-600">
              Built for teams that care about security and compliance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Zero Real Data</h3>
              <p className="text-gray-600">
                Eliminate the risk of exposing sensitive customer information in dev/test environments.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-gray-600">
                Meet privacy regulations automatically. No real PII in testing means no compliance issues.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Referential Integrity</h3>
              <p className="text-gray-600">
                Automatically maintains foreign keys, constraints, and relationships across tables.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Setup</h3>
              <p className="text-gray-600">
                Connect your database, detect PII automatically, and generate data in minutes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Detection</h3>
              <p className="text-gray-600">
                AI-powered PII detection identifies sensitive fields automatically across your schema.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Database</h3>
              <p className="text-gray-600">
                Support for PostgreSQL and MySQL, with more databases coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to secure your test data?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start generating synthetic data in under 5 minutes
          </p>
          <Link href="/app">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
