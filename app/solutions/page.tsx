import { Building2, Heart, ShoppingCart, Code2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SolutionsPage() {
  const solutions = [
    {
      icon: Building2,
      title: 'Fintech & Banking',
      description: 'Meet PCI-DSS compliance while maintaining realistic test scenarios',
      color: 'indigo',
      benefits: [
        'Zero exposure of real card numbers or account data',
        'Generate realistic transaction patterns for load testing',
        'Maintain complex account relationships and balances',
        'Test fraud detection with synthetic patterns'
      ]
    },
    {
      icon: Heart,
      title: 'Healthcare',
      description: 'HIPAA-compliant testing without compromising patient privacy',
      color: 'green',
      benefits: [
        'No PHI exposure in development environments',
        'Realistic medical data for EHR system testing',
        'Preserve patient-provider-appointment relationships',
        'Test clinical workflows with synthetic records'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce & SaaS',
      description: 'Fast iteration without compromising customer privacy',
      color: 'blue',
      benefits: [
        'Onboard developers instantly with test data',
        'Test order flows with realistic customer behavior',
        'GDPR-compliant testing for European markets',
        'Scale testing with millions of synthetic users'
      ]
    },
    {
      icon: Code2,
      title: 'Software Consultancies',
      description: 'Manage multiple client projects securely',
      color: 'purple',
      benefits: [
        'Quick test data generation for new projects',
        'Demo features without exposing client data',
        'Support diverse database schemas',
        'Reduce onboarding time for new developers'
      ]
    }
  ];

  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const iconColorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="py-20 px-4 bg-white border-b">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Solutions for Every Industry
          </h1>
          <p className="text-xl text-gray-600">
            MockData adapts to your industry's unique compliance and security requirements
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((solution) => {
              const Icon = solution.icon;
              return (
                <Card 
                  key={solution.title}
                  className={`border-2 ${colorClasses[solution.color as keyof typeof colorClasses]} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${iconColorClasses[solution.color as keyof typeof iconColorClasses]}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{solution.title}</h3>
                    <p className="text-gray-600 mb-6">{solution.description}</p>
                    <ul className="space-y-3">
                      {solution.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Common Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="font-semibold mb-2">CI/CD Testing</h3>
              <p className="text-sm text-gray-600">
                Generate fresh test data for every pipeline run
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-semibold mb-2">Developer Onboarding</h3>
              <p className="text-sm text-gray-600">
                New devs get realistic data instantly
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold mb-2">Performance Testing</h3>
              <p className="text-sm text-gray-600">
                Scale to millions of records for load tests
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Demo Environments</h3>
              <p className="text-sm text-gray-600">
                Show features without real customer data
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold mb-2">QA Testing</h3>
              <p className="text-sm text-gray-600">
                Create specific edge cases on demand
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-semibold mb-2">Security Audits</h3>
              <p className="text-sm text-gray-600">
                Pass audits with zero real data exposure
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
